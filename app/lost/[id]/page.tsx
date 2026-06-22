import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  MapPin,
  Calendar,
  Eye,
  Gift,
  Clock,
  Check,
  CheckCircle2,
  Search,
  Phone,
  LogIn,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PublicShareButton } from "@/components/lost/PublicShareButton";
import { Avatar, IconTile } from "@/components/ui";

type Props = { params: { id: string } };

type LostPetFull = {
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
};

type Sighting = {
  id: string;
  detail: string;
  seen_at_location: string;
  created_at: string;
  profiles: { display_name: string } | null;
};

const SPECIES_LABEL: Record<string, string> = {
  dog: "สุนัข",
  cat: "แมว",
  other: "อื่นๆ",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data: post } = await supabase
    .from("lost_pets")
    .select(
      "pet_name, last_seen_district, last_seen_province, photos, breed, species, distinguishing_marks, reward, lost_date, status"
    )
    .eq("id", params.id)
    .single();

  if (!post) return { title: "ประกาศสัตว์หาย — PawMate" };

  const days = Math.floor(
    (Date.now() - new Date(post.lost_date + "T00:00:00").getTime()) / 86_400_000
  );
  const desc = [
    `${SPECIES_LABEL[post.species] ?? post.species}${post.breed ? ` · ${post.breed}` : ""}`,
    post.distinguishing_marks ?? null,
    post.status === "lost" ? `หายมา ${days} วัน` : "พบแล้ว",
    post.reward ? `มีของรางวัล ${post.reward}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    title: `ตามหา${post.pet_name} หายแถว${post.last_seen_district} — PawMate`,
    openGraph: {
      title: `ตามหา${post.pet_name} หายแถว${post.last_seen_district}`,
      description: desc,
      images: post.photos[0] ? [{ url: post.photos[0] }] : [],
      type: "website",
    },
  };
}

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

export default async function PublicLostPetPage({ params }: Props) {
  const supabase = createClient();

  const [postRes, sightingsRes] = await Promise.all([
    supabase
      .from("lost_pets")
      .select("*, profiles!reporter_id(display_name)")
      .eq("id", params.id)
      .single(),
    supabase
      .from("lost_pet_sightings")
      .select(
        "id, detail, seen_at_location, created_at, reporter_id, profiles(display_name)"
      )
      .eq("lost_pet_id", params.id)
      .order("created_at", { ascending: false }),
  ]);

  if (!postRes.data || postRes.error) notFound();

  const post = postRes.data as LostPetFull & {
    profiles: { display_name: string } | null;
  };
  const sightings = (sightingsRes.data as unknown as Sighting[]) ?? [];
  const days = daysLost(post.lost_date);
  const found = post.status === "found";
  const provinceLabel =
    post.last_seen_province === "กรุงเทพมหานคร" ? "กรุงเทพฯ" : post.last_seen_province;

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-[480px] bg-gradient-app">
      {/* Logo bar */}
      <div className="flex h-[54px] items-center justify-center gap-2.5 border-b border-line bg-bg-bot/85 backdrop-blur">
        <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[10px] bg-gradient-logo shadow-[0_6px_14px_-6px_rgba(239,78,60,.6)]">
          <span className="text-[15px]">🐾</span>
        </div>
        <span className="text-[17px] font-bold tracking-tight2 text-ink">PawMate</span>
      </div>

      <div className={post.status === "lost" ? "pb-[140px]" : "pb-10"}>
        {/* Photo */}
        <div className="relative h-[340px] overflow-hidden bg-[#EFE7E0]">
          {post.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.photos[0]}
              alt={post.pet_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-sm text-ink-3">ไม่มีรูปภาพ</span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
          {/* Status badge */}
          <span
            className={`absolute right-4 top-3.5 inline-flex items-center gap-1.5 rounded-[11px] px-3.5 py-[7px] text-[12.5px] font-bold text-white ${
              found
                ? "bg-teal shadow-[0_6px_14px_-6px_rgba(46,196,182,.6)]"
                : "bg-rose shadow-[0_6px_14px_-6px_rgba(224,68,90,.6)]"
            }`}
          >
            {found ? <CheckCircle2 size={14} strokeWidth={2.5} /> : <Search size={14} strokeWidth={2.5} />}
            {found ? "พบแล้ว" : "ยังตามหา"}
          </span>
          {/* Dot indicators for multiple photos */}
          {post.photos.length > 1 && (
            <div className="absolute bottom-3.5 left-0 right-0 flex justify-center gap-1.5">
              {post.photos.map((_, i) => (
                <div
                  key={i}
                  className="h-[7px] rounded-full"
                  style={{
                    width: i === 0 ? 20 : 7,
                    background: i === 0 ? "#fff" : "rgba(255,255,255,.55)",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="px-[22px] pt-[18px]">
          {/* Found celebration strip */}
          {found && (
            <div className="mb-[18px] flex items-center gap-[13px] rounded-[18px] border border-teal/40 bg-teal-soft p-[15px]">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-teal shadow-[0_8px_18px_-8px_rgba(46,196,182,.6)]">
                <Check size={24} strokeWidth={2.5} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-bold tracking-tight2 text-teal-ink">
                  น้องกลับบ้านแล้ว 🎉
                </p>
                <p className="mt-0.5 text-[13px] text-teal-ink">
                  ขอบคุณทุกเบาะแสจากชุมชน PawMate
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
              value={found ? "พบแล้ว" : `หายมาแล้ว ${days} วัน`}
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
              <p className="mt-px text-[12.5px] text-ink-2">เจ้าของน้อง</p>
            </div>
            {post.status === "lost" ? (
              <a
                href={`tel:${post.contact}`}
                className="inline-flex items-center gap-1.5 rounded-[10px] bg-teal-soft px-3 py-2"
              >
                <Phone size={13} className="text-teal-ink" />
                <span className="text-[12.5px] font-bold text-teal-ink">โทร</span>
              </a>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-[10px] bg-fill-2 px-3 py-2">
                <Eye size={13} className="text-ink-3" />
                <span className="text-[12px] font-semibold text-ink-3">ซ่อนเบอร์</span>
              </span>
            )}
          </div>

          {/* Verified line */}
          <div className="mt-[18px] flex items-center justify-center gap-1.5 text-ink-3">
            <ShieldCheck size={14} />
            <span className="text-[12px] font-medium">ประกาศที่ยืนยันโดย PawMate</span>
          </div>

          {/* Share button */}
          <div className="mt-[18px]">
            <PublicShareButton
              petName={post.pet_name}
              variant={found ? "found" : "lost"}
            />
          </div>

          {/* Sightings timeline */}
          <div className="mb-6">
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
              <div className="flex flex-col items-center gap-1.5 rounded-[18px] border-[1.5px] border-dashed border-fill-3 bg-[#FBF7F3] px-6 py-8 text-center">
                <p className="text-[15px] font-bold text-ink">ยังไม่มีเบาะแส</p>
                <p className="text-[13px] leading-relaxed text-ink-2">
                  ช่วยแชร์ประกาศนี้เพื่อให้คนอื่นๆ ช่วยตามหา
                </p>
              </div>
            ) : (
              <div className="relative">
                {sightings.map((s, i) => (
                  <div key={s.id} className="flex gap-[13px]">
                    <div className="flex shrink-0 flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-coral-soft">
                        <MapPin size={14} className="text-coral-ink" />
                      </div>
                      {i < sightings.length - 1 && (
                        <div className="mt-1 w-0.5 flex-1 bg-line" style={{ minHeight: 24 }} />
                      )}
                    </div>
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

          {/* Footer */}
          <div className="mb-8 border-t border-line py-5 text-center">
            <p className="text-[14px] font-bold tracking-tight2 text-ink">PawMate</p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-3">
              แอปตามหาสัตว์เลี้ยงในชุมชนไทย
              <br />
              สมัครฟรี · ช่วยน้องกลับบ้านด้วยกัน
            </p>
          </div>
        </div>
      </div>

      {/* Fixed login CTA banner (lost only) */}
      {post.status === "lost" && (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] bg-gradient-to-t from-bg-bot from-24% to-transparent px-5 pb-6 pt-4">
          <a
            href={`/login?redirect=/lost/${params.id}`}
            className="flex items-center gap-[13px] rounded-[18px] bg-gradient-cta px-[18px] py-[15px] shadow-cta transition-transform active:scale-[.98]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white/20 backdrop-blur-sm">
              <LogIn size={20} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[16px] font-bold leading-tight tracking-tight2 text-white">
                พบเห็นน้องตัวนี้?
              </p>
              <p className="mt-px text-[12.5px] text-white/90">เข้าสู่ระบบเพื่อแจ้งเบาะแส</p>
            </div>
            <ChevronRight size={20} className="shrink-0 text-white" />
          </a>
          <p className="mt-[11px] text-center text-[11.5px] text-ink-3">
            ยังไม่มีบัญชี?{" "}
            <a href="/login" className="font-semibold text-coral-ink">
              สมัครสมาชิกฟรี
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
