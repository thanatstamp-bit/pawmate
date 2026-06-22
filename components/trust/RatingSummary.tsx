"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui";

// Quality label derived from the average rating (matches the hi-fi ref).
function qualityLabel(avg: number): string {
  if (avg >= 4.5) return "เป็นที่ชื่นชอบ";
  if (avg >= 4.0) return "น่าประทับใจ";
  if (avg >= 3.5) return "ดีมาก";
  if (avg >= 3.0) return "ดี";
  return "พอใช้";
}

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
            n <= value ? "fill-amber text-amber" : "fill-transparent text-fill-3"
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
    return (
      <div>
        <h3 className="mb-2.5 text-base font-bold tracking-tight2 text-ink">รีวิวและคะแนน</h3>
        <div className="h-[92px] animate-pulse rounded-panel bg-fill-1" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div>
        <h3 className="mb-2.5 text-base font-bold tracking-tight2 text-ink">รีวิวและคะแนน</h3>
        <div className="rounded-panel bg-fill-1 p-4 text-center text-sm text-ink-2">ยังไม่มีรีวิว</div>
      </div>
    );
  }

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const listed = reviews.slice(0, 5);

  return (
    <div>
      <h3 className="mb-2.5 text-base font-bold tracking-tight2 text-ink">รีวิวและคะแนน</h3>

      {/* Prominent rating card */}
      <div className="flex items-center gap-4 rounded-panel bg-amber-soft p-4">
        <div className="shrink-0 text-center">
          <span className="block text-[34px] font-bold leading-none tabular-nums text-ink">
            {avg.toFixed(1)}
          </span>
          <div className="mt-1.5 flex justify-center">
            <Stars value={Math.round(avg)} size={13} />
          </div>
        </div>
        <div className="min-w-0">
          <p className="font-bold tracking-tight2 text-ink">{qualityLabel(avg)}</p>
          <p className="mt-0.5 text-sm text-amber-deep">จาก {reviews.length} รีวิว</p>
        </div>
      </div>

      {/* Review list */}
      <div className="mt-3.5 flex flex-col gap-3.5">
        {listed.map((r, i) => (
          <div key={i} className="flex gap-3">
            <Avatar name={reviewerName(r.reviewer)} size={36} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-ink">
                  {reviewerName(r.reviewer)}
                </span>
                <span className="ml-auto shrink-0 text-[11px] text-ink-3">
                  {timeAgo(r.created_at)}
                </span>
              </div>
              <div className="mt-0.5"><Stars value={r.rating} size={11} /></div>
              {r.comment?.trim() && (
                <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{r.comment}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
