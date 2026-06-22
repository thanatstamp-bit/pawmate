"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  MapPin,
  Calendar,
  Clock,
  Eye,
  Gift,
  Share2,
  Search,
  Check,
  CheckCircle2,
  Phone,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import SightingModal from "@/components/lost/SightingModal";
import Toast from "@/components/trust/Toast";
import { Avatar, IconTile } from "@/components/ui";

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

function FactRow({
  tone,
  icon,
  label,
  value,
  valueClass = "text-ink",
  align = "row",
}: {
  tone: "rose" | "amber" | "blue";
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  valueClass?: string;
  align?: "row" | "stacked";
}) {
  return (
    <div
      className={`flex gap-[13px] border-b border-[#F4EDE7] py-[13px] last:border-0 ${
        align === "stacked" ? "items-start" : "items-center"
      }`}
    >
      <IconTile tone={tone} size={38} rounded="rounded-xl">
        {icon}
      </IconTile>
      {align === "stacked" ? (
        <div className="min-w-0 flex-1">
          <p className="mb-0.5 text-[13px] font-medium text-ink-3">{label}</p>
          <p className={`text-[14px] font-medium leading-relaxed ${valueClass}`}>{value}</p>
        </div>
      ) : (
        <>
          <span className="min-w-0 flex-1 text-[13px] font-medium text-ink-3">{label}</span>
          <span className={`text-right text-[14px] font-semibold ${valueClass}`}>{value}</span>
        </>
      )}
    </div>
  );
}

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
      <div className="flex min-h-screen flex-col bg-gradient-app">
        <div className="skeleton h-[340px] animate-shimmer" />
        <div className="px-[22px] pt-5">
          <div className="skeleton h-6 w-[46%] animate-shimmer rounded-lg" />
          <div className="skeleton mt-3 h-3.5 w-[64%] animate-shimmer rounded-md" />
          <div className="skeleton mt-5 h-44 animate-shimmer rounded-[18px]" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-app">
        <p className="text-ink-2">ไม่พบประกาศนี้</p>
      </div>
    );
  }

  const isOwner = currentUserId === post.reporter_id;
  const days = daysLost(post.lost_date);
  const found = post.status === "found";
  const provinceLabel =
    post.last_seen_province === "กรุงเทพมหานคร" ? "กรุงเทพฯ" : post.last_seen_province;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-app">
      {/* Floating back button */}
      <button
        type="button"
        onClick={() => router.push("/app/care/lost")}
        className="fixed left-[18px] top-[18px] z-30 flex h-10 w-10 items-center justify-center rounded-[13px] bg-white/90 text-ink shadow-[0_6px_16px_-8px_rgba(60,40,32,.4)] backdrop-blur transition-transform active:scale-95"
      >
        <ChevronLeft size={20} />
      </button>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-8">
        {/* Photo carousel */}
        <div className="relative h-[340px] overflow-hidden bg-[#EFE7E0]">
          {post.photos.length > 0 ? (
            <>
              <div
                className="flex h-full transition-transform duration-300"
                style={{ transform: `translateX(-${photoIdx * 100}%)` }}
              >
                {post.photos.map((photo, i) => (
                  <div key={i} className="relative h-full min-w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo}
                      alt={`รูป ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
              {/* edge tap zones */}
              {post.photos.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="ก่อนหน้า"
                    onClick={() => setPhotoIdx((i) => Math.max(0, i - 1))}
                    className="absolute bottom-[50px] left-0 top-0 w-[38%]"
                  />
                  <button
                    type="button"
                    aria-label="ถัดไป"
                    onClick={() => setPhotoIdx((i) => Math.min(post.photos.length - 1, i + 1))}
                    className="absolute bottom-[50px] right-0 top-0 w-[38%]"
                  />
                  {/* Dots */}
                  <div className="absolute bottom-3.5 left-0 right-0 flex justify-center gap-1.5">
                    {post.photos.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPhotoIdx(i)}
                        className="h-[7px] rounded-full transition-all"
                        style={{
                          width: i === photoIdx ? 20 : 7,
                          background: i === photoIdx ? "#fff" : "rgba(255,255,255,.55)",
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-sm text-ink-3">ไม่มีรูปภาพ</span>
            </div>
          )}

          {/* top + bottom gradient */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30" />

          {/* Status badge — top right */}
          <span
            className={`absolute right-[18px] top-[18px] inline-flex items-center gap-1.5 rounded-[11px] px-3.5 py-[7px] text-[12.5px] font-bold text-white ${
              found
                ? "bg-teal shadow-[0_6px_14px_-6px_rgba(46,196,182,.6)]"
                : "bg-rose shadow-[0_6px_14px_-6px_rgba(224,68,90,.6)]"
            }`}
          >
            {found ? <CheckCircle2 size={14} strokeWidth={2.5} /> : <Search size={14} strokeWidth={2.5} />}
            {found ? "พบแล้ว" : "ยังตามหา"}
          </span>
        </div>

        <div className="px-[22px] pt-[18px]">
          {/* Celebration banner (shown when found) */}
          {found && (
            <div className="mb-[18px] flex items-center gap-[13px] rounded-[18px] border border-teal/40 bg-teal-soft p-[15px] animate-pop">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-teal shadow-[0_8px_18px_-8px_rgba(46,196,182,.6)]">
                <Check size={24} strokeWidth={2.5} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-bold tracking-tight2 text-teal-ink">
                  น้องกลับบ้านแล้ว 🎉
                </p>
                <p className="mt-0.5 text-[13px] text-teal-ink">
                  ขอบคุณทุกคนที่ช่วยกันตามหา
                </p>
              </div>
            </div>
          )}

          {/* Pet name */}
          <h1 className="text-[24px] font-bold tracking-title text-ink">{post.pet_name}</h1>
          <p className="mt-0.5 text-[14.5px] font-medium text-ink-2">
            {SPECIES_LABEL[post.species] ?? post.species}
            {post.breed ? ` · ${post.breed}` : ""}
          </p>

          {/* Facts card */}
          <div className="mt-4 rounded-[20px] bg-white px-4 py-[6px] shadow-card">
            <FactRow
              tone="rose"
              icon={<MapPin size={18} />}
              label="หายแถว"
              value={`${post.last_seen_district}, ${provinceLabel}`}
            />
            <FactRow
              tone="amber"
              icon={<Calendar size={18} />}
              label="วันที่หาย"
              value={thaiDate(post.lost_date)}
            />
            <FactRow
              tone="rose"
              icon={<Clock size={18} />}
              label="ระยะเวลา"
              value={found ? "พบแล้ว" : days === 0 ? "วันนี้" : `หายมาแล้ว ${days} วัน`}
              valueClass={found ? "text-teal-ink" : "text-coral-ink"}
            />
            {post.distinguishing_marks && (
              <FactRow
                tone="blue"
                icon={<Eye size={18} />}
                label="ลักษณะเด่น"
                value={post.distinguishing_marks}
                align="stacked"
              />
            )}
            {post.reward && (
              <FactRow
                tone="amber"
                icon={<Gift size={18} />}
                label="ของรางวัล"
                value={post.reward}
                valueClass="text-amber-deep"
              />
            )}
          </div>

          {/* Owner row */}
          <div className="mt-[13px] flex items-center gap-3 rounded-[18px] bg-white px-[15px] py-[13px] shadow-card">
            <Avatar name={post.profiles?.display_name ?? "ผู้ใช้งาน"} size={44} />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold text-ink">
                {post.profiles?.display_name ?? "ผู้ใช้งาน"}
              </p>
              <p className="mt-px text-[12.5px] text-ink-2">
                {isOwner ? "ประกาศของคุณ" : "เจ้าของน้อง · ตอบกลับไว"}
              </p>
            </div>
            {isOwner ? (
              <span className="rounded-[10px] bg-fill-2 px-3 py-2 text-[12px] font-semibold text-ink-2">
                คุณเอง
              </span>
            ) : (
              <button
                type="button"
                onClick={handleContact}
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] bg-teal-soft transition-transform active:scale-95"
              >
                <Phone size={18} className="text-teal-ink" />
              </button>
            )}
          </div>

          {/* Action buttons */}
          {post.status === "lost" && !isOwner && (
            <div className="mt-4 flex gap-[11px]">
              <button
                type="button"
                onClick={() => setShowSighting(true)}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-[16px] bg-gradient-cta font-bold text-white shadow-cta transition-transform active:scale-[.97]"
              >
                <MapPin size={18} strokeWidth={2.3} />
                <span className="text-[16.5px]">แจ้งเบาะแส</span>
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="flex h-14 basis-[38%] items-center justify-center gap-1.5 rounded-[16px] border-[1.5px] border-line bg-white font-bold text-ink-2 shadow-[0_6px_16px_-10px_rgba(120,72,60,.25)] transition-transform active:scale-[.97]"
              >
                <Share2 size={17} />
                <span className="text-[15.5px]">แชร์</span>
              </button>
            </div>
          )}

          {found && (
            <button
              type="button"
              onClick={handleShare}
              className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-[16px] border-[1.5px] border-line bg-white font-bold text-ink-2 shadow-[0_6px_16px_-10px_rgba(120,72,60,.25)] transition-transform active:scale-[.98]"
            >
              <Share2 size={17} />
              แชร์ข่าวดี
            </button>
          )}

          {isOwner && post.status === "lost" && (
            <button
              type="button"
              onClick={handleShare}
              className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-[16px] border-[1.5px] border-line bg-white font-bold text-ink-2 shadow-[0_6px_16px_-10px_rgba(120,72,60,.25)] transition-transform active:scale-[.98]"
            >
              <Share2 size={17} />
              แชร์โพสต์
            </button>
          )}

          {/* Owner: mark as found */}
          {isOwner && post.status === "lost" && (
            <button
              type="button"
              onClick={() => setShowFoundConfirm(true)}
              className="mt-[11px] flex h-[50px] w-full items-center justify-center gap-2 rounded-[15px] border-[1.5px] border-teal/40 bg-teal-soft transition-transform active:scale-[.98]"
            >
              <Check size={16} strokeWidth={2.5} className="text-teal-ink" />
              <span className="text-[15px] font-bold text-teal-ink">ทำเครื่องหมายว่าพบแล้ว</span>
            </button>
          )}

          {/* Sightings timeline */}
          <div className="mb-4 mt-[26px]">
            <div className="mb-3.5 flex items-center justify-between">
              <h2 className="text-[16px] font-bold tracking-tight2 text-ink">
                {found ? "เบาะแสที่ช่วยพบ" : "เบาะแสล่าสุด"}
              </h2>
              {sightings.length > 0 && (
                <span className="text-[12.5px] font-semibold text-ink-3">
                  {sightings.length} เบาะแส
                </span>
              )}
            </div>

            {sightings.length === 0 ? (
              <div className="flex flex-col items-center gap-0 rounded-[18px] border-[1.5px] border-dashed border-fill-3 bg-[#FBF7F3] px-6 py-[30px] text-center">
                <IconTile tone="neutral" size={56} rounded="rounded-[18px]" className="bg-fill-2">
                  <Search size={26} className="text-ink-3" />
                </IconTile>
                <p className="mt-3.5 text-[15px] font-bold text-ink">ยังไม่มีเบาะแส</p>
                <p className="mt-[5px] text-[13px] leading-relaxed text-ink-2">
                  ช่วยกันแชร์ประกาศนี้ออกไป
                  <br />
                  เพื่อให้น้องกลับบ้านเร็วขึ้น
                </p>
                <button
                  type="button"
                  onClick={handleShare}
                  className="mt-3.5 flex h-10 items-center gap-1.5 rounded-full bg-fill-2 px-5"
                >
                  <Share2 size={14} className="text-ink-2" />
                  <span className="text-[13px] font-semibold text-ink-2">แชร์เลย</span>
                </button>
              </div>
            ) : (
              <div className="relative">
                {sightings.map((s, i) => (
                  <div key={s.id} className="flex gap-[13px]">
                    {/* Avatar + connector */}
                    <div className="flex shrink-0 flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-coral-soft">
                        <MapPin size={14} className="text-coral-ink" />
                      </div>
                      {i < sightings.length - 1 && (
                        <div className="mt-1 w-0.5 flex-1 bg-line" style={{ minHeight: 24 }} />
                      )}
                    </div>
                    {/* Content */}
                    <div className="min-w-0 flex-1 pb-[18px]">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-bold text-ink">
                          {s.profiles?.display_name ?? "ผู้ใช้งาน"}
                        </span>
                        <span className="text-[11.5px] font-medium text-ink-3">
                          {timeAgo(s.created_at)}
                        </span>
                      </div>
                      <p className="mt-1 text-[13.5px] leading-relaxed text-ink">{s.detail}</p>
                      <span className="mt-[7px] inline-flex items-center gap-1.5 rounded-[9px] bg-fill-2 px-2.5 py-1 text-[12px] font-semibold text-ink-2">
                        <MapPin size={11} className="text-ink-3" />
                        {s.seen_at_location}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(35,24,20,.5)] p-[30px]">
          <div className="w-full max-w-[320px] animate-pop rounded-[24px] bg-white px-6 pb-[22px] pt-7 text-center shadow-popup">
            <div className="mx-auto mb-[18px] flex h-16 w-16 items-center justify-center rounded-[20px] bg-teal-soft">
              <Check size={28} strokeWidth={2.5} className="text-teal-ink" />
            </div>
            <h3 className="text-[20px] font-bold tracking-tight2 text-ink">
              ยืนยันว่าพบน้อง{post.pet_name}แล้ว?
            </h3>
            <p className="mt-[9px] text-[14.5px] leading-relaxed text-ink-2">
              สถานะจะเปลี่ยนเป็น &ldquo;พบแล้ว&rdquo; และประกาศจะถูกปิดการตามหา
            </p>
            <div className="mt-6 flex gap-[11px]">
              <button
                type="button"
                onClick={() => setShowFoundConfirm(false)}
                className="flex h-[52px] flex-1 items-center justify-center rounded-[15px] bg-fill-2"
              >
                <span className="text-[16px] font-bold text-ink-2">ยกเลิก</span>
              </button>
              <button
                type="button"
                onClick={confirmFound}
                disabled={confirming}
                className="flex h-[52px] flex-1 items-center justify-center rounded-[15px] bg-teal shadow-[0_12px_24px_-10px_rgba(46,196,182,.55)] disabled:opacity-50"
              >
                <span className="text-[16px] font-bold text-white">
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
