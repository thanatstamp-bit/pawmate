"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Star, AlertOctagon, Calendar, DollarSign, Monitor, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { MockVet } from "@/lib/data/mock-vets";
import {
  getSlotsForDay,
  thaiDayLabel,
  thaiDateShort,
  thaiDateFull,
} from "@/lib/data/mock-vets";

function AvatarPlaceholder({ size = 44 }: { size?: number }) {
  return (
    <div
      className="shrink-0 overflow-hidden rounded-full border-[1.5px] flex items-center justify-center"
      style={{
        width: size,
        height: size,
        background:
          "repeating-linear-gradient(135deg,#EDEAE6 0px,#EDEAE6 4px,#E0DDD9 4px,#E0DDD9 8px)",
        borderColor: "#D5D1CC",
      }}
    >
      <span className="font-mono text-[8px] font-semibold" style={{ color: "#C5C1BC" }}>
        foto
      </span>
    </div>
  );
}

function DemoBadge() {
  return (
    <div className="flex justify-center">
      <div
        className="flex items-center gap-1.5 rounded-full border px-3 py-1"
        style={{
          background: "rgba(168,112,24,0.13)",
          borderColor: "rgba(168,112,24,0.30)",
        }}
      >
        <AlertOctagon size={10} style={{ color: "#A06820" }} />
        <span className="text-[11px] font-bold" style={{ color: "#7A5818" }}>
          ระบบสาธิต (Demo)
        </span>
      </div>
    </div>
  );
}

type StepState = "active" | "complete" | "inactive";

function StepIndicator({ step1, step2, step3 }: { step1: StepState; step2: StepState; step3: StepState }) {
  function StepCircle({ state, num, label }: { state: StepState; num: number; label: string }) {
    const base = "flex h-7 w-7 shrink-0 items-center justify-center rounded-full";
    if (state === "complete") {
      return (
        <>
          <div
            className={base}
            style={{ background: "rgba(26,138,106,0.16)" }}
          >
            <Check size={12} style={{ color: "#1A8A6A" }} strokeWidth={3} />
          </div>
          <span className="ml-1.5 whitespace-nowrap text-[10px] font-semibold" style={{ color: "#1A8A6A" }}>
            {label}
          </span>
        </>
      );
    }
    if (state === "active") {
      return (
        <>
          <div
            className={base + " text-white text-[12px] font-bold"}
            style={{
              background: "#FF6B5B",
              boxShadow: "0 2px 8px rgba(255,107,91,0.28)",
            }}
          >
            {num}
          </div>
          <span className="ml-1.5 whitespace-nowrap text-[10px] font-bold" style={{ color: "#FF6B5B" }}>
            {label}
          </span>
        </>
      );
    }
    return (
      <>
        <div
          className={base + " border-2 text-[12px] font-semibold"}
          style={{ borderColor: "#EDEAE6", color: "#C5C1BC" }}
        >
          {num}
        </div>
        <span className="ml-1.5 whitespace-nowrap text-[10px]" style={{ color: "#C5C1BC" }}>
          {label}
        </span>
      </>
    );
  }

  function Connector({ done }: { done: boolean }) {
    return (
      <div
        className="mx-2 h-[1.5px] flex-1"
        style={{
          background: done ? "#1A8A6A" : "#EDEAE6",
          opacity: done ? 0.4 : 1,
        }}
      />
    );
  }

  return (
    <div className="flex items-center px-6 py-3">
      <StepCircle state={step1} num={1} label="เลือกเวลา" />
      <Connector done={step1 === "complete"} />
      <StepCircle state={step2} num={2} label="อาการ" />
      <Connector done={step2 === "complete"} />
      <StepCircle state={step3} num={3} label="ยืนยัน" />
    </div>
  );
}

