"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SlidersHorizontal, PawPrint, Search, RefreshCw, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { checkAndCreateMatch } from "@/lib/match";
import { getBlockedPetIds } from "@/lib/blocks";
import PetCard, { type PetCardData } from "@/components/swipe/PetCard";
import MatchPopup from "@/components/swipe/MatchPopup";
import FilterSheet, {
  type SwipeFilters,
  DEFAULT_FILTERS,
  countActiveFilters,
} from "@/components/swipe/FilterSheet";
import { BREED_SIZE_MAP } from "@/lib/data/breeds";

type Mode = "playdate" | "breeding";

type MyPet = {
  id: string;
  species: string;
  breed: string;
  sex: string;
  modes: string[];
  photos: string[];
  name: string;
};

type MatchResult = {
  matchId: string;
  theirPet: PetCardData;
};

// Demo match counter helpers (module-level to avoid recreating on every render)
function randomThreshold() { return 3 + Math.floor(Math.random() * 5); } // 3–7

export default function SwipePage() {
  const supabase = createClient();

  const [myPet, setMyPet] = useState<MyPet | null>(null);
  const [mode, setMode] = useState<Mode>("playdate");
  const [cards, setCards] = useState<PetCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<SwipeFilters>(DEFAULT_FILTERS);
  const [match, setMatch] = useState<MatchResult | null>(null);
  // Set by the action buttons to drive the top card's fly-off animation.
  const [buttonSwipe, setButtonSwipe] = useState<"like" | "skip" | null>(null);

  // Track skips/likes in session memory so cards don't repeat
  const skippedIds     = useRef<Set<string>>(new Set());
  const likedIds       = useRef<Set<string>>(new Set());
  // Guard against repeated auto-recycle when cards are empty due to filter constraints
  const deckExhausted  = useRef(false);

  // Demo match counter — guarantees at least 1 match within every 10 swipes
  const swipeCount  = useRef(0);
  const forceNext   = useRef(false);
  const matchAt     = useRef(randomThreshold()); // random 3–7

  function tickSwipe() {
    swipeCount.current++;
    if (swipeCount.current >= matchAt.current) forceNext.current = true;
  }
  function resetDemoCounter() {
    swipeCount.current = 0;
    forceNext.current  = false;
    matchAt.current    = randomThreshold();
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const storedId = localStorage.getItem("pawmate_active_pet_id");
      let petData = null;

      if (storedId) {
        const { data } = await supabase
          .from("pets")
          .select("id, species, breed, sex, modes, photos, name")
          .eq("owner_id", user.id)
          .eq("id", storedId)
          .maybeSingle();
        petData = data;
      }

      if (!petData) {
        const { data } = await supabase
          .from("pets")
          .select("id, species, breed, sex, modes, photos, name")
          .eq("owner_id", user.id)
          .limit(1)
          .maybeSingle();
        petData = data;
        if (petData) localStorage.setItem("pawmate_active_pet_id", petData.id);
      }

      if (petData) {
        setMyPet(petData);
        if (!petData.modes.includes("playdate") && petData.modes.includes("breeding")) {
          setMode("breeding");
        }
      }
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // recycle=true → skip "already seen" filtering so the deck refills for demo
  const fetchCards = useCallback(async (recycle = false) => {
    if (!myPet) return;
    setLoading(true);

    // Always exclude DB-liked pets — liked cards must never reappear
    const { data: prevLikes } = await supabase
      .from("likes")
      .select("to_pet_id")
      .eq("from_pet_id", myPet.id)
      .eq("mode", mode);
    const prevLikedIds = new Set((prevLikes ?? []).map((l) => l.to_pet_id));

    let query = supabase
      .from("pets")
      .select("id, name, species, breed, sex, birth_month, photos, personality_tags, province, district, vaccinated, neutered, bio")
      .neq("id", myPet.id)
      .eq("species", myPet.species)
      .contains("modes", [mode]);

    if (mode === "breeding") {
      query = query.eq("breed", myPet.breed).neq("sex", myPet.sex);
    }

    // DB-side filters (server does the heavy lifting)
    if (filters.province) query = query.eq("province", filters.province);
    if (filters.breed && mode !== "breeding") query = query.eq("breed", filters.breed);
    if (filters.vaccinated) query = query.eq("vaccinated", true);
    if (filters.neutered) query = query.eq("neutered", true);
    if (filters.ageMin > 0) {
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - filters.ageMin);
      query = query.lte("birth_month", cutoff.toISOString().slice(0, 10));
    }
    if (filters.ageMax > 0) {
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - filters.ageMax);
      query = query.gte("birth_month", cutoff.toISOString().slice(0, 10));
    }

    const { data } = await query.limit(50);
    if (!data) { setLoading(false); return; }

    // Blocked pets are always excluded, even when recycling the deck.
    const blockedIds = await getBlockedPetIds(supabase, myPet.id);

    const seen = recycle
      // recycle: allow skipped pets back, but never liked or blocked
      ? new Set<string>([...Array.from(prevLikedIds), ...Array.from(blockedIds)])
      : new Set([
          ...Array.from(skippedIds.current),
          ...Array.from(likedIds.current),
          ...Array.from(prevLikedIds),
          ...Array.from(blockedIds),
        ]);
    let result = data.filter((p) => !seen.has(p.id));

    // Client-side filters (size uses breed→size map; tags use overlap check)
    if (filters.size) {
      result = result.filter(
        (p) => (BREED_SIZE_MAP[p.breed] ?? "medium") === filters.size
      );
    }
    if (filters.tags.length > 0) {
      result = result.filter((p) =>
        filters.tags.some((t) => (p.personality_tags ?? []).includes(t))
      );
    }

    // Auto-recycle: deck exhausted → clear only skips (liked cards stay excluded via DB)
    if (result.length === 0 && !recycle) {
      skippedIds.current = new Set();
      fetchCards(true);
      return;
    }

    setCards(result);
    setLoading(false);
  }, [myPet, mode, filters, supabase]);

  useEffect(() => {
    if (myPet) fetchCards();
  }, [myPet, fetchCards]);

  // Auto-recycle: when the user swipes through the whole loaded batch,
  // fetch again (recycle mode) so the deck never stays permanently empty.
  useEffect(() => {
    if (cards.length > 0) { deckExhausted.current = false; return; }
    if (loading || !myPet || deckExhausted.current) return;
    deckExhausted.current = true;
    const t = setTimeout(() => fetchCards(), 600);
    return () => clearTimeout(t);
  }, [cards.length, loading, myPet, fetchCards]);

  // Reset demo counter + recycle guard whenever the swipe mode changes
  useEffect(() => {
    resetDemoCounter();
    deckExhausted.current = false;
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLike() {
    if (!myPet || cards.length === 0) return;
    const target = cards[0];

    likedIds.current.add(target.id);
    setCards((prev) => prev.slice(1));

    await supabase.from("likes").insert({
      from_pet_id: myPet.id,
      to_pet_id: target.id,
      mode,
    });

    let matchId = await checkAndCreateMatch(supabase, myPet.id, target.id, mode);

    // Demo: when swipe threshold is reached and no natural match occurred,
    // call the SECURITY DEFINER RPC to force a mutual like + match record.
    if (!matchId && forceNext.current) {
      const { data } = await supabase.rpc("create_demo_match", {
        p_from_pet: myPet.id,
        p_to_pet:   target.id,
        p_mode:     mode,
      });
      matchId = data ?? null;
    }

    if (matchId) {
      setMatch({ matchId, theirPet: target });
      resetDemoCounter(); // reset for next round
    } else {
      tickSwipe(); // no match yet — count this swipe
    }
  }

  function handleSkip() {
    if (cards.length === 0) return;
    skippedIds.current.add(cards[0].id);
    setCards((prev) => prev.slice(1));
    tickSwipe();
  }

  // Single exit path shared by drag gestures and the action buttons. The card
  // animates itself out, then calls this; we resolve the like/skip + clear the
  // button trigger so the next card (fresh, via key=id) starts clean.
  function onSwipe(dir: "like" | "skip") {
    if (dir === "like") handleLike();
    else handleSkip();
    setButtonSwipe(null);
  }

  // After blocking, the block row is already inserted; just drop the card.
  function handleBlock() {
    if (cards.length === 0) return;
    skippedIds.current.add(cards[0].id);
    setCards((prev) => prev.slice(1));
  }

  function handleFilterChange(f: SwipeFilters) {
    setFilters(f);
    skippedIds.current    = new Set();
    likedIds.current      = new Set();
    deckExhausted.current = false;
    resetDemoCounter();
  }

  const availableModes = myPet?.modes ?? [];

  if (loading && !myPet) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <PawPrint size={40} className="animate-pulse text-coral" />
      </div>
    );
  }

  if (!myPet) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="font-bold text-brown">ยังไม่มีโปรไฟล์น้อง</p>
        <a href="/onboarding" className="rounded-full bg-coral px-6 py-3 font-bold text-white">
          สร้างโปรไฟล์น้อง
        </a>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-5rem)] flex-col overflow-hidden bg-cream">
      {/* Mode toggle + filter — segmented control, no logo header on this screen */}
      <div className="mx-5 mb-3 mt-3 flex shrink-0 items-center gap-3">
        <div className="grid h-10 flex-1 grid-cols-2 gap-0.5 rounded-xl bg-[#EDEAE6] p-[3px]">
          <button
            type="button"
            onClick={() => availableModes.includes("playdate") && setMode("playdate")}
            disabled={!availableModes.includes("playdate")}
            title={!availableModes.includes("playdate") ? "เปิดโหมดนี้ได้ที่หน้าโปรไฟล์" : undefined}
            className={`flex items-center justify-center rounded-[10px] text-sm font-semibold transition-all ${
              mode === "playdate"
                ? "bg-teal text-white"
                : availableModes.includes("playdate")
                ? "text-brown-muted"
                : "cursor-not-allowed text-brown-muted/30"
            }`}
          >
            หาเพื่อนเล่น
          </button>
          <button
            type="button"
            onClick={() => availableModes.includes("breeding") && setMode("breeding")}
            disabled={!availableModes.includes("breeding")}
            title={!availableModes.includes("breeding") ? "เปิดโหมดนี้ได้ที่หน้าโปรไฟล์" : undefined}
            className={`flex items-center justify-center rounded-[10px] text-sm font-semibold transition-all ${
              mode === "breeding"
                ? "bg-amber text-white"
                : availableModes.includes("breeding")
                ? "text-brown-muted"
                : "cursor-not-allowed text-brown-muted/30"
            }`}
          >
            หาคู่
          </button>
        </div>
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDEAE6]"
          title="ตัวกรอง"
        >
          <SlidersHorizontal size={18} className="text-brown" />
          {countActiveFilters(filters) > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-coral text-[10px] font-bold text-white">
              {countActiveFilters(filters)}
            </span>
          )}
        </button>
      </div>

      {/* Card area — fills whatever vertical space is left below the toggle
          row; the card stack below also gets flex-1 so the photo grows to
          fill it. The page root's fixed height + overflow-hidden is what
          actually prevents scrolling, not a capped photo size. */}
      <div className="flex min-h-0 flex-1 flex-col px-5">
        {loading ? (
          <div className="flex h-full min-h-0 w-full max-w-[420px] flex-col overflow-hidden rounded-card bg-white shadow-card">
            <div className="min-h-0 flex-1 animate-pulse bg-black/5" />
            <div className="flex shrink-0 flex-col gap-2.5 p-4">
              <div className="h-5 w-32 animate-pulse rounded bg-black/5" />
              <div className="h-3.5 w-40 animate-pulse rounded bg-black/5" />
              <div className="flex gap-2">
                <div className="h-6 w-24 animate-pulse rounded-full bg-black/5" />
                <div className="h-6 w-20 animate-pulse rounded-full bg-black/5" />
              </div>
            </div>
          </div>
        ) : cards.length === 0 ? (
          <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black/5">
              <Search size={32} strokeWidth={1.5} className="text-brown-muted" />
            </div>
            <div>
              <p className="text-lg font-bold text-brown">ดูครบแล้ว!</p>
              <p className="mt-1.5 text-sm leading-relaxed text-brown-muted">
                ไม่มีน้องใหม่ในตอนนี้
                <br />
                ลองกลับมาดูใหม่ในภายหลัง
              </p>
            </div>
            <button
              type="button"
              onClick={() => fetchCards()}
              className="flex items-center gap-2 rounded-2xl border-2 border-black/10 px-6 py-3 font-semibold text-brown"
            >
              <RefreshCw size={18} />
              ดูใหม่อีกครั้ง
            </button>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="relative min-h-0 flex-1 pb-3 pt-2">
              {cards[1] && (
                <PetCard
                  key={cards[1].id}
                  pet={cards[1]}
                  mode={mode}
                  myPetId={myPet?.id ?? ""}
                  onBlock={() => {}}
                  isTop={false}
                />
              )}
              <PetCard
                key={cards[0].id}
                pet={cards[0]}
                mode={mode}
                myPetId={myPet?.id ?? ""}
                onBlock={handleBlock}
                isTop={true}
                onSwipe={onSwipe}
                triggerSwipe={buttonSwipe}
              />
            </div>

            {/* Action buttons — fixed row below the card, per wireframe */}
            <div className="flex shrink-0 items-center justify-center gap-6 py-3">
              <button
                type="button"
                onClick={() => setButtonSwipe("skip")}
                disabled={buttonSwipe !== null}
                className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-black/10 bg-white shadow-card transition-transform active:scale-95 disabled:opacity-60"
              >
                <X size={28} className="text-brown-muted" />
              </button>
              <button
                type="button"
                onClick={() => setButtonSwipe("like")}
                disabled={buttonSwipe !== null}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-coral shadow-card transition-transform active:scale-95 disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-white">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {filterOpen && myPet && (
        <FilterSheet
          filters={filters}
          onChange={(f) => { handleFilterChange(f); setFilterOpen(false); }}
          onClose={() => setFilterOpen(false)}
          mode={mode}
          species={myPet.species as "dog" | "cat"}
        />
      )}

      {match && myPet && (
        <MatchPopup
          myPhoto={myPet.photos[0]}
          theirPhoto={match.theirPet.photos[0]}
          theirName={match.theirPet.name}
          matchId={match.matchId}
          mode={mode}
          onClose={() => setMatch(null)}
        />
      )}
    </div>
  );
}
