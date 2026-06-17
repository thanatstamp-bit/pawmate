"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";

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
  return (
    <Link
      href={`/app/care/lost/${post.id}`}
      className={post.status === "found" ? "opacity-[0.78]" : ""}
    >
      <div className="overflow-hidden rounded-2xl border border-[#EDEAE6] bg-white">
        {/* Photo */}
        <div className="relative h-[152px] overflow-hidden bg-[#F5F3F0]">
          {post.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.photos[0]}
              alt={post.pet_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-xs text-brown-muted/50">ไม่มีรูป</span>
            </div>
          )}
          <span
            className="absolute right-2.5 top-2.5 rounded-lg px-2.5 py-1 text-[11px] font-bold text-white"
            style={{ background: post.status === "found" ? "#157A6E" : "#A82040" }}
          >
            {post.status === "found" ? "พบแล้ว ✓" : "ยังตามหา"}
          </span>
        </div>

        {/* Info */}
        <div className="px-3.5 py-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[15px] font-bold text-brown">{post.pet_name}</span>
            <span className="text-[11px] text-brown-muted">{daysLost(post.lost_date)}</span>
          </div>
          <p className="mt-0.5 text-[13px] text-brown-muted">
            {SPECIES_LABEL[post.species] ?? post.species}
            {post.breed ? ` · ${post.breed}` : ""}
          </p>
          <div className="mt-1.5 flex items-center gap-1">
            <MapPin size={12} className="shrink-0 text-[#C5C0BB]" />
            <span className="text-[12px] text-brown-muted">
              หายแถว {post.last_seen_district}, {post.last_seen_province}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
