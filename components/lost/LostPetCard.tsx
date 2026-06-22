"use client";

import Link from "next/link";
import { MapPin, Search, Share2, CheckCircle2 } from "lucide-react";

export type LostPet = {
  id: string;
  pet_name: string;
  species: "dog" | "cat" | "other";
  breed: string;
  photos: string[];
  last_seen_province: string;
  last_seen_district: string;
  lost_date: string;
  status: "lost" | "found";
  created_at: string;
};

const SPECIES_LABEL: Record<string, string> = {
  dog: "สุนัข",
  cat: "แมว",
  other: "อื่นๆ",
};

function daysLost(lostDate: string): string {
  const days = Math.floor(
    (Date.now() - new Date(lostDate + "T00:00:00").getTime()) / 86_400_000
  );
  if (days === 0) return "วันนี้";
  return `หายมาแล้ว ${days} วัน`;
}

export default function LostPetCard({ post }: { post: LostPet }) {
  const found = post.status === "found";
  const provinceLabel =
    post.last_seen_province === "กรุงเทพมหานคร" ? "กรุงเทพฯ" : post.last_seen_province;

  return (
    <Link
      href={`/app/care/lost/${post.id}`}
      className={`block ${found ? "opacity-90" : ""}`}
    >
      <div className="overflow-hidden rounded-[20px] bg-white shadow-card">
        {/* Photo */}
        <div className="relative h-[200px] overflow-hidden bg-fill-1">
          {post.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.photos[0]}
              alt={post.pet_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-xs text-ink-3">ไม่มีรูป</span>
            </div>
          )}
          {/* top gradient for badge legibility */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 to-transparent to-30%" />
          <span
            className={`absolute right-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-[11px] px-3 py-1.5 text-[12px] font-bold text-white ${
              found
                ? "bg-teal shadow-[0_6px_14px_-6px_rgba(46,196,182,.6)]"
                : "bg-rose shadow-[0_6px_14px_-6px_rgba(224,68,90,.6)]"
            }`}
          >
            {found ? <CheckCircle2 size={13} strokeWidth={2.5} /> : <Search size={13} strokeWidth={2.5} />}
            {found ? "พบแล้ว" : "ยังตามหา"}
          </span>
        </div>

        {/* Info */}
        <div className="p-[15px]">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[18px] font-bold tracking-tight2 text-ink">{post.pet_name}</span>
            <span className="shrink-0 text-[12.5px] font-semibold text-ink-3">
              {daysLost(post.lost_date)}
            </span>
          </div>
          <p className="mt-0.5 text-[13.5px] font-medium text-ink-2">
            {SPECIES_LABEL[post.species] ?? post.species}
            {post.breed ? ` · ${post.breed}` : ""}
          </p>
          <div className="mt-[9px] flex items-center gap-1.5">
            <MapPin size={14} className="shrink-0 text-rose" />
            <span className="text-[13.5px] font-semibold text-ink">
              หายแถว {post.last_seen_district}, {provinceLabel}
            </span>
          </div>

          {found ? (
            <div className="mt-3.5 flex items-center gap-2 rounded-chip bg-teal-soft px-3.5 py-3">
              <CheckCircle2 size={16} className="shrink-0 text-teal-ink" strokeWidth={2.2} />
              <span className="text-[13.5px] font-bold text-teal-ink">
                กลับบ้านอย่างปลอดภัยแล้ว ขอบคุณทุกคน
              </span>
            </div>
          ) : (
            <div className="mt-3.5 flex gap-2.5">
              <div className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-chip bg-coral-soft">
                <MapPin size={15} className="text-coral-ink" strokeWidth={2.2} />
                <span className="text-[14px] font-bold text-coral-ink">แจ้งเบาะแส</span>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-chip bg-fill-2">
                <Share2 size={16} className="text-ink-2" />
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
