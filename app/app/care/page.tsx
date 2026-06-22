"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Hospital, Megaphone, Droplet, BookOpenText, Bell, ChevronRight, Stethoscope, HeartPulse } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { IconTile, cn } from "@/components/ui";

const CARE_CARDS = [
  {
    label: "โรงพยาบาลสัตว์ใกล้ฉัน",
    subtitle: "หาที่ใกล้คุณ · เปิด 24 ชม.",
    href: "/app/care/hospitals",
    icon: Hospital,
    tone: "teal" as const,
    comingSoon: false,
  },
  {
    label: "ประกาศสัตว์หาย",
    subtitle: "ตามหา · แจ้งเบาะแส",
    href: "/app/care/lost",
    icon: Megaphone,
    tone: "rose" as const,
    comingSoon: false,
  },
  {
    label: "ศูนย์บริจาคเลือด",
    subtitle: "หาผู้บริจาคด่วน",
    href: "/app/care/blood",
    icon: Droplet,
    tone: "rose" as const,
    comingSoon: false,
  },
  {
    label: "สมุดสุขภาพ",
    subtitle: "วัคซีน · นัดหมาย",
    href: "/app/care/health",
    icon: BookOpenText,
    tone: "blue" as const,
    comingSoon: false,
  },
  {
    label: "ปรึกษาสัตวแพทย์",
    subtitle: "ปรึกษาออนไลน์",
    href: "/app/care/vet-online",
    icon: Stethoscope,
    tone: "coral" as const,
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
      {/* Header — back + title + subtitle (matches the Care mockup) */}
      <div className="flex shrink-0 items-center gap-3 px-[22px] pb-2 pt-1">
        <Link
          href="/app/home"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border-[1.5px] border-line bg-white text-ink shadow-[0_6px_16px_-10px_rgba(120,72,60,.3)] transition-transform active:scale-95"
        >
          <ChevronLeft size={20} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] font-bold leading-[1.1] tracking-title text-ink">ดูแลน้อง</h1>
          <p className="text-[13px] text-ink-2">บริการดูแลน้องครบในที่เดียว</p>
        </div>
      </div>

      <div className="px-[22px] pb-24 pt-2">
        {/* Reminder banner — amber when due items exist, else teal "all good" */}
        {dueCount > 0 ? (
          <Link
            href="/app/care/health"
            className="mb-6 flex items-center gap-3 rounded-panel border border-amber/50 bg-amber-soft p-3.5 shadow-[0_8px_22px_-14px_rgba(196,144,16,.4)] transition-transform active:scale-[.99]"
          >
            <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] bg-amber/30">
              <Bell size={20} className="text-amber-deep" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-bold leading-tight text-ink">
                มี {dueCount} รายการใกล้ถึงกำหนด
              </p>
              <p className="mt-px text-[12.5px] font-semibold text-amber-deep">แตะเพื่อดูสมุดสุขภาพของน้อง</p>
            </div>
            <ChevronRight size={16} className="shrink-0 text-amber-deep" />
          </Link>
        ) : (
          <div className="mb-6 flex items-center gap-3 rounded-panel border border-teal/40 bg-teal-soft p-3.5">
            <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] bg-teal/25">
              <HeartPulse size={20} className="text-teal-ink" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-bold leading-tight text-ink">น้องสุขภาพดี ไม่มีนัดใกล้ถึงกำหนด</p>
              <p className="mt-px text-[12.5px] font-semibold text-teal-ink">ดูแลน้องได้ดีมากเลย</p>
            </div>
          </div>
        )}

        <p className="mb-3 px-0.5 text-[15px] font-bold tracking-tight2 text-ink">บริการดูแลน้อง</p>

        <div className="grid grid-cols-2 gap-[13px]">
          {CARE_CARDS.map((card) => {
            const Icon = card.icon;
            const isHealth = card.href === "/app/care/health";
            const showDueBadge = isHealth && dueCount > 0;

            const inner = (
              <div
                className={cn(
                  "relative flex min-h-[154px] flex-col rounded-card bg-white p-4 shadow-card transition-transform active:scale-[.97]",
                  card.comingSoon && "opacity-60",
                )}
              >
                {card.comingSoon && (
                  <span className="absolute right-3.5 top-3.5 rounded-lg bg-amber px-2 py-[3px] text-[10px] font-bold tracking-wide text-white">
                    เร็วๆ นี้
                  </span>
                )}
                {showDueBadge && (
                  <span className="absolute right-3.5 top-3.5 flex h-5 min-w-5 items-center justify-center rounded-lg bg-coral px-1.5 text-[10px] font-bold tabular-nums text-white">
                    {dueCount}
                  </span>
                )}
                <IconTile tone={card.tone} size={46} rounded="rounded-[14px]">
                  <Icon size={22} />
                </IconTile>
                <div className="flex-1" />
                <p className="mt-3.5 text-[15px] font-bold leading-[1.25] tracking-tight2 text-ink">
                  {card.label}
                </p>
                <p className="mt-[3px] text-xs font-medium text-ink-2">{card.subtitle}</p>
                {!card.comingSoon && (
                  <ChevronRight size={16} className="absolute bottom-4 right-4 text-ink-3" />
                )}
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
