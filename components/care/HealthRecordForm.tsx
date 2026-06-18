"use client";

import { useCallback, useState } from "react";
import { ShieldPlus, Pill, Activity, FileText, X, Check, Trash2, ChevronDown, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { syncVaccinatedBadge } from "@/lib/health";
import Toast from "@/components/trust/Toast";

// ─── Types ────────────────────────────────────────────────────────────────────

export type HealthRecord = {
  id: string;
  pet_id: string;
  type: "vaccine" | "deworm" | "checkup" | "other";
  title: string;
  record_date: string;
  next_due_date: string | null;
  notes: string | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_OPTIONS: {
  value: HealthRecord["type"];
  label: string;
  icon: typeof ShieldPlus;
}[] = [
  { value: "vaccine",  label: "วัคซีน",       icon: ShieldPlus },
  { value: "deworm",   label: "ถ่ายพยาธิ",    icon: Pill       },
  { value: "checkup",  label: "ตรวจสุขภาพ",   icon: Activity   },
  { value: "other",    label: "อื่นๆ",         icon: FileText   },
];

const SUGGESTIONS: Record<HealthRecord["type"], string[]> = {
  vaccine: ["วัคซีนพิษสุนัขบ้า", "วัคซีนรวม 5 โรค", "วัคซีนไข้หัด"],
  deworm:  ["ถ่ายพยาธิภายใน", "หยดยากันเห็บหมัด", "ยาถ่ายพยาธิ Milbemax"],
  checkup: ["ตรวจสุขภาพประจำปี", "ตรวจเลือด CBC", "ทำฟัน"],
  other:   [],
};

function formatNextDueThai(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  petId: string;
  record?: HealthRecord;
  onClose: () => void;
  onSave: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HealthRecordForm({ petId, record, onClose, onSave }: Props) {
  const supabase = createClient();
  const isEdit = !!record;
  const today = new Date().toISOString().slice(0, 10);

  const [type, setType] = useState<HealthRecord["type"]>(record?.type ?? "vaccine");
  const [title, setTitle] = useState(record?.title ?? "");
  const [recordDate, setRecordDate] = useState(record?.record_date ?? today);
  const [showNextDue, setShowNextDue] = useState(!!record?.next_due_date);
  const [nextDueDate, setNextDueDate] = useState(record?.next_due_date ?? "");
  const [notes, setNotes] = useState(record?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [showDeleteBanner, setShowDeleteBanner] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const clearToast = useCallback(() => setToast(null), []);

  async function handleSave() {
    if (!title.trim() || !recordDate) return;
    setSaving(true);

    const payload = {
      pet_id: petId,
      type,
      title: title.trim(),
      record_date: recordDate,
      next_due_date: showNextDue && nextDueDate ? nextDueDate : null,
      notes: notes.trim() || null,
    };

    if (isEdit) {
      await supabase.from("health_records").update(payload).eq("id", record.id);
    } else {
      await supabase.from("health_records").insert(payload);
    }

    const flipped = await syncVaccinatedBadge(supabase, petId);
    setSaving(false);

    if (flipped) {
      setToast("ปักป้ายฉีดวัคซีนแล้วบนโปรไฟล์เรียบร้อย");
      setTimeout(() => onSave(), 2200);
    } else {
      onSave();
    }
  }

  async function handleDelete() {
    setSaving(true);
    await supabase.from("health_records").delete().eq("id", record!.id);
    await syncVaccinatedBadge(supabase, petId);
    setSaving(false);
    onSave();
  }

  return (
    <>
      {/* ── Overlay ── */}
      <div className="fixed inset-0 z-[60] flex flex-col" onClick={onClose}>

        {/* Scrim (click to close) */}
        <div className="flex-1" />

        {/* Bottom Sheet */}
        <div
          className="mx-auto flex w-full max-w-[480px] flex-col rounded-t-[20px] bg-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="mx-auto mt-2.5 h-1 w-9 rounded-full bg-[#D5D1CC]" />

          {/* Sheet header */}
          <div className="flex items-center justify-between px-5 pb-0 pt-3.5">
            <span className="text-[15px] font-bold text-brown">
              {isEdit ? "แก้ไขบันทึก" : "เพิ่มบันทึกสุขภาพ"}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#F5F3F0]"
            >
              <X size={14} className="text-brown-muted" strokeWidth={2.5} />
            </button>
          </div>

          {/* Scrollable form body */}
          <div className="flex flex-col gap-0 overflow-y-auto px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">

            {/* Type selector */}
            <div className="mt-4 mb-3.5">
              <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.02em] text-brown-muted">
                ประเภท
              </span>
              <div className="flex gap-1.5">
                {TYPE_OPTIONS.map(({ value, label, icon: Icon }) => {
                  const active = type === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => { setType(value); if (!isEdit) setTitle(""); }}
                      className="flex h-9 flex-1 items-center justify-center gap-1 rounded-[10px] text-[11px] font-semibold transition-colors"
                      style={
                        active
                          ? { background: "#FF6B5B", color: "#fff" }
                          : { border: "1.5px solid #EDEAE6", color: "#8A8580" }
                      }
                    >
                      {active && <Icon size={11} strokeWidth={2.5} />}
                      <span className="whitespace-nowrap">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ชื่อรายการ */}
            <div className="mb-1.5">
              <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.02em] text-brown-muted">
                ชื่อรายการ
              </span>
              <div
                className="flex h-11 items-center rounded-[11px] px-3.5"
                style={{ border: `1.5px solid ${title ? "#FF6B5B" : "#EDEAE6"}` }}
              >
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ระบุชื่อวัคซีน/รายการ"
                  className="flex-1 bg-transparent text-sm text-brown placeholder:text-[#C5C1BC] focus:outline-none"
                />
                {title && (
                  <button type="button" onClick={() => setTitle("")}>
                    <X size={14} className="text-[#D5D1CC]" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick suggestions */}
            {SUGGESTIONS[type].length > 0 && (
              <div className="mb-3.5 flex flex-wrap gap-1.5">
                {SUGGESTIONS[type].map((s) => {
                  const selected = title === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTitle(s)}
                      className="flex h-[26px] items-center rounded-full px-2.5 text-[11px] font-medium transition-colors"
                      style={
                        selected
                          ? { background: "rgba(255,107,91,0.07)", border: "1px solid rgba(255,107,91,0.28)", color: "#FF6B5B" }
                          : { background: "#F5F3F0", border: "1px solid #EDEAE6", color: "#5A5650" }
                      }
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            )}

            {/* วันที่บันทึก */}
            <div className="mb-2.5">
              <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.02em] text-brown-muted">
                วันที่บันทึก
              </span>
              <div
                className="flex h-11 items-center rounded-[11px] px-3.5"
                style={{ border: "1.5px solid #EDEAE6" }}
              >
                <input
                  type="date"
                  value={recordDate}
                  max={today}
                  onChange={(e) => setRecordDate(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-brown focus:outline-none"
                />
              </div>
            </div>

            {/* วันนัดครั้งต่อไป — collapsible */}
            <div
              className="mb-2.5"
              style={{ borderTop: "1px solid #F5F3F0", borderBottom: showNextDue ? "none" : "1px solid #F5F3F0" }}
            >
              <button
                type="button"
                onClick={() => setShowNextDue((v) => !v)}
                className="flex w-full items-center justify-between py-2.5"
              >
                <div>
                  <p className="text-[13px] font-medium text-brown">วันนัดครั้งต่อไป</p>
                  {showNextDue && nextDueDate ? (
                    <p className="mt-px text-[12px] font-semibold" style={{ color: "#1A8A6A" }}>
                      {formatNextDueThai(nextDueDate)}
                    </p>
                  ) : (
                    <p className="mt-px text-[11px] text-brown-muted">สร้างการแจ้งเตือนอัตโนมัติ</p>
                  )}
                </div>
                {!showNextDue ? (
                  <span className="text-[13px] font-bold text-coral">+ เพิ่ม</span>
                ) : (
                  <ChevronDown size={14} className="text-brown-muted" />
                )}
              </button>
              {showNextDue && (
                <div
                  className="pb-2.5"
                  style={{ borderBottom: "1px solid #F5F3F0" }}
                >
                  <input
                    type="date"
                    value={nextDueDate}
                    min={recordDate}
                    onChange={(e) => setNextDueDate(e.target.value)}
                    className="w-full rounded-[11px] px-3.5 py-3 text-sm text-brown focus:outline-none"
                    style={{ border: "1.5px solid #EDEAE6" }}
                  />
                </div>
              )}
            </div>

            {/* หมายเหตุ */}
            <div className="mb-3.5">
              <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.02em] text-brown-muted">
                หมายเหตุ (ไม่บังคับ)
              </span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="โรงพยาบาล, ยี่ห้อยา, อาการ…"
                className="w-full resize-none rounded-[11px] px-3.5 py-3 text-[13px] text-brown placeholder:italic placeholder:text-[#C5C1BC] focus:outline-none"
                style={{ border: "1.5px solid #EDEAE6" }}
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !title.trim() || !recordDate}
                className="flex h-12 flex-1 items-center justify-center rounded-[14px] bg-coral text-[14px] font-bold text-white disabled:opacity-50"
                style={{ boxShadow: "0 4px 12px rgba(255,107,91,0.26)" }}
              >
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
              {isEdit && (
                <button
                  type="button"
                  onClick={() => setShowDeleteBanner((v) => !v)}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]"
                  style={{ border: "1.5px solid rgba(155,34,34,0.28)", background: "rgba(155,34,34,0.05)" }}
                >
                  <Trash2 size={16} style={{ color: "#8B1A1A" }} strokeWidth={2.2} />
                </button>
              )}
            </div>

            {/* Inline delete confirm banner */}
            {showDeleteBanner && (
              <div
                className="mt-3 flex items-center gap-2.5 rounded-xl px-3.5 py-3"
                style={{ background: "rgba(155,34,34,0.06)", border: "1.5px solid rgba(155,34,34,0.20)" }}
              >
                <AlertTriangle size={14} style={{ color: "#8B1A1A", flexShrink: 0 }} strokeWidth={2.2} />
                <span className="flex-1 text-xs leading-[1.4]" style={{ color: "#8B1A1A" }}>
                  ลบรายการนี้? ข้อมูลจะหายถาวร
                </span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="shrink-0 text-xs font-bold whitespace-nowrap"
                  style={{ color: "#8B1A1A" }}
                >
                  {saving ? "กำลังลบ..." : "ยืนยันลบ"}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          title={toast}
          subtitle="วัคซีนพิษสุนัขบ้าภายใน 12 เดือน"
          icon={<Check size={9} className="text-[#1A8A6A]" strokeWidth={3.5} />}
          onDone={clearToast}
        />
      )}
    </>
  );
}
