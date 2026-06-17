"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, CalendarDays, MapPin, Clock, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getBlockedPetIds } from "@/lib/blocks";

// ── Types ─────────────────────────────────────────────────────────────────────

type MatchRow = {
  id: string;
  mode: "playdate" | "breeding";
  otherPet: { id: string; name: string; photos: string[] };
  lastMessage: string | null;
  lastFromOther: boolean;
};

type PlaydateRow = {
  proposalId: string;
  matchId: string;
  status: "pending" | "accepted";
  proposedAt: string;
  location: string;
  isProposer: boolean;
  otherPet: { name: string; photos: string[] };
};

// ── Date helpers ──────────────────────────────────────────────────────────────

const FULL_DAY   = ["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์","เสาร์"];
const SHORT_MON  = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

function formatPlaydate(iso: string): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  return `${FULL_DAY[d.getDay()]} ${d.getDate()} ${SHORT_MON[d.getMonth()]} · ${time} น.`;
}

function isPast(iso: string) {
  return new Date(iso) < new Date();
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MatchesPage() {
  const supabase = createClient();

  const [tab,       setTab]       = useState<"chat" | "playdates">("chat");
  const [matches,   setMatches]   = useState<MatchRow[]>([]);
  const [playdates, setPlaydates] = useState<PlaydateRow[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [myPetId,   setMyPetId]   = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Mirror the same active-pet resolution as swipe page
      const storedId = localStorage.getItem("pawmate_active_pet_id");
      let myPet: { id: string } | null = null;

      if (storedId) {
        const { data } = await supabase
          .from("pets").select("id")
          .eq("owner_id", user.id).eq("id", storedId)
          .maybeSingle();
        myPet = data;
      }
      if (!myPet) {
        const { data } = await supabase
          .from("pets").select("id")
          .eq("owner_id", user.id)
          .limit(1).maybeSingle();
        myPet = data;
        if (myPet) localStorage.setItem("pawmate_active_pet_id", myPet.id);
      }

      if (!myPet) { setLoading(false); return; }
      setMyPetId(myPet.id);

      // ── Fetch matches ──────────────────────────────────────────────────────
      const { data: matchData } = await supabase
        .from("matches")
        .select("id, mode, pet_a_id, pet_b_id")
        .or(`pet_a_id.eq.${myPet.id},pet_b_id.eq.${myPet.id}`)
        .order("created_at", { ascending: false });

      if (!matchData?.length) { setLoading(false); return; }

      // Hide matches with pets blocked in either direction (never deletes data).
      const blockedIds = await getBlockedPetIds(supabase, myPet.id);
      const visibleMatches = matchData.filter((m) => {
        const otherId = m.pet_a_id === myPet.id ? m.pet_b_id : m.pet_a_id;
        return !blockedIds.has(otherId);
      });

      if (!visibleMatches.length) { setLoading(false); return; }

      const otherIds  = visibleMatches.map((m) => m.pet_a_id === myPet.id ? m.pet_b_id : m.pet_a_id);
      const matchIds  = visibleMatches.map((m) => m.id);
      const { data: petsData } = await supabase
        .from("pets")
        .select("id, name, photos")
        .in("id", otherIds);
      const petMap = new Map(petsData?.map((p) => [p.id, p]) ?? []);

      const rows: MatchRow[] = [];
      for (const m of visibleMatches) {
        const otherId  = m.pet_a_id === myPet.id ? m.pet_b_id : m.pet_a_id;
        const otherPet = petMap.get(otherId);
        if (!otherPet) continue;

        const { data: lastMsg } = await supabase
          .from("messages")
          .select("content, sender_pet_id")
          .eq("match_id", m.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        rows.push({
          id: m.id, mode: m.mode, otherPet,
          lastMessage:   lastMsg?.content ?? null,
          lastFromOther: lastMsg?.sender_pet_id === otherId,
        });
      }
      setMatches(rows);

      // ── Fetch playdate proposals ───────────────────────────────────────────
      const { data: proposalData } = await supabase
        .from("playdate_proposals")
        .select(`
          id, match_id, proposer_pet_id, proposed_at, custom_location, status,
          spot:playdate_spots(name)
        `)
        .in("match_id", matchIds)
        .in("status", ["pending", "accepted"])
        .order("created_at", { ascending: false });

      // Keep only the latest proposal per match
      const latestPerMatch = new Map<string, typeof proposalData extends (infer T)[] | null ? T : never>();
      for (const p of proposalData ?? []) {
        if (!latestPerMatch.has(p.match_id)) latestPerMatch.set(p.match_id, p);
      }

      const playdateRows: PlaydateRow[] = [];
      for (const p of Array.from(latestPerMatch.values())) {
        const otherId  = matchData.find((m) => m.id === p.match_id)
          ? (matchData.find((m) => m.id === p.match_id)!.pet_a_id === myPet.id
              ? matchData.find((m) => m.id === p.match_id)!.pet_b_id
              : matchData.find((m) => m.id === p.match_id)!.pet_a_id)
          : null;
        const otherPet = otherId ? petMap.get(otherId) : null;
        if (!otherPet) continue;

        const spotArr  = p.spot as { name: string }[] | null;
        const spotName = Array.isArray(spotArr) ? (spotArr[0]?.name ?? null) : null;
        playdateRows.push({
          proposalId:  p.id,
          matchId:     p.match_id,
          status:      p.status as "pending" | "accepted",
          proposedAt:  p.proposed_at,
          location:    spotName ?? p.custom_location ?? "ไม่ระบุสถานที่",
          isProposer:  p.proposer_pet_id === myPet.id,
          otherPet,
        });
      }

      // Sort: upcoming first, then past
      playdateRows.sort((a, b) =>
        new Date(a.proposedAt).getTime() - new Date(b.proposedAt).getTime()
      );
      setPlaydates(playdateRows);
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <MessageCircle size={36} className="animate-pulse text-coral" />
      </div>
    );
  }

  const upcomingPlaydates = playdates.filter((p) => !isPast(p.proposedAt));
  const pastPlaydates     = playdates.filter((p) => isPast(p.proposedAt));

  // ── Empty state (no matches at all) ───────────────────────────────────────
  if (matches.length === 0) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-card">
          <MessageCircle size={36} className="text-brown-muted" />
        </div>
        <div>
          <p className="font-bold text-brown">ยังไม่มีแมตช์</p>
          <p className="mt-1 text-sm text-brown-muted">ไปปัดการ์ดกันเถอะ!</p>
        </div>
        <Link href="/app/swipe" className="rounded-full bg-coral px-6 py-3 font-bold text-white">
          ไปปัดการ์ด
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Page header + segment control */}
      <div className="px-5 pb-3 pt-6">
        <h1 className="mb-3 text-xl font-bold text-brown">แมตช์ของฉัน</h1>
        <div className="flex rounded-full bg-white p-1 shadow-card">
          <button
            type="button"
            onClick={() => setTab("chat")}
            className={`flex-1 rounded-full py-2 text-sm font-bold transition-all ${
              tab === "chat" ? "bg-coral text-white" : "text-brown-muted"
            }`}
          >
            แชท
          </button>
          <button
            type="button"
            onClick={() => setTab("playdates")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-full py-2 text-sm font-bold transition-all ${
              tab === "playdates" ? "bg-teal text-white" : "text-brown-muted"
            }`}
          >
            <CalendarDays size={14} />
            นัดหมาย
            {playdates.filter(p => p.status === "pending").length > 0 && (
              <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                tab === "playdates" ? "bg-white text-teal" : "bg-coral text-white"
              }`}>
                {playdates.filter(p => p.status === "pending").length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Chat tab ──────────────────────────────────────────────────────── */}
      {tab === "chat" && (
        <ul>
          {matches.map((m) => (
            <li key={m.id}>
              <Link
                href={`/app/chat/${m.id}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/60 active:bg-white"
              >
                <div className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.otherPet.photos[0]}
                    alt={m.otherPet.name}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                  {m.lastFromOther && (
                    <span className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-cream bg-coral" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-brown">{m.otherPet.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        m.mode === "playdate"
                          ? "bg-teal/15 text-teal-dark"
                          : "bg-amber/20 text-amber-dark"
                      }`}
                    >
                      {m.mode === "playdate" ? "เพื่อนเล่น" : "หาคู่"}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-brown-muted">
                    {m.lastMessage ?? "เริ่มคุยกันเลย!"}
                  </p>
                </div>
              </Link>
              <div className="mx-5 h-px bg-black/5" />
            </li>
          ))}
        </ul>
      )}

      {/* ── Playdates tab ─────────────────────────────────────────────────── */}
      {tab === "playdates" && (
        <div className="px-5 pb-6">
          {playdates.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-card">
                <CalendarDays size={28} className="text-brown-muted" />
              </div>
              <p className="font-bold text-brown">ยังไม่มีนัดหมาย</p>
              <p className="text-sm text-brown-muted">
                เข้าแชทกับคู่แมตช์ แล้วกดไอคอนปฏิทินเพื่อนัดหมาย
              </p>
              <button
                type="button"
                onClick={() => setTab("chat")}
                className="rounded-full border-2 border-teal px-5 py-2.5 text-sm font-bold text-teal"
              >
                ไปที่แชท
              </button>
            </div>
          ) : (
            <>
              {/* Upcoming */}
              {upcomingPlaydates.length > 0 && (
                <div className="mb-6">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-brown-muted">
                    กำลังจะมาถึง
                  </p>
                  <div className="flex flex-col gap-3">
                    {upcomingPlaydates.map((p) => (
                      <PlaydateCard key={p.proposalId} p={p} myPetId={myPetId} />
                    ))}
                  </div>
                </div>
              )}

              {/* Past */}
              {pastPlaydates.length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-brown-muted">
                    ที่ผ่านมา
                  </p>
                  <div className="flex flex-col gap-3">
                    {pastPlaydates.map((p) => (
                      <PlaydateCard key={p.proposalId} p={p} myPetId={myPetId} past />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Playdate card sub-component ───────────────────────────────────────────────

function PlaydateCard({
  p,
  myPetId,
  past = false,
}: {
  p: PlaydateRow;
  myPetId: string | null;
  past?: boolean;
}) {
  const statusColor =
    past             ? "bg-black/5 border-black/10"
    : p.status === "accepted" ? "bg-teal/8 border-teal/30"
    : p.isProposer   ? "bg-amber/8 border-amber/30"
    :                  "bg-coral/8 border-coral/30";

  const statusBadge =
    past             ? null
    : p.status === "accepted" ? (
      <span className="flex items-center gap-1 rounded-full bg-teal/15 px-2 py-0.5 text-[10px] font-bold text-teal-dark">
        <CheckCircle2 size={10} /> ยืนยันแล้ว
      </span>
    ) : p.isProposer ? (
      <span className="flex items-center gap-1 rounded-full bg-amber/20 px-2 py-0.5 text-[10px] font-bold text-amber-dark">
        <Clock size={10} /> รอตอบรับ
      </span>
    ) : (
      <span className="flex items-center gap-1 rounded-full bg-coral/15 px-2 py-0.5 text-[10px] font-bold text-coral">
        <CalendarDays size={10} /> รอคุณตอบ
      </span>
    );

  return (
    <Link
      href={`/app/chat/${p.matchId}`}
      className={`flex items-center gap-3 rounded-2xl border-2 p-4 transition-all hover:shadow-card ${statusColor}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={p.otherPet.photos[0]}
        alt={p.otherPet.name}
        className={`h-12 w-12 rounded-full object-cover ${past ? "opacity-60" : ""}`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`font-bold ${past ? "text-brown-muted" : "text-brown"}`}>
            {p.otherPet.name}
          </span>
          {statusBadge}
        </div>
        <p className={`mt-0.5 text-xs ${past ? "text-brown-muted/70" : "text-brown-muted"}`}>
          {formatPlaydate(p.proposedAt)}
        </p>
        <div className={`mt-0.5 flex items-center gap-1 text-xs ${past ? "text-brown-muted/70" : "text-brown-muted"}`}>
          <MapPin size={11} />
          <span className="truncate">{p.location}</span>
        </div>
      </div>
    </Link>
  );
}
