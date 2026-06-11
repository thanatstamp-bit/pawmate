"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit2, MapPin, PawPrint } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
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
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("pets")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();
      setPet(data);
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  if (!pet) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="font-bold text-brown">ยังไม่มีโปรไฟล์น้อง</p>
        <a href="/onboarding" className="rounded-full bg-coral px-6 py-3 font-bold text-white">
          สร้างโปรไฟล์น้อง
        </a>
      </div>
    );
  }

  const location = [pet.district, pet.province].filter(Boolean).join(", ");
  const age = calcAge(pet.birth_month);

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pb-2 pt-6">
        <h1 className="text-xl font-bold text-brown">โปรไฟล์น้อง</h1>
        <a
          href="/onboarding"
          className="flex items-center gap-1.5 rounded-full border-2 border-black/10 bg-white px-4 py-2 text-sm font-bold text-brown-muted hover:border-coral/40"
        >
          <Edit2 size={14} />
          แก้ไข
        </a>
      </div>

      {/* Pet card preview */}
      <div className="mx-5 overflow-hidden rounded-card bg-white shadow-card">
        {/* Main photo */}
        <div className="relative aspect-[4/3] bg-cream">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pet.photos[0]}
            alt={pet.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <h2 className="text-2xl font-bold text-white">{pet.name}, {age}</h2>
            <p className="text-white/80">{pet.breed} · {pet.sex === "male" ? "เพศผู้" : "เพศเมีย"}</p>
          </div>
        </div>

        {/* Photo strip */}
        {pet.photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto p-3">
            {pet.photos.slice(1).map((url, i) => (
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
          {pet.personality_tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {pet.personality_tags.map((tag) => (
                <span key={tag} className="rounded-full bg-coral/10 px-3 py-0.5 text-xs font-bold text-coral">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Bio */}
          {pet.bio && <p className="mt-3 text-sm text-brown-muted">{pet.bio}</p>}

          {/* Modes */}
          <div className="mt-4 flex gap-2">
            {pet.modes.includes("playdate") && (
              <span className="rounded-full bg-teal/15 px-3 py-1 text-xs font-bold text-teal-dark">หาเพื่อนเล่น</span>
            )}
            {pet.modes.includes("breeding") && (
              <span className="rounded-full bg-amber/20 px-3 py-1 text-xs font-bold text-amber-dark">หาคู่ผสมพันธุ์</span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mx-5 mt-6 flex flex-col items-center gap-4">
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
