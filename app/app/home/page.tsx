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
  comingSoon?: boolean;
  requiresPet?: boolean;
};

const SPECIES_LABEL: Record<string, string> = { dog: "สุนัข", cat: "แมว" };

const MAIN_MENU: MenuTile[] = [
  { label: "ปัดการ์ดหาคู่", href: "/app/swipe", icon: Shuffle, requiresPet: true },
  { label: "แมตช์ & แชท", href: "/app/matches", icon: MessageCircle, requiresPet: true },
  { label: "โปรไฟล์น้อง", href: "/app/profile", icon: UserRound },
  { label: "นัดเล่น", href: "/app/matches?tab=playdates", icon: CalendarDays, requiresPet: true },
  { label: "ฝากน้อง", href: "#", icon: Building2, comingSoon: true },
];

const CARE_MENU: MenuTile[] = [
  { label: "โรงพยาบาลสัตว์ใกล้ฉัน", href: "/app/care/hospitals", icon: Hospital },
  { label: "ประกาศสัตว์หาย", href: "/app/care/lost", icon: Megaphone, comingSoon: false },
  { label: "สมุดสุขภาพ", href: "/app/care/health", icon: BookOpenText, comingSoon: false },
  { label: "ศูนย์บริจาคเลือด", href: "/app/care/blood", icon: Droplet, comingSoon: false },
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
      <div>
        <p className="text-sm text-brown-muted/70">วันนี้</p>
        <h1 className="text-xl font-bold text-brown">
          สวัสดี{activePet?.name ? `, ${activePet.name}` : ""}
        </h1>
      </div>

      {hasPet && activePet ? (
        <>
          {/* Pet hero card */}
          <div className="flex items-start gap-3.5 rounded-2xl bg-white p-3.5 shadow-card">
            <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl bg-cream">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activePet.photos[0]}
                alt={activePet.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="font-bold text-brown">{activePet.name}</p>
              <p className="mt-0.5 text-xs text-brown-muted">
                {SPECIES_LABEL[activePet.species] ?? activePet.species} · {activePet.breed} ·{" "}
                {calcAge(activePet.birth_month)}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {activePet.modes.includes("playdate") && (
                  <span className="rounded-lg bg-teal/15 px-2.5 py-0.5 text-[11px] font-bold text-teal-dark">
                    หาเพื่อนเล่น
                  </span>
                )}
                {activePet.modes.includes("breeding") && (
                  <span className="rounded-lg bg-amber/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-dark">
                    หาคู่
                  </span>
                )}
              </div>
              {otherPets.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSwitcherOpen(true)}
                  className="mt-2 flex items-center gap-1.5 rounded-lg bg-cream px-2.5 py-1 text-[11px] font-medium text-brown-muted"
                >
                  <ArrowLeftRight size={12} />
                  สลับน้อง
                </button>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-2.5">
            <StatTile value={stats.likesReceived} label="ไลก์ที่ได้รับ" />
            <StatTile value={stats.matches} label="แมตช์ทั้งหมด" />
            <StatTile value={stats.avgRating !== null ? stats.avgRating.toFixed(1) : "—"} label="รีวิวเฉลี่ย" />
          </div>

          {/* Primary CTA */}
          <Link
            href="/app/swipe"
            className="flex h-[50px] items-center justify-center rounded-2xl bg-coral font-bold text-white shadow-card transition-opacity active:opacity-90"
          >
            ปัดการ์ดเลย
          </Link>
        </>
      ) : (
        <>
          {/* Empty pet state */}
          <div className="rounded-2xl border-2 border-dashed border-black/10 bg-white/60 p-6 text-center">
            <div className="mx-auto mb-2.5 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-cream">
              <PawPrint size={24} className="text-brown-muted" />
            </div>
            <p className="font-bold text-brown">ยังไม่มีโปรไฟล์น้อง</p>
            <p className="mt-1 text-xs text-brown-muted">
              เพิ่มน้องของคุณเพื่อเริ่มต้นหาคู่และเพื่อนเล่น
            </p>
            <Link
              href="/onboarding"
              className="mt-3.5 flex h-11 items-center justify-center rounded-2xl bg-coral text-sm font-bold text-white"
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
          <div className="flex h-[50px] items-center justify-center rounded-2xl bg-black/5 font-bold text-brown-muted/50">
            ปัดการ์ดเลย
          </div>
        </>
      )}

      {/* เมนูหลัก */}
      <div>
        <p className="mb-2.5 text-sm font-bold text-brown">เมนูหลัก</p>
        <div className="grid grid-cols-3 gap-2.5">
          {MAIN_MENU.map((tile) => (
            <MenuTileButton key={tile.label} tile={tile} dimmed={!hasPet && !!tile.requiresPet} />
          ))}
        </div>
      </div>

      {/* ดูแลน้อง */}
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-sm font-bold text-brown">ดูแลน้อง</p>
          <Link href="/app/care" className="flex items-center gap-0.5 text-xs font-medium text-brown-muted">
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
      {switcherOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black/50">
          <div className="flex-1" onClick={() => setSwitcherOpen(false)} />
          <div className="mx-auto flex w-full max-w-[480px] flex-col rounded-t-[28px] bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <p className="mb-3 font-bold text-brown">สลับน้อง</p>
            <div className="flex flex-col gap-2">
              {pets.map((pet) => (
                <button
                  key={pet.id}
                  type="button"
                  onClick={() => handleSwitchPet(pet.id)}
                  className={`flex items-center gap-3 rounded-2xl p-2.5 text-left transition-colors ${
                    pet.id === activePet?.id ? "bg-coral/10" : "hover:bg-cream"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pet.photos[0]}
                    alt={pet.name}
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                  <span className="font-bold text-brown">{pet.name}</span>
                  {pet.id === activePet?.id && (
                    <span className="ml-auto rounded-full bg-coral/15 px-2 py-0.5 text-[10px] font-bold text-coral">
                      กำลังใช้อยู่
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatTile({ value, label, muted }: { value: string | number; label: string; muted?: boolean }) {
  return (
    <div className="flex-1 rounded-2xl bg-white py-3 text-center shadow-card">
      <p className={`text-2xl font-bold ${muted ? "text-black/15" : "text-brown"}`}>{value}</p>
      <p className={`mt-0.5 text-[11px] font-medium ${muted ? "text-black/20" : "text-brown-muted"}`}>
        {label}
      </p>
    </div>
  );
}

function MenuTileButton({ tile, dimmed }: { tile: MenuTile; dimmed: boolean }) {
  const Icon = tile.icon;
  const isDisabled = tile.comingSoon || dimmed;

  const inner = (
    <div className={`relative flex flex-col items-center gap-2 rounded-2xl bg-white py-3.5 shadow-card ${isDisabled ? "opacity-45" : ""}`}>
      {tile.comingSoon && (
        <span className="absolute right-1.5 top-1.5 rounded px-1.5 py-0.5 text-[8px] font-bold text-white bg-amber">
          เร็วๆ นี้
        </span>
      )}
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cream">
        <Icon size={20} className="text-brown-muted" />
      </div>
      <span className="text-center text-[11px] font-semibold leading-tight text-brown">{tile.label}</span>
    </div>
  );

  if (isDisabled) return inner;
  return <Link href={tile.href}>{inner}</Link>;
}

function CareTileButton({ tile }: { tile: MenuTile }) {
  const Icon = tile.icon;
  const inner = (
    <div className={`relative flex min-h-16 items-center gap-3 rounded-2xl bg-white p-3.5 shadow-card ${tile.comingSoon ? "opacity-60" : ""}`}>
      {tile.comingSoon && (
        <span className="absolute right-2 top-2 rounded px-1.5 py-0.5 text-[8px] font-bold text-white bg-amber">
          เร็วๆ นี้
        </span>
      )}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream">
        <Icon size={19} className="text-brown-muted" />
      </div>
      <p className="text-xs font-bold leading-tight text-brown">{tile.label}</p>
    </div>
  );

  if (tile.comingSoon) return inner;
  return <Link href={tile.href}>{inner}</Link>;
}

function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-5 px-5 pb-8 pt-5">
      <div>
        <div className="mb-1.5 h-3.5 w-10 animate-pulse rounded bg-black/10" />
        <div className="h-5 w-36 animate-pulse rounded bg-black/10" />
      </div>
      <div className="flex gap-3.5 rounded-2xl bg-white p-3.5 shadow-card">
        <div className="h-[72px] w-[72px] shrink-0 animate-pulse rounded-2xl bg-black/10" />
        <div className="flex flex-1 flex-col gap-2 pt-1">
          <div className="h-4 w-24 animate-pulse rounded bg-black/10" />
          <div className="h-3 w-20 animate-pulse rounded bg-black/5" />
          <div className="h-6 w-32 animate-pulse rounded bg-black/5" />
        </div>
      </div>
      <div className="flex gap-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[62px] flex-1 animate-pulse rounded-2xl bg-black/10" />
        ))}
      </div>
      <div className="h-[50px] animate-pulse rounded-2xl bg-black/10" />
      <div>
        <div className="mb-3 h-3.5 w-20 animate-pulse rounded bg-black/10" />
        <div className="grid grid-cols-3 gap-2.5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-[82px] animate-pulse rounded-2xl bg-black/5" />
          ))}
        </div>
      </div>
      <div>
        <div className="mb-3 h-3.5 w-20 animate-pulse rounded bg-black/10" />
        <div className="grid grid-cols-2 gap-2.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-black/5" />
          ))}
        </div>
      </div>
    </div>
  );
}
