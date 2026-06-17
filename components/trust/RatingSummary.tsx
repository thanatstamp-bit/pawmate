"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ReviewRow = {
  rating: number;
  comment: string | null;
  created_at: string;
  // Supabase returns the joined relation as an object (or array in some shapes)
  reviewer: { name: string } | { name: string }[] | null;
};

function reviewerName(reviewer: ReviewRow["reviewer"]): string {
  if (!reviewer) return "ผู้ใช้";
  if (Array.isArray(reviewer)) return reviewer[0]?.name ?? "ผู้ใช้";
  return reviewer.name;
}

// Abbreviated Thai "time ago" — short enough to fit alongside a name + stars
// on one line in the compact inline-review layout.
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "เมื่อสักครู่";
  if (mins < 60) return `${mins} น.`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ชม.`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} วัน`;
  if (days < 30) return `${Math.floor(days / 7)} สป.`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ด.`;
  return `${Math.floor(months / 12)} ปี`;
}

function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={
            n <= value ? "fill-amber text-amber" : "fill-transparent text-[#D5D1CC]"
          }
        />
      ))}
    </div>
  );
}

// Fetches and renders the rating summary for a pet. Mounted only when the detail
// sheet is open, so reviews load on demand rather than for every card in the deck.
export default function RatingSummary({ petId }: { petId: string }) {
  const supabase = createClient();
  const [reviews, setReviews] = useState<ReviewRow[] | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("reviews")
        .select("rating, comment, created_at, reviewer:pets!reviewer_pet_id(name)")
        .eq("reviewed_pet_id", petId)
        .order("created_at", { ascending: false });
      if (active) setReviews((data as ReviewRow[] | null) ?? []);
    })();
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petId]);

  if (reviews === null) {
    return <div className="h-[88px] animate-pulse rounded-[14px] bg-[#F9F8F6]" />;
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-[14px] bg-[#F9F8F6] p-3">
        <p className="text-sm text-brown-muted">ยังไม่มีรีวิว</p>
      </div>
    );
  }

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const recentComments = reviews.filter((r) => r.comment?.trim()).slice(0, 3);

  return (
    <div className="flex items-center gap-3.5 rounded-[14px] bg-[#F9F8F6] p-3">
      <div className="flex-shrink-0 text-center">
        <span className="block text-[28px] font-bold leading-none text-brown">
          {avg.toFixed(1)}
        </span>
        <div className="my-1 flex justify-center">
          <Stars value={Math.round(avg)} size={12} />
        </div>
        <span className="text-[11px] text-[#B5B0AA]">{reviews.length} รีวิว</span>
      </div>

      <div className="w-px self-stretch bg-[#EDEAE6]" />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {recentComments.length > 0 ? (
          recentComments.map((r, i) => (
            <div key={i} className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-xs font-semibold text-brown">
                  {reviewerName(r.reviewer)}
                </span>
                <Stars value={r.rating} size={10} />
                <span className="ml-0.5 shrink-0 text-[10px] text-[#B5B0AA]">
                  {timeAgo(r.created_at)}
                </span>
              </div>
              <p className="text-[11px] leading-[1.4] text-[#5A5650]">{r.comment}</p>
            </div>
          ))
        ) : (
          <p className="text-xs text-brown-muted">ยังไม่มีความคิดเห็น</p>
        )}
      </div>
    </div>
  );
}
