"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  Clock,
  Eye,
  DollarSign,
  Share2,
  User,
  Search,
  Check,
  Star,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import SightingModal from "@/components/lost/SightingModal";
import Toast from "@/components/trust/Toast";

type LostPetDetail = {
  id: string;
  reporter_id: string;
  pet_name: string;
  species: string;
  breed: string;
  photos: string[];
  last_seen_province: string;
  last_seen_district: string;
  last_seen_detail: string | null;
  lost_date: string;
  distinguishing_marks: string | null;
  contact: string;
  reward: string | null;
  status: "lost" | "found";
  created_at: string;
  profiles: { display_name: string } | null;
};

type Sighting = {
  id: string;
  detail: string;
  seen_at_location: string;
  created_at: string;
  reporter_id: string;
  profiles: { display_name: string } | null;
};

const SPECIES_LABEL: Record<string, string> = {
  dog: "สุนัข",
  cat: "แมว",
  other: "อื่นๆ",
};

function thaiDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function daysLost(lostDate: string): number {
  return Math.floor(
    (Date.now() - new Date(lostDate + "T00:00:00").getTime()) / 86_400_000
  );
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "เมื่อวาน";
  return `${days} วันที่แล้ว`;
}

const factRowClass =
  "flex items-start gap-2.5 px-3.5 py-2.5 border-b border-[#F0EFEC] last:border-0";
const factLabelClass =
  "text-[10px] font-semibold uppercase tracking-wide text-[#AAA]";

