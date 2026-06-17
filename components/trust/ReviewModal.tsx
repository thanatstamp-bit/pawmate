"use client";

import { useEffect, useState } from "react";
import { Star, X, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const REVIEW_TAGS = ["ตรงปก", "เป็นมิตร", "แนะนำเลย"];
const RATING_LABELS = ["", "แย่", "พอใช้", "ปานกลาง", "ดี", "ดีมาก"];

interface Props {
  matchId: string;
  reviewerPetId: string;
  reviewedPetId: string;
  petName?: string;
  onClose: () => void;
  onSuccess: () => void;
  onDeleted?: () => void;
}

// Modal for rating the other pet after a match. One review per (match, reviewer):
// if a review already exists it is loaded for editing and UPDATEd, otherwise a new
// row is INSERTed. The DB unique constraint guarantees no duplicates.
export default function ReviewModal({
  matchId,
  reviewerPetId,
  reviewedPetId,
  petName,
  onClose,
  onSuccess,
  onDeleted,
}: Props) {
  const supabase = createClient();

  const [existingId, setExistingId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, rating, tags, comment")
        .eq("match_id", matchId)
        .eq("reviewer_pet_id", reviewerPetId)
        .maybeSingle();
      if (data) {
        setExistingId(data.id);
        setRating(data.rating);
        setTags(data.tags ?? []);
        setComment(data.comment ?? "");
      }
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, reviewerPetId]);

  function toggleTag(tag: string) {
    setTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]));
  }

  async function save() {
    if (rating < 1 || saving) return;
    setSaving(true);

    const payload = {
      rating,
      tags,
      comment: comment.trim() || null,
    };

    if (existingId) {
      await supabase.from("reviews").update(payload).eq("id", existingId);
    } else {
      await supabase.from("reviews").insert({
        match_id: matchId,
        reviewer_pet_id: reviewerPetId,
        reviewed_pet_id: reviewedPetId,
        ...payload,
      });
    }

    setSaving(false);
    onSuccess();
  }

  async function deleteReview() {
    if (!existingId || deleting) return;
    setDeleting(true);
    await supabase.from("reviews").delete().eq("id", existingId);
    setDeleting(false);
    (onDeleted ?? onSuccess)();
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-6">
      <div className="w-full max-w-[380px] rounded-card bg-white p-6">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-lg font-bold text-brown">
            {existingId ? "แก้ไขรีวิว" : "ให้คะแนนหลังนัดเจอ"}
          </h3>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-cream">
            <X size={18} className="text-brown-muted" />
          </button>
        </div>
        {petName && <p className="text-sm text-brown-muted">{petName}</p>}

        {loading ? (
          <div className="mt-3 h-40 animate-pulse rounded-card bg-black/5" />
        ) : (
          <>
            {/* Stars */}
            <div className="mt-4 flex justify-center gap-2.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)}>
                  <Star
                    size={36}
                    className={
                      n <= rating ? "fill-amber text-amber" : "fill-transparent text-[#D5D1CC]"
                    }
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="mt-1.5 text-center text-xs text-[#B5B0AA]">
                {RATING_LABELS[rating]}
              </p>
            )}

            {/* Quick tags */}
            <p className="mb-2.5 mt-4 text-xs font-semibold text-brown">
              เลือกคำอธิบาย (ไม่บังคับ)
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {REVIEW_TAGS.map((tag) => {
                const active = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                      active
                        ? "bg-teal text-white"
                        : "border-[1.5px] border-[#EDEAE6] bg-[#F0EEEB] text-[#5A5650]"
                    }`}
                  >
                    {active && <Check size={11} />}
                    {tag}
                  </button>
                );
              })}
            </div>

            {/* Comment */}
            <p className="mb-2 mt-4 text-xs font-semibold text-brown">
              ความคิดเห็น (ไม่บังคับ)
            </p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="เล่าประสบการณ์การนัดเจอ (ไม่บังคับ)"
              maxLength={500}
              rows={3}
              className="w-full resize-none rounded-xl border-[1.5px] border-black/10 bg-cream px-4 py-3 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
            />

            <button
              type="button"
              onClick={save}
              disabled={rating < 1 || saving}
              className="mt-4 w-full rounded-full bg-coral py-3 font-bold text-white transition-colors disabled:opacity-40 hover:bg-coral-dark"
            >
              {saving ? "กำลังบันทึก..." : existingId ? "แก้ไขรีวิว" : "บันทึกรีวิว"}
            </button>

            {existingId && (
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(true)}
                className="mt-2.5 w-full py-1 text-center text-[13px] font-medium text-rose"
              >
                ลบรีวิวนี้
              </button>
            )}
          </>
        )}
      </div>

      {/* Delete confirm */}
      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-[71] flex items-center justify-center bg-black/50 p-6">
          <div className="w-full max-w-[320px] rounded-card bg-white p-6 text-center shadow-2xl">
            <h3 className="text-lg font-bold text-brown">ลบรีวิวนี้?</h3>
            <p className="mt-2 text-sm text-brown-muted">
              การลบรีวิวจะไม่สามารถย้อนกลับได้
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(false)}
                className="flex-1 rounded-full border-2 border-black/10 py-2.5 font-bold text-brown-muted"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={deleteReview}
                disabled={deleting}
                className="flex-1 rounded-full bg-rose py-2.5 font-bold text-white disabled:opacity-60"
              >
                {deleting ? "กำลังลบ..." : "ลบ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
