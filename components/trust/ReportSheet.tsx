"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const REASONS = [
  "โปรไฟล์ปลอม",
  "ข้อความไม่เหมาะสม",
  "ผสมพันธุ์แบบไม่รับผิดชอบ",
  "อื่นๆ",
];

interface Props {
  reporterPetId: string;
  reportedPetId: string;
  onClose: () => void;
  onSubmitted: () => void;
}

// Bottom sheet for reporting a pet. Inserts into `reports` (visible only to the
// reporter via RLS) then hands control back via onSubmitted for the thank-you toast.
export default function ReportSheet({
  reporterPetId,
  reportedPetId,
  onClose,
  onSubmitted,
}: Props) {
  const supabase = createClient();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!reason || saving) return;
    setSaving(true);
    await supabase.from("reports").insert({
      reporter_pet_id: reporterPetId,
      reported_pet_id: reportedPetId,
      reason,
      details: details.trim() || null,
    });
    setSaving(false);
    onSubmitted();
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black/50">
      <div className="flex-1" onClick={onClose} />

      <div
        className="mx-auto w-full max-w-[480px] rounded-t-[28px] bg-white px-6 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
        style={{ maxHeight: "88vh" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[17px] font-bold tracking-tight2 text-ink">รายงานน้องนี้</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-cream">
            <X size={20} className="text-ink-2" />
          </button>
        </div>

        <div className="overflow-hidden rounded-chip bg-fill-1">
          {REASONS.map((r, i) => {
            const active = reason === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`flex w-full items-center gap-3 px-4 py-[13px] text-left transition-colors ${
                  active ? "bg-coral/[0.04]" : ""
                } ${i !== REASONS.length - 1 ? "border-b border-line" : ""}`}
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    active ? "border-coral" : "border-fill-3"
                  }`}
                >
                  {active && <div className="h-2.5 w-2.5 rounded-full bg-coral" />}
                </div>
                <span className={`flex-1 text-sm ${active ? "font-semibold text-ink" : "text-ink-2"}`}>
                  {r}
                </span>
              </button>
            );
          })}
        </div>

        <label className="mb-2 mt-4 block text-sm font-semibold text-ink">
          รายละเอียดเพิ่มเติม (ไม่บังคับ)
        </label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="อธิบายเพิ่มเติม..."
          maxLength={500}
          rows={3}
          className="w-full resize-none rounded-2xl border border-black/10 bg-cream px-4 py-3 text-sm text-ink focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20"
        />

        <button
          type="button"
          onClick={submit}
          disabled={!reason || saving}
          className="mt-4 h-12 w-full rounded-2xl bg-gradient-cta font-bold tracking-tight2 text-white shadow-cta transition-transform active:scale-[.98] disabled:opacity-40 disabled:active:scale-100"
        >
          {saving ? "กำลังส่ง..." : "ส่งรายงาน"}
        </button>
      </div>
    </div>
  );
}
