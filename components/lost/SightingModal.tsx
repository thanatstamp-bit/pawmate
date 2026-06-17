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

  const fieldClass =
    "w-full rounded-xl border border-black/10 bg-cream px-4 py-3 text-sm " +
    "focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20";

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black/50">
      <div className="flex-1" onClick={onClose} />
      <div
        className="mx-auto w-full max-w-[480px] rounded-t-[28px] bg-white px-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
        style={{ maxHeight: "88vh" }}
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-black/10" />
        <h2 className="mb-4 text-[18px] font-bold text-brown">แจ้งเบาะแส — {petName}</h2>

        <div className="mb-3">
          <label className="mb-1.5 block text-[13px] font-semibold text-brown">
            สถานที่พบเห็น <span className="text-coral">*</span>
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="เช่น หน้าตลาดนนทบุรี, สวนลุมพินี กรุงเทพฯ"
            className={fieldClass}
          />
        </div>

        <div className="mb-5">
          <label className="mb-1.5 block text-[13px] font-semibold text-brown">
            รายละเอียด <span className="text-coral">*</span>
          </label>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="เล่าให้ฟังว่าพบเห็นอะไรบ้าง เช่น สีขน ลักษณะ พฤติกรรม..."
            rows={3}
            className={`${fieldClass} resize-none`}
          />
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-coral py-3.5 font-bold text-white transition-colors disabled:opacity-40 hover:bg-coral-dark"
        >
          <MapPin size={16} />
          {saving ? "กำลังส่ง..." : "ส่งเบาะแส"}
        </button>
      </div>
    </div>
  );
}
