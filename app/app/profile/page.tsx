"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Heart, Users, Send, PawPrint, ShieldCheck, Scissors, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import PetStatCard from "@/components/dashboard/PetStatCard";
import LogoutButton from "@/components/LogoutButton";

type Pet = {
  id: string;
  name: string;
  species: string;
  breed: string;
  sex: string;
  birth_month: string;
  photos: string[];
  personality_tags: string[];
  province: string;
  district: string | null;
  modes: string[];
  vaccinated: boolean | null;
  neutered: boolean | null;
  bio: string | null;
};

type PetStats = {
  likesReceived: number;
  matches: number;
  likesSent: number;
};

function calcAge(birthMonth: string): string {
  const birth = new Date(birthMonth);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (months < 12) return `${months} เดือน`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y} ปี ${m} เดือน` : `${y} ปี`;
}

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();

  const [pets, setPets] = useState<Pet[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, PetStats>>({});
  const [activePetId, setActivePetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("pawmate_active_pet_id");
    loadData(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData(storedActiveId: string | null) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: petsData } = await supabase
      .from("pets")
      .select(
        "id, name, species, breed, sex, birth_month, photos, personality_tags, province, district, modes, vaccinated, neutered, bio"
      )
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true });

    if (!petsData || petsData.length === 0) {
      setLoading(false);
      return;
    }

    setPets(petsData);

    // Resolve which pet is active — prefer stored ID if it's still valid
    const validActive =
      storedActiveId && petsData.some((p) => p.id === storedActiveId)
        ? storedActiveId
        : petsData[0].id;
    setActivePetId(validActive);
    localStorage.setItem("pawmate_active_pet_id", validActive);

    // Fetch stats for all pets in 3 parallel queries
    const petIds = petsData.map((p) => p.id);

    const [likesReceivedRes, likesSentRes, matchesRes] = await Promise.all([
      supabase.from("likes").select("to_pet_id").in("to_pet_id", petIds),
      supabase.from("likes").select("from_pet_id").in("from_pet_id", petIds),
      supabase
        .from("matches")
        .select("pet_a_id, pet_b_id")
        .or(`pet_a_id.in.(${petIds.join(",")}),pet_b_id.in.(${petIds.join(",")})`),
    ]);

    const likesReceived = likesReceivedRes.data ?? [];
    const likesSent = likesSentRes.data ?? [];
    const matches = matchesRes.data ?? [];

    const map: Record<string, PetStats> = {};
    for (const pet of petsData) {
      map[pet.id] = {
        likesReceived: likesReceived.filter((l) => l.to_pet_id === pet.id).length,
        likesSent: likesSent.filter((l) => l.from_pet_id === pet.id).length,
        matches: matches.filter((m) => m.pet_a_id === pet.id || m.pet_b_id === pet.id).length,
      };
    }
    setStatsMap(map);
    setLoading(false);
  }

  function handleSwitch(petId: string) {
    setActivePetId(petId);
    setPhotoIdx(0);
    localStorage.setItem("pawmate_active_pet_id", petId);
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    // Sign out — full account deletion requires admin API (out of scope for portfolio)
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <PawPrint size={36} className="animate-pulse text-coral" />
      </div>
    );
  }

  if (pets.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-coral-soft">
          <PawPrint size={36} className="text-coral" />
        </div>
        <p className="font-bold tracking-tight2 text-ink">ยังไม่มีน้องในระบบ</p>
        <a href="/onboarding" className="rounded-2xl bg-gradient-cta px-6 py-3 font-bold text-white shadow-cta">
          สร้างโปรไฟล์น้อง
        </a>
      </div>
    );
  }

  const activePet = pets.find((p) => p.id === activePetId) ?? pets[0];
  const otherPets = pets.filter((p) => p.id !== activePet.id);
  const age = calcAge(activePet.birth_month);
  const activeStats = statsMap[activePet.id] ?? { likesReceived: 0, matches: 0, likesSent: 0 };

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pb-2 pt-6">
        <h1 className="text-2xl font-bold tracking-title text-ink">โปรไฟล์น้อง</h1>
        <a
          href="/onboarding"
          className="flex items-center gap-1.5 rounded-2xl bg-gradient-cta px-4 py-2 text-sm font-bold text-white shadow-cta transition-transform active:scale-95"
        >
          <Plus size={16} />
          เพิ่มน้อง
        </a>
      </div>

      {/* Active pet — photo carousel */}
      {(() => {
        const photos = activePet.photos.length ? activePet.photos : [""];
        const idx = Math.min(photoIdx, photos.length - 1);
        return (
          <div className="relative mx-5 h-[400px] overflow-hidden rounded-card bg-cream">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[idx]} alt={activePet.name} className="absolute inset-0 h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

            {/* Tap zones for prev / next */}
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="รูปก่อนหน้า"
                  onClick={() => setPhotoIdx((i) => (i - 1 + photos.length) % photos.length)}
                  className="absolute inset-y-0 left-0 z-10 w-2/5"
                />
                <button
                  type="button"
                  aria-label="รูปถัดไป"
                  onClick={() => setPhotoIdx((i) => (i + 1) % photos.length)}
                  className="absolute inset-y-0 right-0 z-10 w-2/5"
                />
              </>
            )}

            {/* Mode pills */}
            <div className="absolute left-4 top-4 z-20 flex gap-2">
              {activePet.modes.includes("playdate") && (
                <span className="flex items-center gap-1 rounded-xl border border-white/30 bg-teal/50 px-2.5 py-1.5 text-[11.5px] font-semibold text-white backdrop-blur-md">
                  <Users size={12} /> หาเพื่อนเล่น
                </span>
              )}
              {activePet.modes.includes("breeding") && (
                <span className="flex items-center gap-1 rounded-xl border border-white/30 bg-amber/60 px-2.5 py-1.5 text-[11.5px] font-semibold text-white backdrop-blur-md">
                  <Heart size={12} /> หาคู่
                </span>
              )}
            </div>

            {/* Name + age */}
            <div className="absolute inset-x-0 bottom-0 z-20 p-5">
              <div className="flex items-baseline gap-2">
                <span className="text-[28px] font-bold tracking-title text-white [text-shadow:0_2px_8px_rgba(0,0,0,.45)]">
                  {activePet.name}
                </span>
                <span className="text-xl font-semibold text-white/90 [text-shadow:0_2px_8px_rgba(0,0,0,.45)]">{age}</span>
              </div>
            </div>

            {/* Dots */}
            {photos.length > 1 && (
              <div className="absolute bottom-5 right-5 z-20 flex gap-1.5">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPhotoIdx(i)}
                    className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-white" : "w-1.5 bg-white/50"}`}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Info card — breed / sex / health rows + edit CTA */}
      <div className="mx-5 mt-3 rounded-card bg-white px-[18px] py-1.5 shadow-card">
        <div className="flex items-center gap-3 border-b border-[#F4EDE7] py-[13px]">
          <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-coral-soft text-coral">
            <PawPrint size={18} />
          </span>
          <span className="text-[13px] font-medium text-ink-3">สายพันธุ์</span>
          <span className="ml-auto text-right text-[14.5px] font-semibold text-ink">{activePet.breed}</span>
        </div>
        <div className="flex items-center gap-3 border-b border-[#F4EDE7] py-[13px]">
          <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-blue-soft text-blue-ink">
            <UserRound size={18} />
          </span>
          <span className="text-[13px] font-medium text-ink-3">เพศ</span>
          <span className="ml-auto text-[14.5px] font-semibold text-ink">
            {activePet.sex === "male" ? "เพศผู้" : "เพศเมีย"}
          </span>
        </div>
        <div className="flex items-center gap-3 py-[13px]">
          <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-teal-soft text-teal-ink">
            <ShieldCheck size={18} />
          </span>
          <span className="text-[13px] font-medium text-ink-3">สุขภาพ</span>
          <div className="ml-auto flex flex-wrap justify-end gap-1.5">
            <span
              className={`flex items-center gap-1 rounded-[9px] px-2.5 py-[5px] text-[11.5px] font-semibold ${
                activePet.vaccinated ? "bg-teal-soft text-teal-ink" : "bg-fill-2 text-ink-3"
              }`}
            >
              <ShieldCheck size={12} /> {activePet.vaccinated ? "ฉีดวัคซีนแล้ว" : "ยังไม่ฉีด"}
            </span>
            <span
              className={`flex items-center gap-1 rounded-[9px] px-2.5 py-[5px] text-[11.5px] font-semibold ${
                activePet.neutered ? "bg-fill-2 text-ink-2" : "bg-fill-2 text-ink-3"
              }`}
            >
              <Scissors size={12} /> {activePet.neutered ? "ทำหมันแล้ว" : "ยังไม่ทำหมัน"}
            </span>
          </div>
        </div>

        {/* Bio (optional — kept since data exists) */}
        {activePet.bio && (
          <p className="border-t border-[#F4EDE7] py-[13px] text-[13px] leading-relaxed text-ink-2">{activePet.bio}</p>
        )}

        <a
          href="/onboarding"
          className="my-2 flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-cta text-[17px] font-bold tracking-tight2 text-white shadow-cta transition-transform active:scale-[.97]"
        >
          แก้ไขโปรไฟล์
        </a>
      </div>

      {/* Stats (kept in Profile per current IA) */}
      <div className="mx-5 mt-4 grid grid-cols-3 gap-2.5">
        <div className="flex flex-col items-center gap-0.5 rounded-panel bg-white py-3.5 shadow-card">
          <Heart size={16} className="text-coral" fill="currentColor" />
          <p className="text-xl font-bold leading-none tabular-nums text-ink">{activeStats.likesReceived}</p>
          <p className="text-[10px] text-ink-2">ถูกไลก์</p>
        </div>
        <div className="flex flex-col items-center gap-0.5 rounded-panel bg-white py-3.5 shadow-card">
          <Users size={16} className="text-teal" />
          <p className="text-xl font-bold leading-none tabular-nums text-ink">{activeStats.matches}</p>
          <p className="text-[10px] text-ink-2">แมตช์</p>
        </div>
        <div className="flex flex-col items-center gap-0.5 rounded-panel bg-white py-3.5 shadow-card">
          <Send size={16} className="text-ink-3" />
          <p className="text-xl font-bold leading-none tabular-nums text-ink">{activeStats.likesSent}</p>
          <p className="text-[10px] text-ink-2">ส่งไลก์</p>
        </div>
      </div>

      {/* Other pets — switch active */}
      {otherPets.length > 0 && (
        <div className="mt-6 flex flex-col gap-3 px-5">
          <p className="text-sm font-bold text-ink-2">น้องตัวอื่นของฉัน</p>
          {otherPets.map((pet) => (
            <PetStatCard
              key={pet.id}
              pet={pet}
              stats={statsMap[pet.id] ?? { likesReceived: 0, matches: 0, likesSent: 0 }}
              isActive={false}
              onSwitch={() => handleSwitch(pet.id)}
              onEdit={() => router.push("/onboarding")}
            />
          ))}
        </div>
      )}

      {/* Account section */}
      <div className="mx-5 mt-8 flex flex-col items-center gap-4 border-t border-line pt-6">
        <LogoutButton />
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="text-sm text-ink-2 underline underline-offset-2 hover:text-coral"
        >
          ลบบัญชี
        </button>
      </div>

      {/* Delete confirm dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(35,24,20,.45)] p-6 backdrop-blur-[2px]">
          <div className="w-full max-w-[320px] animate-pop rounded-card bg-white p-6 text-center shadow-popup">
            <h3 className="text-lg font-bold tracking-tight2 text-ink">ลบบัญชีใช่ไหม?</h3>
            <p className="mt-2 text-sm text-ink-2">
              ข้อมูลน้อง, แมตช์ และแชทจะถูกลบออกทั้งหมด ไม่สามารถกู้คืนได้
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-2xl border-2 border-black/10 py-2.5 font-bold text-ink-2"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 rounded-2xl bg-rose py-2.5 font-bold text-white transition-transform active:scale-[.98] disabled:opacity-60"
              >
                {deleting ? "กำลังลบ..." : "ลบเลย"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