export default function VetBookingWizard({ vet }: { vet: MockVet }) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<ReturnType<typeof getSlotsForDay>[number] | null>(null);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookingRef, setBookingRef] = useState("");

  const slots = getSlotsForDay(vet.id, selectedDay);

  const dayDate = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d;
  };

  async function handleConfirm() {
    if (!selectedSlot || !topic.trim()) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const ref = `DEMO-${Math.floor(1000 + Math.random() * 9000)}`;
    setBookingRef(ref);

    await supabase.from("vet_bookings").insert({
      user_id: user.id,
      vet_id: vet.id,
      slot_time: selectedSlot.slotDate.toISOString(),
      topic: topic.trim(),
      status: "upcoming",
    });

    setLoading(false);
    setStep(3);
  }

  // ── STEP 1 ──────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <div className="flex h-14 shrink-0 items-center border-b border-black/5 px-1">
          <button
            onClick={() => router.back()}
            className="flex h-11 w-11 items-center justify-center text-brown"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="flex-1 text-center text-base font-bold text-brown">นัดหมายสัตวแพทย์</span>
          <div className="w-11" />
        </div>

        <div className="px-5 pt-2.5">
          <DemoBadge />
          <StepIndicator step1="active" step2="inactive" step3="inactive" />
        </div>

        <div className="flex flex-1 flex-col gap-3.5 px-5 pb-4 overflow-y-auto">
          {/* Vet context card */}
          <div className="flex items-center gap-3 rounded-[14px] px-3 py-3" style={{ background: "#F5F3F0" }}>
            <AvatarPlaceholder size={44} />
            <div className="min-w-0 flex-1">
              <span className="block text-[13px] font-bold text-brown">{vet.name}</span>
              <span className="text-[11px]" style={{ color: "#8A8580" }}>{vet.specialty}</span>
            </div>
            <div className="shrink-0 text-right">
              <div className="mb-0.5 flex items-center justify-end gap-0.5">
                <Star size={11} fill="#F59E0B" stroke="none" />
                <span className="text-[11px] font-semibold" style={{ color: "#5A5650" }}>{vet.rating}</span>
              </div>
              <span className="text-[12px] font-bold text-brown">฿{vet.fee}</span>
              <span className="text-[10px]" style={{ color: "#8A8580" }}>/ครั้ง</span>
            </div>
          </div>

          {/* Day selector */}
          <div>
            <span className="mb-2 block text-[11px] font-semibold tracking-[0.02em]" style={{ color: "#8A8580" }}>เลือกวัน</span>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((offset) => {
                const active = selectedDay === offset;
                return (
                  <button
                    key={offset}
                    onClick={() => { setSelectedDay(offset); setSelectedSlot(null); }}
                    className="flex h-12 flex-col items-center justify-center rounded-[13px] border-[1.5px]"
                    style={
                      active
                        ? {
                            background: "#FF6B5B",
                            borderColor: "#FF6B5B",
                            boxShadow: "0 3px 10px rgba(255,107,91,0.26)",
                          }
                        : { background: "white", borderColor: "#EDEAE6" }
                    }
                  >
                    <span className="text-[10px] font-semibold" style={{ color: active ? "rgba(255,255,255,0.82)" : "#B5B0AA" }}>
                      {thaiDayLabel(offset)}
                    </span>
                    <span className="text-[13px] font-bold" style={{ color: active ? "white" : "#5A5650" }}>
                      {thaiDateShort(dayDate(offset))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slot grid */}
          <div>
            <span className="mb-2 block text-[11px] font-semibold tracking-[0.02em]" style={{ color: "#8A8580" }}>
              เลือกเวลา — {thaiDayLabel(selectedDay)} {thaiDateShort(dayDate(selectedDay))}
            </span>
            <div className="grid grid-cols-4 gap-2">
              {slots.map((s) => {
                const isSelected = selectedSlot?.slotDate.getTime() === s.slotDate.getTime();
                if (s.taken) {
                  return (
                    <div
                      key={s.time}
                      className="flex h-11 items-center justify-center rounded-[11px] border-[1.5px] border-[#EDEAE6]"
                      style={{ background: "#F5F3F0" }}
                    >
                      <span className="text-[13px] font-medium line-through" style={{ color: "#D5D1CC" }}>
                        {s.time}
                      </span>
                    </div>
                  );
                }
                return (
                  <button
                    key={s.time}
                    onClick={() => setSelectedSlot(s)}
                    className="flex h-11 items-center justify-center rounded-[11px] border-[1.5px]"
                    style={
                      isSelected
                        ? {
                            background: "#FF6B5B",
                            borderColor: "#FF6B5B",
                            boxShadow: "0 3px 10px rgba(255,107,91,0.28)",
                          }
                        : { background: "white", borderColor: "#EDEAE6" }
                    }
                  >
                    <span
                      className="text-[13px] font-medium"
                      style={{ color: isSelected ? "white" : "#2D2A26", fontWeight: isSelected ? 700 : 500 }}
                    >
                      {s.time}
                    </span>
                  </button>
                );
              })}
            </div>
            {/* Legend */}
            <div className="mt-2 flex items-center gap-2.5">
              <div className="flex items-center gap-1">
                <div className="h-2.5 w-2.5 rounded-[3px] border border-[#EDEAE6]" style={{ background: "#F5F3F0" }} />
                <span className="text-[10px]" style={{ color: "#B5B0AA" }}>เต็มแล้ว</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2.5 w-2.5 rounded-[3px]" style={{ background: "#FF6B5B" }} />
                <span className="text-[10px]" style={{ color: "#B5B0AA" }}>เลือกอยู่</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed footer */}
        <div className="shrink-0 border-t border-black/5 bg-white px-5 pb-6 pt-3.5" style={{ boxShadow: "0 -4px 16px rgba(0,0,0,0.06)" }}>
          <button
            disabled={!selectedSlot}
            onClick={() => setStep(2)}
            className="flex h-13 w-full items-center justify-center gap-2 rounded-[16px] text-[15px] font-bold text-white transition-opacity disabled:opacity-40"
            style={{
              background: "#FF6B5B",
              boxShadow: "0 4px 14px rgba(255,107,91,0.28)",
              height: 52,
            }}
          >
            ถัดไป — อาการเบื้องต้น
            <ChevronLeft size={16} className="rotate-180" />
          </button>
        </div>
      </div>
    );
  }

  // ── STEP 2 ──────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <div className="flex h-14 shrink-0 items-center border-b border-black/5 px-1">
          <button onClick={() => setStep(1)} className="flex h-11 w-11 items-center justify-center text-brown">
            <ChevronLeft size={20} />
          </button>
          <span className="flex-1 text-center text-base font-bold text-brown">นัดหมายสัตวแพทย์</span>
          <div className="w-11" />
        </div>

        <div className="px-5 pt-2.5">
          <DemoBadge />
          <StepIndicator step1="complete" step2="active" step3="inactive" />
        </div>

        <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-5 pb-4">
          {/* Recap chip */}
          <div className="flex items-center gap-2 rounded-[12px] px-3 py-2.5" style={{ background: "#F5F3F0" }}>
            <Calendar size={13} style={{ color: "#B5B0AA" }} />
            <span className="text-[12px] font-semibold" style={{ color: "#5A5650" }}>{vet.name}</span>
            <span className="text-[12px]" style={{ color: "#B5B0AA" }}>·</span>
            <span className="text-[12px]" style={{ color: "#5A5650" }}>
              {selectedSlot && `${thaiDayLabel(selectedSlot.dayOffset)} ${selectedSlot.time} น.`}
            </span>
          </div>

          {/* Textarea */}
          <div className="flex flex-col gap-2">
            <div>
              <span className="block text-[14px] font-bold text-brown">เล่าอาการของน้องเบื้องต้น</span>
              <span className="mt-0.5 block text-[12px] leading-[1.5]" style={{ color: "#8A8580" }}>
                ช่วยให้สัตวแพทย์เตรียมตัวและใช้เวลาของคุณได้คุ้มค่าที่สุด
              </span>
            </div>
            <div className="flex flex-col justify-between rounded-[14px] border-2 border-coral px-3.5 py-3" style={{ minHeight: 160 }}>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value.slice(0, 500))}
                placeholder="อาการของน้อง เช่น กินข้าวน้อยลง เซื่องซึม มีไข้..."
                className="flex-1 resize-none bg-transparent text-[13px] leading-[1.7] text-brown outline-none placeholder:text-[#B5B0AA]"
                style={{ minHeight: 100 }}
              />
              <span className="mt-2 self-end text-[10px] font-mono" style={{ color: "#B5B0AA" }}>
                {topic.length}/500
              </span>
            </div>

            {/* Suggestions */}
            <div className="rounded-[12px] px-3 py-2.5" style={{ background: "#F5F3F0" }}>
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.04em]" style={{ color: "#8A8580" }}>
                ข้อมูลที่เป็นประโยชน์
              </span>
              <div className="flex flex-col gap-1.5">
                {["อาการเริ่มเมื่อไหร่ กินนานแค่ไหน?", "กินยาหรืออาหารใหม่ก่อนหน้า?", "น้ำหนัก อายุ เพศ (ทำหมันหรือยัง?)"].map((s) => (
                  <div key={s} className="flex items-start gap-1.5">
                    <span className="mt-0.5 shrink-0 text-[11px]" style={{ color: "#B5B0AA" }}>·</span>
                    <span className="text-[12px] leading-[1.5]" style={{ color: "#5A5650" }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed footer */}
        <div className="shrink-0 border-t border-black/5 bg-white px-5 pb-6 pt-3.5" style={{ boxShadow: "0 -4px 18px rgba(0,0,0,0.07)" }}>
          <button
            disabled={!topic.trim() || loading}
            onClick={handleConfirm}
            className="flex h-[52px] w-full items-center justify-center rounded-[16px] text-[15px] font-bold text-white transition-opacity disabled:opacity-40"
            style={{ background: "#FF6B5B", boxShadow: "0 4px 14px rgba(255,107,91,0.28)" }}
          >
            {loading ? "กำลังบันทึก..." : "ยืนยันการจอง"}
          </button>
        </div>
      </div>
    );
  }

  // ── STEP 3 (SUCCESS) ────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex h-14 shrink-0 items-center border-b border-black/5 px-1">
        <div className="flex h-11 w-11 items-center justify-center">
          <ChevronLeft size={20} style={{ color: "#D5D1CC" }} />
        </div>
        <span className="flex-1 text-center text-base font-bold text-brown">การจองของฉัน</span>
        <div className="w-11" />
      </div>

      <div className="px-5 pt-2.5">
        <DemoBadge />
        <StepIndicator step1="complete" step2="complete" step3="active" />
      </div>

      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-5 pb-8">
        {/* Success hero */}
        <div className="flex flex-col items-center gap-2 pb-2 pt-4">
          <div
            className="mb-0.5 flex h-[60px] w-[60px] items-center justify-center rounded-full"
            style={{ background: "rgba(26,138,106,0.14)" }}
          >
            <Check size={26} style={{ color: "#1A8A6A" }} strokeWidth={3} />
          </div>
          <span className="text-[18px] font-bold text-brown">จองสำเร็จแล้ว</span>
          <span className="font-mono text-[11px] tracking-[0.06em]" style={{ color: "#B5B0AA" }}>
            #{bookingRef}
          </span>
        </div>

        {/* Booking detail card */}
        <div className="flex flex-col rounded-[18px] border-[1.5px] border-[#EDEAE6] p-4">
          {/* Vet row */}
          <div className="flex items-center gap-3 border-b border-[#F5F3F0] pb-3">
            <AvatarPlaceholder size={46} />
            <div className="min-w-0 flex-1">
              <span className="block text-[13px] font-bold text-brown">{vet.name}</span>
              <span className="text-[11px]" style={{ color: "#8A8580" }}>
                {vet.specialty} · ฿{vet.fee}/ครั้ง
              </span>
            </div>
          </div>

          {/* Date row */}
          <div className="flex items-center gap-2.5 border-b border-[#F5F3F0] py-2.5">
            <Calendar size={14} style={{ color: "#B5B0AA", flexShrink: 0 }} />
            <span className="flex-1 text-[13px]" style={{ color: "#5A5650" }}>
              {selectedSlot && thaiDateFull(selectedSlot.slotDate)}
            </span>
            <span className="text-[14px] font-bold text-brown">
              {selectedSlot?.time} น.
            </span>
          </div>

          {/* Topic row */}
          <div className="flex items-start gap-2.5 border-b border-[#F5F3F0] py-2.5">
            <DollarSign size={14} style={{ color: "#B5B0AA", flexShrink: 0, marginTop: 2 }} />
            <span className="flex-1 text-[12px] leading-[1.55]" style={{ color: "#5A5650" }}>
              {topic.length > 60 ? topic.slice(0, 60) + "…" : topic}
            </span>
          </div>

          {/* Channel row */}
          <div className="flex items-center gap-2.5 pt-2.5">
            <Monitor size={14} style={{ color: "#B5B0AA", flexShrink: 0 }} />
            <span className="flex-1 text-[13px]" style={{ color: "#5A5650" }}>ช่องทาง</span>
            <span className="text-[13px] font-semibold" style={{ color: "#5A8FD4" }}>Video Call</span>
          </div>
        </div>

        {/* Amber disclaimer */}
        <div
          className="flex items-start gap-2 rounded-[12px] border-[1.5px] px-3 py-2.5"
          style={{
            background: "rgba(168,112,24,0.07)",
            borderColor: "rgba(168,112,24,0.22)",
          }}
        >
          <AlertOctagon size={11} style={{ color: "#A06820", flexShrink: 0, marginTop: 2 }} />
          <p className="text-[11px] leading-[1.6]" style={{ color: "#7A5818" }}>
            ระบบสาธิต — ไม่มีการนัดหมายจริง สัตวแพทย์และเวลาทั้งหมดเป็นข้อมูลจำลอง
          </p>
        </div>

        {/* Primary CTA */}
        <a
          href="/app/care/vet-online/bookings"
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[16px] text-[15px] font-bold text-white"
          style={{ background: "#FF6B5B", boxShadow: "0 4px 14px rgba(255,107,91,0.28)" }}
        >
          <Calendar size={16} />
          ดูการจองของฉัน
        </a>

        {/* Secondary */}
        <a
          href="/app/care/vet-online"
          className="flex h-11 items-center justify-center text-[13px] font-semibold"
          style={{ color: "#8A8580" }}
        >
          กลับหน้าหลัก
        </a>
      </div>
    </div>
  );
}
