"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type MatchRow = {
  id: string;
  mode: "playdate" | "breeding";
  otherPet: { id: string; name: string; photos: string[] };
  lastMessage: string | null;
  lastFromOther: boolean;
};

export default function MatchesPage() {
  const supabase = createClient();
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: myPet } = await supabase
        .from("pets")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!myPet) { setLoading(false); return; }

      const { data: matchData } = await supabase
        .from("matches")
        .select("id, mode, pet_a_id, pet_b_id")
        .or(`pet_a_id.eq.${myPet.id},pet_b_id.eq.${myPet.id}`)
        .order("created_at", { ascending: false });

      if (!matchData?.length) { setLoading(false); return; }

      const otherIds = matchData.map((m) =>
        m.pet_a_id === myPet.id ? m.pet_b_id : m.pet_a_id
      );

      const { data: petsData } = await supabase
        .from("pets")
        .select("id, name, photos")
        .in("id", otherIds);

      const petMap = new Map(petsData?.map((p) => [p.id, p]) ?? []);

      const rows: MatchRow[] = [];
      for (const m of matchData) {
        const otherId = m.pet_a_id === myPet.id ? m.pet_b_id : m.pet_a_id;
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
          id: m.id,
          mode: m.mode,
          otherPet,
          lastMessage: lastMsg?.content ?? null,
          lastFromOther: lastMsg?.sender_pet_id === otherId,
        });
      }

      setMatches(rows);
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <MessageCircle size={36} className="animate-pulse text-coral" />
      </div>
    );
  }

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
        <Link
          href="/app/swipe"
          className="rounded-full bg-coral px-6 py-3 font-bold text-white"
        >
          ไปปัดการ์ด
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="px-5 pb-3 pt-6">
        <h1 className="text-xl font-bold text-brown">แมตช์ของฉัน</h1>
      </div>
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
    </div>
  );
}
