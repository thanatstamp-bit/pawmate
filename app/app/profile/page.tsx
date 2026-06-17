"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, MapPin, Heart, Users, Send, PawPrint } from "lucide-react";
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
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-card">
          <PawPrint size={36} className="text-brown-muted" />
        </div>
        <p className="font-bold text-brown">ยังไม่มีน้องในระบบ</p>
        <a href="/onboarding" className="rounded-full bg-coral px-6 py-3 font-bold text-white">
          สร้างโปรไฟล์น้อง
        </a>
      </div>
    );
  }

  const activePet = pets.find((p) => p.id === activePetId) ?? pets[0];
  const otherPets = pets.filter((p) => p.id !== activePet.id);
  const age = calcAge(activePet.birth_month);
  const location = [activePet.district, activePet.province].filter(Boolean).join(", ");
  const activeStats = statsMap[activePet.id] ?? { likesReceived: 0, matches: 0, likesSent: 0 };

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pb-2 pt-6">
        <h1 className="text-xl font-bold text-brown">โปรไฟล์น้อง</h1>
        <a
          href="/onboarding"
          className="flex items-center gap-1.5 rounded-full bg-coral px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-coral-dark"
        >
          <Plus size={16} />
          เพิ่มน้อง
        </a>
      </div>

      {/* Active pet — full preview */}
      <div className="mx-5 overflow-hidden rounded-card bg-white shadow-card">
        {/* Main photo */}
        <div className="relative aspect-[4/3] bg-cream">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activePet.photos[0]}
            alt={activePet.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <h2 className="text-2xl font-bold text-white">{activePet.name}, {age}</h2>
            <p className="text-white/80">
              {activePet.breed} · {activePet.sex === "male" ? "เพศผู้" : "เพศเมีย"}
            </p>
          </div>
        </div>

        {/* Photo strip */}
        {activePet.photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto p-3">
            {activePet.photos.slice(1).map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={url} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
            ))}
          </div>
        )}

        <div className="p-4">
          {/* Location */}
          <div className="flex items-center gap-1.5 text-sm text-brown-muted">
            <MapPin size={14} />
            {location}
          </div>

          {/* Tags */}
          {activePet.personality_tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {activePet.personality_tags.map((tag) => (
                <span key={tag} className="rounded-full bg-coral/10 px-3 py-0.5 text-xs font-bold text-coral">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Bio */}
          {activePet.bio && <p className="mt-3 text-sm text-brown-muted">{activePet.bio}</p>}

          {/* Modes + edit */}
          <div className="mt-4 flex items-center justify-between gap-2">
            <div className="flex gap-2">
              {activePet.modes.includes("playdate") && (
                <span className="rounded-full bg-teal/15 px-3 py-1 text-xs font-bold text-teal-dark">หาเพื่อนเล่น</span>
              )}
              {activePet.modes.includes("breeding") && (
                <span className="rounded-full bg-amber/20 px-3 py-1 text-xs font-bold text-amber-dark">หาคู่ผสมพันธุ์</span>
              )}
            </div>
            <a
              href="/onboarding"
              className="flex shrink-0 items-center gap-1.5 rounded-full border-2 border-black/10 px-3 py-1.5 text-xs font-bold text-brown-muted hover:border-coral/40"
            >
              <Edit2 size={13} />
              แก้ไข
            </a>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x divide-black/5 border-t border-black/5 bg-cream/60">
          <div className="flex flex-col items-center gap-0.5 py-3">
            <Heart size={15} className="text-coral" fill="currentColor" />
            <p className="text-base font-bold leading-none text-brown">{activeStats.likesReceived}</p>
            <p className="text-[10px] text-brown-muted">ถูกไลก์</p>
          </div>
          <div className="flex flex-col items-center gap-0.5 py-3">
            <Users size={15} className="text-teal" />
            <p className="text-base font-bold leading-none text-brown">{activeStats.matches}</p>
            <p className="text-[10px] text-brown-muted">แมตช์</p>
          </div>
          <div className="flex flex-col items-center gap-0.5 py-3">
            <Send size={15} className="text-brown-muted" />
            <p className="text-base font-bold leading-none text-brown">{activeStats.likesSent}</p>
            <p className="text-[10px] text-brown-muted">ส่งไลก์</p>
          </div>
        </div>
      </div>

      {/* Other pets — switch active */}
      {otherPets.length > 0 && (
        <div className="mt-6 flex flex-col gap-3 px-5">
          <p className="text-sm font-bold text-brown-muted">น้องตัวอื่นของฉัน</p>
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
      <div className="mx-5 mt-8 flex flex-col items-center gap-4 border-t border-black/5 pt-6">
        <LogoutButton />
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="text-sm text-brown-muted underline underline-offset-2 hover:text-coral"
        >
          ลบบัญชี
        </button>
      </div>

      {/* Delete confirm dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div className="w-full max-w-[320px] rounded-card bg-white p-6 text-center shadow-2xl">
            <h3 className="text-lg font-bold text-brown">ลบบัญชีใช่ไหม?</h3>
            <p className="mt-2 text-sm text-brown-muted">
              ข้อมูลน้อง, แมตช์ และแชทจะถูกลบออกทั้งหมด ไม่สามารถกู้คืนได้
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-full border-2 border-black/10 py-2.5 font-bold text-brown-muted"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 rounded-full bg-coral py-2.5 font-bold text-white disabled:opacity-60"
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
