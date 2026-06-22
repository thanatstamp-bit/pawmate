"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  PawPrint,
  Shuffle,
  MessageCircle,
  UserRound,
  CalendarDays,
  Building2,
  Hospital,
  Megaphone,
  BookOpenText,
  Droplet,
  ChevronRight,
  ArrowLeftRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, Chip, Avatar, IconTile, Sheet, Skeleton, cn } from "@/components/ui";

type Tone = "coral" | "teal" | "amber" | "rose" | "blue" | "neutral";

type Pet = {
  id: string;
  name: string;
  species: string;
  breed: string;
  birth_month: string;
  photos: string[];
  modes: string[];
};

type Stats = {
  likesReceived: number;
  matches: number;
  avgRating: number | null;
};

type MenuTile = {
  label: string;
  href: string;
  icon: LucideIcon;
  tone: Tone;
  comingSoon?: boolean;
  requiresPet?: boolean;
};

const SPECIES_LABEL: Record<string, string> = { dog: "สุนัข", cat: "แมว" };

const MAIN_MENU: MenuTile[] = [
  { label: "ปัดการ์ดหาคู่", href: "/app/swipe", icon: Shuffle, tone: "coral", requiresPet: true },
  { label: "แมตช์ & แชท", href: "/app/matches", icon: MessageCircle, tone: "teal", requiresPet: true },
  { label: "โปรไฟล์น้อง", href: "/app/profile", icon: UserRound, tone: "amber" },
  { label: "นัดเล่น", href: "/app/matches?tab=playdates", icon: CalendarDays, tone: "teal", requiresPet: true },
  { label: "ฝากน้อง", href: "#", icon: Building2, tone: "neutral", comingSoon: true },
];

const CARE_MENU: MenuTile[] = [
  { label: "โรงพยาบาลสัตว์ใกล้ฉัน", href: "/app/care/hospitals", icon: Hospital, tone: "teal" },
  { label: "ประกาศสัตว์หาย", href: "/app/care/lost", icon: Megaphone, tone: "rose" },
  { label: "สมุดสุขภาพ", href: "/app/care/health", icon: BookOpenText, tone: "blue" },
  { label: "ศูนย์บริจาคเลือด", href: "/app/care/blood", icon: Droplet, tone: "coral" },
];

