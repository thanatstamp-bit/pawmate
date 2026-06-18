"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Hospital, Megaphone, Droplet, BookOpenText, Bell, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const CARE_CARDS = [
  {
    label: "โรงพยาบาลสัตว์\nใกล้ฉัน",
    subtitle: "ค้นหา รพ.สัตว์และคลินิก",
    href: "/app/care/hospitals",
    icon: Hospital,
    comingSoon: false,
  },
  {
    label: "ประกาศสัตว์หาย",
    subtitle: "ลงประกาศ / ตามหาน้อง",
    href: "/app/care/lost",
    icon: Megaphone,
    comingSoon: false,
  },
  {
    label: "ศูนย์บริจาคเลือด",
    subtitle: "หาผู้บริจาคเลือดสัตว์",
    href: "/app/care/blood",
    icon: Droplet,
    comingSoon: false,
  },
  {
    label: "สมุดสุขภาพ",
    subtitle: "วัคซีน นัดหมอ บันทึกสุขภาพ",
    href: "/app/care/health",
    icon: BookOpenText,
    comingSoon: false,
  },
];

export default function CareHubPage() {
  const supabase = createClient();
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const storedId = localStorage.getItem("pawmate_active_pet_id");
      let petId: string | null = storedId;

      if (!petId) {
        const { data } = await supabase
          .from("pets")
          .select("id")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        petId = data?.id ?? null;
      }

      if (!petId) return;

      const today = new Date().toISOString().slice(0, 10);
      const in30 = new Date();
      in30.setDate(in30.getDate() + 30);
      const in30Str = in30.toISOString().slice(0, 10);

      const { count } = await supabase
        .from("health_records")
        .select("id", { count: "exact", head: true })
        .eq("pet_id", petId)
        .not("next_due_date", "is", null)
        .gte("next_due_date", today)
        .lte("next_due_date", in30Str);

      setDueCount(count ?? 0);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center gap-1 border-b border-black/5 px-1">
        <Link
          href="/app/home"
          className="flex h-11 w-11 shrink-0 items-center justify-center text-brown"
        >
          <ChevronLeft size={20} />
        </Link>
        <Link href="/app/home" className="flex flex-1 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="PawMate" className="h-9 w-9 object-contain drop-shadow-sm" />
          <span className="text-xl font-medium text-brown">PawMate</span>
        </Link>
      </div>

      <div className="px-5 pb-8 pt-6">
        <h1 className="mb-5 text-2xl font-bold text-brown">ดูแลน้อง</h1>

        {/* Reminder banner */}
        {dueCount > 0 && (
          <Link
            href="/app/care/health"
            className="mb-5 flex items-center gap-3 rounded-xl border px-4 py-3.5"
            style={{
              background: "rgba(255,184,76,0.10)",
              borderColor: "rgba(255,184,76,0.40)",
              borderWidth: "1.5px",
            }}
          >
            <Bell size={18} style={{ color: "#b08000", flexShrink: 0 }} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-brown">
                มี {dueCount} รายการใกล้ถึงกำหนด
              </p>
              <p className="text-xs text-brown-muted">วัคซีน + นัดหมอ → สมุดสุขภาพ</p>
            </div>
            <ChevronRight size={16} className="shrink-0 text-brown-muted" />
          </Link>
        )}

        <div className="grid grid-cols-2 gap-3.5">
          {CARE_CARDS.map((card) => {
            const Icon = card.icon;
            const isHealth = card.href === "/app/care/health";
            const showDueBadge = isHealth && dueCount > 0;

            const inner = (
              <div
                className={`relative flex min-h-[140px] flex-col gap-3 rounded-card bg-white p-4 shadow-card ${
                  card.comingSoon ? "opacity-60" : ""
                } ${showDueBadge ? "border-[1.5px] border-amber/50 bg-amber/5" : ""}`}
              >
                {card.comingSoon && (
                  <span className="absolute right-3 top-3 rounded-md bg-amber px-1.5 py-0.5 text-[10px] font-bold text-white">
                    เร็วๆ นี้
                  </span>
                )}
                {showDueBadge && (
                  <span className="absolute right-3 top-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber px-1.5 text-[10px] font-bold text-white">
                    {dueCount}
                  </span>
                )}
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cream">
                  <Icon size={22} className="text-brown-muted" />
                </div>
                <div>
                  <p className="whitespace-pre-line text-sm font-bold leading-tight text-brown">
                    {card.label}
                  </p>
                  <p className="mt-1 text-[11px] leading-tight text-brown-muted">
                    {card.subtitle}
                  </p>
                </div>
              </div>
            );

            return card.comingSoon ? (
              <div key={card.label}>{inner}</div>
            ) : (
              <Link key={card.label} href={card.href}>
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
