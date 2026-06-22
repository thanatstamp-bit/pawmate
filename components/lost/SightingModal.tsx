"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  lostPetId: string;
  petName: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function SightingModal({ lostPetId, petName, onClose, onSubmitted }: Props) {
  const supabase = createClient();
  const [location, setLocation] = useState("");
  const [detail, setDetail] = useState("");
  const [saving, setSaving] = useState(false);

  const canSubmit = location.trim().length > 0 && detail.trim().length > 0 && !saving;

  async function submit() {
    if (!canSubmit) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }
    await supabase.from("lost_pet_sightings").insert({
      lost_pet_id: lostPetId,
      reporter_id: user.id,
      detail: detail.trim(),
      seen_at_location: location.trim(),
    });
    setSaving(false);
    onSubmitted();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-[rgba(35,24,20,.45)] backdrop-blur-[2px]">
      <div className="flex-1" onClick={onClose} />
      <div
        className="mx-auto w-full max-w-[480px] rounded-t-[24px] bg-white px-6 pb-[calc(1.875rem+env(safe-area-inset-bottom))] pt-3 shadow-sheet animate-fade-up"
        style={{ maxHeight: "88vh" }}
      >
        <div className="mx-auto mb-4 h-[5px] w-10 rounded-full bg-fill-3" />
        <h2 className="text-[18px] font-bold tracking-tight2 text-ink">แจ้งเบาะแส — {petName}</h2>
        <p className="mb-[18px] mt-1 text-[13px] text-ink-2">
          เห็นน้องตัวนี้ที่ไหน ช่วยบอกหน่อยนะ ทุกเบาะแสมีค่า
        </p>

        <label className="mb-2 block text-[13px] font-semibold text-ink">รายละเอียด</label>
        <div className="mb-4 rounded-[14px] border-[1.5px] border-line bg-[#FBF7F3] px-3.5 py-[13px] focus-within:border-coral focus-within:ring-2 focus-within:ring-coral/15">
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="เช่น เห็นน้องวิ่งแถวปากซอยตอนเช้า"
            rows={3}
            className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-ink placeholder:text-ink-3 focus:outline-none"
          />
        </div>

        <label className="mb-2 block text-[13px] font-semibold text-ink">สถานที่ที่พบ</label>
        <div className="mb-[22px] flex h-[52px] items-center gap-2.5 rounded-[14px] border-[1.5px] border-line bg-[#FBF7F3] px-3.5 focus-within:border-coral focus-within:ring-2 focus-within:ring-coral/15">
          <MapPin size={18} className="shrink-0 text-ink-3" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="เช่น ซ.ลาดพร้าว 71"
            className="min-w-0 flex-1 bg-transparent text-[16px] font-medium text-ink placeholder:text-ink-3 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[16px] bg-gradient-cta text-[17px] font-bold text-white shadow-cta transition-transform active:scale-[.97] disabled:opacity-40"
        >
          <MapPin size={16} />
          {saving ? "กำลังส่ง..." : "ส่งเบาะแส"}
        </button>
      </div>
    </div>
  );
}