function calcAge(birthMonth: string): string {
  const birth = new Date(birthMonth);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (months < 12) return `${months} เดือน`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y} ปี ${m} เดือน` : `${y} ปี`;
}

export default function HomePage() {
  const supabase = createClient();

  const [pets, setPets] = useState<Pet[]>([]);
  const [activePetId, setActivePetId] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({ likesReceived: 0, matches: 0, avgRating: null });
  const [loading, setLoading] = useState(true);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: petsData } = await supabase
        .from("pets")
        .select("id, name, species, breed, birth_month, photos, modes")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true });

      if (!petsData || petsData.length === 0) {
        setLoading(false);
        return;
      }
      setPets(petsData);

      const storedId = localStorage.getItem("pawmate_active_pet_id");
      const resolvedId =
        storedId && petsData.some((p) => p.id === storedId) ? storedId : petsData[0].id;
      setActivePetId(resolvedId);
      localStorage.setItem("pawmate_active_pet_id", resolvedId);

      await loadStats(resolvedId);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadStats(petId: string) {
    const [likesRes, matchesRes, reviewsRes] = await Promise.all([
      supabase.from("likes").select("id", { count: "exact", head: true }).eq("to_pet_id", petId),
      supabase.from("matches").select("id", { count: "exact", head: true })
        .or(`pet_a_id.eq.${petId},pet_b_id.eq.${petId}`),
      supabase.from("reviews").select("rating").eq("reviewed_pet_id", petId),
    ]);

    const ratings = reviewsRes.data ?? [];
    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length) * 10) / 10
        : null;

    setStats({
      likesReceived: likesRes.count ?? 0,
      matches: matchesRes.count ?? 0,
      avgRating,
    });
  }

  function handleSwitchPet(petId: string) {
    setActivePetId(petId);
    localStorage.setItem("pawmate_active_pet_id", petId);
    setSwitcherOpen(false);
    loadStats(petId);
  }

  if (loading) {
    return <HomeSkeleton />;
  }

  const hasPet = pets.length > 0;
  const activePet = hasPet ? pets.find((p) => p.id === activePetId) ?? pets[0] : null;
  const otherPets = pets.filter((p) => p.id !== activePet?.id);

  return (
    <div className="flex flex-col gap-5 px-5 pb-8 pt-5">
      {/* Greeting */}
      <div className="animate-fade-up">
        <p className="text-sm text-ink-3">วันนี้</p>
        <h1 className="text-2xl font-bold tracking-title text-ink">
          สวัสดี{activePet?.name ? `, ${activePet.name}` : ""}
        </h1>
      </div>

      {hasPet && activePet ? (
        <>
          {/* Pet hero card */}
          <Card radius="card" className="animate-fade-up p-4">
            <div className="flex items-start gap-3.5">
              <Avatar src={activePet.photos[0]} name={activePet.name} size={72} square />
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="font-bold tracking-tight2 text-ink">{activePet.name}</p>
                <p className="mt-0.5 text-xs text-ink-2">
                  {SPECIES_LABEL[activePet.species] ?? activePet.species} · {activePet.breed} ·{" "}
                  {calcAge(activePet.birth_month)}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {activePet.modes.includes("playdate") && <Chip tone="teal">หาเพื่อนเล่น</Chip>}
                  {activePet.modes.includes("breeding") && <Chip tone="amber">หาคู่</Chip>}
                </div>
                {otherPets.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSwitcherOpen(true)}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-chip bg-fill-1 px-2.5 py-1 text-[11px] font-medium text-ink-2 transition-transform active:scale-95"
                  >
                    <ArrowLeftRight size={12} />
                    สลับน้อง
                  </button>
                )}
              </div>
            </div>
          </Card>

          {/* Stats row */}
          <div className="flex gap-2.5">
            <StatTile value={stats.likesReceived} label="ไลก์ที่ได้รับ" />
            <StatTile value={stats.matches} label="แมตช์ทั้งหมด" />
            <StatTile value={stats.avgRating !== null ? stats.avgRating.toFixed(1) : "—"} label="รีวิวเฉลี่ย" />
          </div>

          {/* Primary CTA */}
          <Link
            href="/app/swipe"
            className="cta-sheen flex h-14 animate-cta-pulse items-center justify-center gap-2 rounded-2xl bg-gradient-cta text-[17px] font-bold tracking-tight2 text-white shadow-cta transition-transform active:scale-[.97]"
          >
            <Shuffle size={20} />
            ปัดการ์ดเลย
          </Link>
        </>
      ) : (
        <>
          {/* Empty pet state */}
          <div className="rounded-card border-2 border-dashed border-black/10 bg-white/70 p-6 text-center">
            <IconTile tone="coral" size={52} rounded="rounded-full" className="mx-auto mb-2.5">
              <PawPrint size={24} />
            </IconTile>
            <p className="font-bold tracking-tight2 text-ink">ยังไม่มีโปรไฟล์น้อง</p>
            <p className="mt-1 text-xs text-ink-2">
              เพิ่มน้องของคุณเพื่อเริ่มต้นหาคู่และเพื่อนเล่น
            </p>
            <Link
              href="/onboarding"
              className="mt-3.5 flex h-11 items-center justify-center rounded-2xl bg-gradient-cta text-sm font-bold text-white shadow-cta"
            >
              สร้างโปรไฟล์น้อง
            </Link>
          </div>

          {/* Stats row — empty */}
          <div className="flex gap-2.5">
            <StatTile value="—" label="ไลก์ที่ได้รับ" muted />
            <StatTile value="—" label="แมตช์" muted />
            <StatTile value="—" label="รีวิว" muted />
          </div>

          {/* CTA disabled */}
          <div className="flex h-14 items-center justify-center rounded-2xl bg-black/[.04] font-bold text-ink-3">
            ปัดการ์ดเลย
          </div>
        </>
      )}

      {/* เมนูหลัก */}
      <div>
        <p className="mb-2.5 text-[15px] font-bold tracking-tight2 text-ink">เมนูหลัก</p>
        <div className="grid grid-cols-3 gap-2.5">
          {MAIN_MENU.map((tile) => (
            <MenuTileButton key={tile.label} tile={tile} dimmed={!hasPet && !!tile.requiresPet} />
          ))}
        </div>
      </div>

      {/* ดูแลน้อง */}
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-[15px] font-bold tracking-tight2 text-ink">ดูแลน้อง</p>
          <Link href="/app/care" className="flex items-center gap-0.5 text-xs font-semibold text-coral-ink">
            ดูทั้งหมด
            <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {CARE_MENU.map((tile) => (
            <CareTileButton key={tile.label} tile={tile} />
          ))}
        </div>
      </div>

      {/* Pet switcher sheet */}
      <Sheet open={switcherOpen} onClose={() => setSwitcherOpen(false)} title="สลับน้อง">
        <div className="flex flex-col gap-2">
          {pets.map((pet) => (
            <button
              key={pet.id}
              type="button"
              onClick={() => handleSwitchPet(pet.id)}
              className={cn(
                "flex items-center gap-3 rounded-2xl p-2.5 text-left transition-colors",
                pet.id === activePet?.id ? "bg-coral/10" : "hover:bg-fill-1",
              )}
            >
              <Avatar src={pet.photos[0]} name={pet.name} size={48} square />
              <span className="font-bold tracking-tight2 text-ink">{pet.name}</span>
              {pet.id === activePet?.id && (
                <span className="ml-auto rounded-full bg-coral/15 px-2 py-0.5 text-[10px] font-bold text-coral">
                  กำลังใช้อยู่
                </span>
              )}
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

function StatTile({ value, label, muted }: { value: string | number; label: string; muted?: boolean }) {
  return (
    <Card className="flex-1 py-3 text-center">
      <p className={cn("text-2xl font-bold tabular-nums tracking-title", muted ? "text-black/15" : "text-ink")}>
        {value}
      </p>
      <p className={cn("mt-0.5 text-[11px] font-medium", muted ? "text-black/20" : "text-ink-2")}>{label}</p>
    </Card>
  );
}

function MenuTileButton({ tile, dimmed }: { tile: MenuTile; dimmed: boolean }) {
  const Icon = tile.icon;
  const isDisabled = tile.comingSoon || dimmed;

  const inner = (
    <Card interactive={!isDisabled} className={cn("relative flex flex-col items-center gap-2 py-3.5", isDisabled && "opacity-45")}>
      {tile.comingSoon && (
        <span className="absolute right-1.5 top-1.5 rounded-lg bg-amber px-1.5 py-0.5 text-[8px] font-bold text-white">
          เร็วๆ นี้
        </span>
      )}
      <IconTile tone={tile.tone} size={44} className="rounded-xl">
        <Icon size={20} />
      </IconTile>
      <span className="text-center text-[11px] font-semibold leading-tight text-ink">{tile.label}</span>
    </Card>
  );

  if (isDisabled) return inner;
  return <Link href={tile.href}>{inner}</Link>;
}

function CareTileButton({ tile }: { tile: MenuTile }) {
  const Icon = tile.icon;
  const inner = (
    <Card interactive={!tile.comingSoon} className={cn("relative flex min-h-16 items-center gap-3 p-3.5", tile.comingSoon && "opacity-60")}>
      {tile.comingSoon && (
        <span className="absolute right-2 top-2 rounded-lg bg-amber px-1.5 py-0.5 text-[8px] font-bold text-white">
          เร็วๆ นี้
        </span>
      )}
      <IconTile tone={tile.tone} size={40} className="rounded-xl">
        <Icon size={19} />
      </IconTile>
      <p className="text-xs font-bold leading-tight text-ink">{tile.label}</p>
    </Card>
  );

  if (tile.comingSoon) return inner;
  return <Link href={tile.href}>{inner}</Link>;
}

function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-5 px-5 pb-8 pt-5">
      <div>
        <Skeleton rounded="rounded" className="mb-1.5 h-3.5 w-10" />
        <Skeleton rounded="rounded" className="h-6 w-36" />
      </div>
      <Skeleton rounded="rounded-card" className="h-[104px]" />
      <div className="flex gap-2.5">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[62px] flex-1" />
        ))}
      </div>
      <Skeleton rounded="rounded-2xl" className="h-14" />
      <div>
        <Skeleton rounded="rounded" className="mb-3 h-3.5 w-20" />
        <div className="grid grid-cols-3 gap-2.5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-[82px]" />
          ))}
        </div>
      </div>
      <div>
        <Skeleton rounded="rounded" className="mb-3 h-3.5 w-20" />
        <div className="grid grid-cols-2 gap-2.5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    </div>
  );
}
