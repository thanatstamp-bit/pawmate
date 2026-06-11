"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SlidersHorizontal, PawPrint } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { checkAndCreateMatch } from "@/lib/match";
import PetCard, { type PetCardData } from "@/components/swipe/PetCard";
import MatchPopup from "@/components/swipe/MatchPopup";
import FilterSheet, { type SwipeFilters } from "@/components/swipe/FilterSheet";

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

export default function SwipePage() {
  const supabase = createClient();

  const [myPet, setMyPet] = useState<MyPet | null>(null);
  const [mode, setMode] = useState<Mode>("playdate");
  const [cards, setCards] = useState<PetCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<SwipeFilters>({ province: "" });
  const [match, setMatch] = useState<MatchResult | null>(null);

  // Track skips/likes in session memory so cards don't repeat
  const skippedIds = useRef<Set<string>>(new Set());
  const likedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("pets")
        .select("id, species, breed, sex, modes, photos, name")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (data) {
        setMyPet(data);
        if (!data.modes.includes("playdate") && data.modes.includes("breeding")) {
          setMode("breeding");
        }
      }
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCards = useCallback(async () => {
    if (!myPet) return;
    setLoading(true);

    // Fetch pets already liked by myPet in this mode (across all sessions)
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

    if (filters.province) {
      query = query.eq("province", filters.province);
    }

    const { data } = await query.limit(50);
    if (!data) { setLoading(false); return; }

    const seen = new Set([
      ...Array.from(skippedIds.current),
      ...Array.from(likedIds.current),
      ...Array.from(prevLikedIds),
    ]);
    setCards(data.filter((p) => !seen.has(p.id)));
    setLoading(false);
  }, [myPet, mode, filters, supabase]);

  useEffect(() => {
    if (myPet) fetchCards();
  }, [myPet, fetchCards]);

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

    const matchId = await checkAndCreateMatch(supabase, myPet.id, target.id, mode);
    if (matchId) setMatch({ matchId, theirPet: target });
  }

  function handleSkip() {
    if (cards.length === 0) return;
    skippedIds.current.add(cards[0].id);
    setCards((prev) => prev.slice(1));
  }

  function handleFilterChange(f: SwipeFilters) {
    setFilters(f);
    skippedIds.current = new Set();
    likedIds.current = new Set();
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
    <div className="flex min-h-screen flex-col bg-cream">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pb-2 pt-5">
        <h1 className="text-xl font-bold text-brown">PawMate</h1>
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className="flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-sm font-bold shadow-card"
        >
          <SlidersHorizontal size={16} />
          {filters.province || "ทุกที่"}
        </button>
      </div>

      {/* Mode toggle — only shown when pet has both modes */}
      {availableModes.length > 1 && (
        <div className="mx-5 mb-4 flex rounded-full bg-white p-1 shadow-card">
          <button
            type="button"
            onClick={() => setMode("playdate")}
            className={`flex-1 rounded-full py-2 text-sm font-bold transition-all ${
              mode === "playdate" ? "bg-teal text-white" : "text-brown-muted"
            }`}
          >
            หาเพื่อนเล่น
          </button>
          <button
            type="button"
            onClick={() => setMode("breeding")}
            className={`flex-1 rounded-full py-2 text-sm font-bold transition-all ${
              mode === "breeding" ? "bg-amber text-white" : "text-brown-muted"
            }`}
          >
            หาคู่
          </button>
        </div>
      )}

      {/* Card area */}
      <div className="relative flex-1 px-5">
        {loading ? (
          <div className="flex h-[60vh] items-center justify-center">
            <PawPrint size={36} className="animate-pulse text-coral" />
          </div>
        ) : cards.length === 0 ? (
          <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-card">
              <PawPrint size={36} className="text-brown-muted" />
            </div>
            <div>
              <p className="font-bold text-brown">การ์ดหมดแล้ว</p>
              <p className="mt-1 text-sm text-brown-muted">
                ลองเปลี่ยน filter หรือกลับมาใหม่นะ
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="rounded-full border-2 border-coral px-5 py-2.5 font-bold text-coral"
            >
              เปลี่ยน filter
            </button>
          </div>
        ) : (
          <div className="relative pb-6 pt-2">
            {cards[1] && (
              <PetCard
                pet={cards[1]}
                mode={mode}
                onLike={() => {}}
                onSkip={() => {}}
                isTop={false}
              />
            )}
            <PetCard
              pet={cards[0]}
              mode={mode}
              onLike={handleLike}
              onSkip={handleSkip}
              isTop={true}
            />
          </div>
        )}
      </div>

      {filterOpen && (
        <FilterSheet
          filters={filters}
          onChange={(f) => { handleFilterChange(f); setFilterOpen(false); }}
          onClose={() => setFilterOpen(false)}
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