export default function LostPetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [post, setPost] = useState<LostPetDetail | null>(null);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [photoIdx, setPhotoIdx] = useState(0);

  const [showSighting, setShowSighting] = useState(false);
  const [showFoundConfirm, setShowFoundConfirm] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [toast, setToast] = useState<{ title: string; subtitle?: string } | null>(null);

  const loadSightings = useCallback(async () => {
    const { data } = await supabase
      .from("lost_pet_sightings")
      .select("id, detail, seen_at_location, created_at, reporter_id, profiles(display_name)")
      .eq("lost_pet_id", id)
      .order("created_at", { ascending: false });
    setSightings((data as unknown as Sighting[]) ?? []);
  }, [id, supabase]);

  useEffect(() => {
    async function load() {
      const [{ data: { user } }, postRes, sightingsRes] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from("lost_pets")
          .select("*, profiles!reporter_id(display_name)")
          .eq("id", id)
          .single(),
        supabase
          .from("lost_pet_sightings")
          .select(
            "id, detail, seen_at_location, created_at, reporter_id, profiles(display_name)"
          )
          .eq("lost_pet_id", id)
          .order("created_at", { ascending: false }),
      ]);
      setCurrentUserId(user?.id ?? null);
      setPost(postRes.data as LostPetDetail);
      setSightings((sightingsRes.data as unknown as Sighting[]) ?? []);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function confirmFound() {
    if (!post || confirming) return;
    setConfirming(true);
    await supabase
      .from("lost_pets")
      .update({ status: "found" })
      .eq("id", post.id);
    setPost((prev) => prev ? { ...prev, status: "found" } : prev);
    setConfirming(false);
    setShowFoundConfirm(false);
  }

  function handleShare() {
    const url = `${window.location.origin}/lost/${id}`;
    if (navigator.share) {
      navigator.share({ title: `ตามหา${post?.pet_name}`, url }).catch(() => {});
    } else {
      navigator.clipboard
        .writeText(url)
        .then(() => setToast({ title: "คัดลอกลิงก์แล้ว" }))
        .catch(() => {});
    }
  }

  function handleContact() {
    if (!post?.contact) return;
    navigator.clipboard
      .writeText(post.contact)
      .then(() => setToast({ title: "คัดลอกข้อมูลติดต่อแล้ว", subtitle: post.contact }))
      .catch(() => {});
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-cream">
        <div className="flex h-14 shrink-0 items-center gap-1 border-b border-black/5 bg-white px-1">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-11 w-11 items-center justify-center text-brown"
          >
            <ChevronLeft size={20} />
          </button>
        </div>
        <div className="h-[220px] animate-pulse bg-[#D4D3D0]" />
        <div className="px-4 pt-4">
          <div className="mb-2 h-6 w-32 animate-pulse rounded bg-[#E4E3DF]" />
          <div className="mb-4 h-3 w-48 animate-pulse rounded bg-[#EBEBEA]" />
          <div className="h-32 animate-pulse rounded-2xl bg-[#E4E3DF]" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream">
        <p className="text-brown-muted">ไม่พบประกาศนี้</p>
      </div>
    );
  }

  const isOwner = currentUserId === post.reporter_id;
  const days = daysLost(post.lost_date);

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F7F5]">
      {/* Header */}
      <div className="flex h-[52px] shrink-0 items-center border-b border-[#ECEAE7] bg-white px-4">
        <button
          type="button"
          onClick={() => router.push("/app/care/lost")}
          className="flex h-11 w-11 items-center justify-center"
        >
          <ChevronLeft size={20} className="text-brown" />
        </button>
        <span className="flex-1 text-center text-[16px] font-semibold text-brown">
          รายละเอียดสัตว์หาย
        </span>
        <div className="w-11" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-8">
        {/* Photo carousel */}
        <div className="relative h-[220px] overflow-hidden bg-[#CCCAC7]">
          {post.photos.length > 0 ? (
            <>
              <div
                className="flex h-full transition-transform duration-300"
                style={{ transform: `translateX(-${photoIdx * 100}%)` }}
              >
                {post.photos.map((photo, i) => (
                  <div key={i} className="relative min-w-full h-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo}
                      alt={`รูป ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
              {/* Prev / Next */}
              {post.photos.length > 1 && (
                <>
                  {photoIdx > 0 && (
                    <button
                      type="button"
                      onClick={() => setPhotoIdx((i) => i - 1)}
                      className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30"
                    >
                      <ChevronLeft size={18} className="text-white" />
                    </button>
                  )}
                  {photoIdx < post.photos.length - 1 && (
                    <button
                      type="button"
                      onClick={() => setPhotoIdx((i) => i + 1)}
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30"
                    >
                      <ChevronRight size={18} className="text-white" />
                    </button>
                  )}
                  {/* Dots */}
                  <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                    {post.photos.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPhotoIdx(i)}
                        className={`rounded-full transition-all ${
                          i === photoIdx
                            ? "h-2 w-2 bg-white"
                            : "h-1.5 w-1.5 bg-white/40"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-sm text-[#AAA]">ไม่มีรูปภาพ</span>
            </div>
          )}

          {/* Status badge — top left per wireframe */}
          <span
            className="absolute left-3 top-3 rounded-full px-3 py-1 text-[12px] font-semibold text-white"
            style={{ background: post.status === "found" ? "#2A9D8F" : "#E0445A" }}
          >
            {post.status === "found" ? "พบแล้ว" : "ยังตามหา"}
          </span>
        </div>

        {/* Celebration banner (shown when found) */}
        {post.status === "found" && (
          <div className="flex flex-col items-center gap-1.5 border-b border-[#BEE6E2] bg-[#EDF7F6] py-4">
            <div className="flex items-center gap-2">
              <Star size={18} className="fill-teal text-teal" />
              <span className="text-[17px] font-bold text-teal">น้องกลับบ้านแล้ว!</span>
              <Star size={18} className="fill-teal text-teal" />
            </div>
            <span className="text-[13px] font-medium text-teal/80">
              ขอบคุณทุกเบาะแสจากเพื่อนๆ
            </span>
          </div>
        )}

        <div className="px-4 pt-4">
          {/* Pet name */}
          <div className="mb-3.5">
            <h1 className="text-[22px] font-bold text-brown">{post.pet_name}</h1>
            <p className="mt-0.5 text-[13px] font-medium text-[#888]">
              {SPECIES_LABEL[post.species] ?? post.species}
              {post.breed ? ` · ${post.breed}` : ""}
            </p>
          </div>

          {/* Facts card */}
          <div className="mb-3.5 overflow-hidden rounded-2xl border border-[#E4E3DF] bg-white">
            <div className={factRowClass}>
              <MapPin size={16} className="mt-0.5 shrink-0 text-[#888]" />
              <div>
                <p className={factLabelClass}>หายแถว</p>
                <p className="mt-0.5 text-[14px] font-medium text-brown">
                  {post.last_seen_district} {post.last_seen_province}
                </p>
              </div>
            </div>
            <div className={factRowClass}>
              <Calendar size={16} className="mt-0.5 shrink-0 text-[#888]" />
              <div>
                <p className={factLabelClass}>วันที่หาย</p>
                <p className="mt-0.5 text-[14px] font-medium text-brown">
                  {thaiDate(post.lost_date)}
                </p>
              </div>
            </div>
            {post.status === "lost" ? (
              <div className={factRowClass}>
                <Clock size={16} className="mt-0.5 shrink-0 text-[#E0445A]" />
                <div>
                  <p className={factLabelClass}>หายมาแล้ว</p>
                  <p className="mt-0.5 text-[14px] font-bold text-[#E0445A]">
                    {days === 0 ? "วันนี้" : `${days} วัน`}
                  </p>
                </div>
              </div>
            ) : (
              <div className={factRowClass}>
                <Check size={16} className="mt-0.5 shrink-0 text-teal" />
                <div>
                  <p className={factLabelClass}>สถานะ</p>
                  <p className="mt-0.5 text-[14px] font-bold text-teal">กลับบ้านแล้ว</p>
                </div>
              </div>
            )}
            {post.distinguishing_marks && (
              <div className={factRowClass}>
                <Eye size={16} className="mt-0.5 shrink-0 text-[#888]" />
                <div>
                  <p className={factLabelClass}>ลักษณะเด่น</p>
                  <p className="mt-0.5 text-[14px] font-medium leading-snug text-brown">
                    {post.distinguishing_marks}
                  </p>
                </div>
              </div>
            )}
            {post.reward && (
              <div className={factRowClass}>
                <DollarSign size={16} className="mt-0.5 shrink-0 text-[#888]" />
                <div>
                  <p className={factLabelClass}>ของรางวัล</p>
                  <p className="mt-0.5 text-[14px] font-bold text-brown">{post.reward}</p>
                </div>
              </div>
            )}
          </div>

          {/* Owner row */}
          <div className="mb-3.5 flex items-center gap-3 rounded-[14px] border border-[#E4E3DF] bg-white px-3.5 py-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#D8D7D3]">
              <User size={18} className="text-[#AAA]" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-medium text-[#AAA]">เจ้าของ</p>
              <p className="text-[15px] font-semibold text-brown">
                {post.profiles?.display_name ?? "ผู้ใช้งาน"}
              </p>
            </div>
            {isOwner ? (
              <span className="rounded-full bg-[#F0F0ED] px-2.5 py-1 text-[11px] font-semibold text-[#888]">
                คุณเอง
              </span>
            ) : (
              <button
                type="button"
                onClick={handleContact}
                className="flex h-9 items-center rounded-full border border-[#CCCCC8] px-4"
              >
                <span className="text-[13px] font-semibold text-[#555]">ติดต่อ</span>
              </button>
            )}
          </div>

          {/* Action buttons */}
          {post.status === "lost" && !isOwner && (
            <div className="mb-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowSighting(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 font-semibold text-white"
                style={{ background: "#E8724A" }}
              >
                <MapPin size={16} />
                แจ้งเบาะแส
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-2 rounded-xl border border-[#CCCCC8] px-5 py-3.5 font-semibold text-[#555]"
              >
                <Share2 size={16} />
                แชร์
              </button>
            </div>
          )}

          {post.status === "found" && (
            <div className="mb-5">
              <button
                type="button"
                onClick={handleShare}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#CCCCC8] py-3.5 font-semibold text-[#555]"
              >
                <Share2 size={16} />
                แชร์ข่าวดี
              </button>
            </div>
          )}

          {isOwner && post.status === "lost" && (
            <div className="mb-5 flex gap-2.5">
              <button
                type="button"
                onClick={handleShare}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#CCCCC8] py-3.5 font-semibold text-[#555]"
              >
                <Share2 size={16} />
                แชร์โพสต์
              </button>
            </div>
          )}

          {/* Sightings timeline */}
          <div className="mb-4">
            <div className="mb-3.5 flex items-baseline gap-2">
              <h2 className="text-[15px] font-bold text-brown">
                {post.status === "found" ? "เบาะแสที่ช่วยพบ" : "เบาะแสที่ได้รับ"}
              </h2>
              <span className="text-[13px] text-[#888]">({sightings.length} รายการ)</span>
            </div>

            {sightings.length === 0 ? (
              <div className="flex flex-col items-center gap-2.5 rounded-2xl border-2 border-dashed border-[#D8D7D3] px-5 py-8 text-center">
                <Search size={36} className="text-[#CCC]" />
                <p className="text-[15px] font-semibold text-[#888]">ยังไม่มีเบาะแส</p>
                <p className="text-[13px] leading-relaxed text-[#AAA]">
                  ช่วยกันแชร์โพสต์นี้เพื่อให้คนอื่นๆ
                  <br />
                  รู้และช่วยตามหาน้องได้
                </p>
                <button
                  type="button"
                  onClick={handleShare}
                  className="mt-1 flex h-10 items-center gap-1.5 rounded-full bg-[#F0EFE9] px-5"
                >
                  <Share2 size={14} className="text-[#888]" />
                  <span className="text-[13px] font-semibold text-[#666]">แชร์เลย</span>
                </button>
              </div>
            ) : (
              <div>
                {sightings.map((s, i) => (
                  <div key={s.id} className="flex gap-2.5">
                    {/* Avatar + connector */}
                    <div className="flex w-9 flex-col items-center">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D8D7D3]">
                        <User size={15} className="text-[#AAA]" />
                      </div>
                      {i < sightings.length - 1 && (
                        <div className="mt-1 w-px flex-1 bg-[#E4E3DF]" style={{ minHeight: 24 }} />
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 pb-4">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[14px] font-semibold text-brown">
                          {s.profiles?.display_name ?? "ผู้ใช้งาน"}
                        </span>
                        <span className="text-[11px] text-[#AAA]">{timeAgo(s.created_at)}</span>
                      </div>
                      <p className="mb-2 text-[13px] leading-snug text-[#555]">{s.detail}</p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#F0EFE9] px-2.5 py-1 text-[11px] font-medium text-[#666]">
                        <MapPin size={11} className="text-[#888]" />
                        {s.seen_at_location}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Owner-only footer: mark as found */}
          {isOwner && post.status === "lost" && (
            <div className="-mx-4 mt-2 border-t border-[#E4E3DF] bg-white px-4 py-4">
              <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-[#BBB]">
                เฉพาะเจ้าของ
              </p>
              <button
                type="button"
                onClick={() => setShowFoundConfirm(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-teal py-3"
              >
                <Check size={16} strokeWidth={2.5} className="text-teal" />
                <span className="text-[14px] font-bold text-teal">ทำเครื่องหมายว่าพบแล้ว</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sighting modal */}
      {showSighting && (
        <SightingModal
          lostPetId={id}
          petName={post.pet_name}
          onClose={() => setShowSighting(false)}
          onSubmitted={() => {
            loadSightings();
            setToast({ title: "ขอบคุณที่แจ้งเบาะแสนะ 🙏" });
          }}
        />
      )}

      {/* Mark-as-found confirm dialog */}
      {showFoundConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-[320px] rounded-[20px] bg-white p-6">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal/10">
              <Check size={26} strokeWidth={2.5} className="text-teal" />
            </div>
            <h3 className="mb-2 text-center text-[17px] font-bold text-brown">
              พบน้อง{post.pet_name}แล้วใช่ไหม?
            </h3>
            <p className="mb-5 text-center text-[13px] leading-relaxed text-[#777]">
              เมื่อยืนยันแล้ว สถานะโพสต์จะเปลี่ยนเป็น &ldquo;พบแล้ว&rdquo;{" "}
              และแจ้งผู้ส่งเบาะแสทุกคน
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowFoundConfirm(false)}
                className="flex flex-1 items-center justify-center rounded-[10px] border border-[#CCCCC8] py-3"
              >
                <span className="text-[14px] font-semibold text-[#555]">ยกเลิก</span>
              </button>
              <button
                type="button"
                onClick={confirmFound}
                disabled={confirming}
                className="flex flex-1 items-center justify-center rounded-[10px] bg-teal py-3 disabled:opacity-50"
              >
                <span className="text-[14px] font-bold text-white">
                  {confirming ? "กำลังบันทึก..." : "ยืนยัน"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          title={toast.title}
          subtitle={toast.subtitle}
          onDone={() => setToast(null)}
          duration={4000}
        />
      )}
    </div>
  );
}
