"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Star, AlertOctagon, Calendar, Monitor, Check, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { MockVet } from "@/lib/data/mock-vets";
import {
  getSlotsForDay,
  thaiDayLabel,
  thaiDateShort,
  thaiDateFull,
} from "@/lib/data/mock-vets";
import { Avatar } from "@/components/ui";

function DemoBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-[9px] bg-amber-soft px-2.5 py-[5px] text-[11.5px] font-bold text-amber-deep">
      <AlertOctagon size={11} />
      ระบบสาธิต (Demo)
    </span>
  );
}

type StepState = "active" | "complete" | "inactive";

function StepIndicator({ step1, step2, step3 }: { step1: StepState; step2: StepState; step3: StepState }) {
  function StepCircle({ state, num, label }: { state: StepState; num: number; label: string }) {
    const base = "flex h-7 w-7 shrink-0 items-center justify-center rounded-full";
    if (state === "complete") {
      return (
        <>
          <div className={base + " bg-teal-soft text-teal-ink"}>
            <Check size={12} strokeWidth={3} />
          </div>
          <span className="ml-1.5 whitespace-nowrap text-[10px] font-semibold text-teal-ink">{label}</span>
        </>
      );
    }
    if (state === "active") {
      return (
        <>
          <div className={base + " bg-gradient-cta text-[12px] font-bold text-white shadow-cta"}>{num}</div>
          <span className="ml-1.5 whitespace-nowrap text-[10px] font-bold text-coral">{label}</span>
        </>
      );
    }
    return (
      <>
        <div className={base + " border-2 border-line text-[12px] font-semibold text-ink-3"}>{num}</div>
        <span className="ml-1.5 whitespace-nowrap text-[10px] text-ink-3">{label}</span>
      </>
    );
  }

  function Connector({ done }: { done: boolean }) {
    return <div className={"mx-2 h-[1.5px] flex-1 " + (done ? "bg-teal/40" : "bg-line")} />;
  }

  return (
    <div className="flex items-center px-1 py-3">
      <StepCircle state={step1} num={1} label="เลือกเวลา" />
      <Connector done={step1 === "complete"} />
      <StepCircle state={step2} num={2} label="อาการ" />
      <Connector done={step2 === "complete"} />
      <StepCircle state={step3} num={3} label="ยืนยัน" />
    </div>
  );
}

function Header({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <header className="flex shrink-0 items-center gap-2.5 border-b border-line px-4 pb-3 pt-0.5">
      {onBack ? (
        <button
          onClick={onBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border-[1.5px] border-line bg-white text-ink shadow-[0_6px_16px_-10px_rgba(120,72,60,.3)] active:scale-95"
        >
          <ChevronLeft size={20} />
        </button>
      ) : (
        <div className="h-10 w-10 shrink-0" />
      )}
      <h1 className="flex-1 text-lg font-bold tracking-title text-ink">{title}</h1>
      <DemoBadge />
    </header>
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
      <div className="flex min-h-screen flex-col">
        <Header title="จองคิวปรึกษา" onBack={() => router.back()} />

        <div className="px-[22px]">
          <StepIndicator step1="active" step2="inactive" step3="inactive" />
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-[22px] pb-4">
          {/* Vet context card */}
          <div className="flex items-center gap-3 rounded-panel bg-white p-[15px] shadow-card">
            <Avatar name={vet.name} size={48} square className="rounded-[15px]" />
            <div className="min-w-0 flex-1">
              <span className="block text-[15.5px] font-bold text-ink">{vet.name}</span>
              <span className="mt-0.5 block text-[12.5px] text-ink-2">
                {vet.specialty} · ฿{vet.fee} / ครั้ง
              </span>
            </div>
            <span className="inline-flex shrink-0 items-center gap-[3px] self-start text-[12px] font-bold text-amber-deep">
              <Star size={12} fill="currentColor" stroke="none" />
              {vet.rating}
            </span>
          </div>

          {/* Day selector */}
          <div>
            <span className="mb-[11px] block px-0.5 text-[14px] font-bold text-ink">เลือกวันและเวลา</span>
            <div className="mb-3.5 flex gap-2">
              {[0, 1, 2].map((offset) => {
                const active = selectedDay === offset;
                return (
                  <button
                    key={offset}
                    onClick={() => { setSelectedDay(offset); setSelectedSlot(null); }}
                    className={
                      "flex flex-col items-center justify-center rounded-chip px-4 py-2 transition-transform active:scale-[.97] " +
                      (active
                        ? "bg-gradient-cta text-white shadow-cta"
                        : "border-[1.5px] border-line bg-white text-ink-2")
                    }
                  >
                    <span className={"text-[13.5px] font-bold " + (active ? "text-white" : "text-ink-2")}>
                      {thaiDayLabel(offset)}
                    </span>
                    <span className={"text-[11px] font-semibold " + (active ? "text-white/80" : "text-ink-3")}>
                      {thaiDateShort(dayDate(offset))}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Slot grid */}
            <div className="flex flex-wrap gap-[9px]">
              {slots.map((s) => {
                const isSelected = selectedSlot?.slotDate.getTime() === s.slotDate.getTime();
                if (s.taken) {
                  return (
                    <div
                      key={s.time}
                      className="flex items-center justify-center rounded-chip border-[1.5px] border-line bg-fill-1 px-[18px] py-2.5"
                    >
                      <span className="text-[14.5px] font-medium tabular-nums text-ink-3 line-through">
                        {s.time}
                      </span>
                    </div>
                  );
                }
                return (
                  <button
                    key={s.time}
                    onClick={() => setSelectedSlot(s)}
                    className={
                      "flex items-center justify-center rounded-chip border-[1.5px] px-[18px] py-2.5 tabular-nums transition-transform active:scale-[.96] " +
                      (isSelected
                        ? "border-teal bg-teal-soft text-[14.5px] font-bold text-teal-ink"
                        : "border-line bg-white text-[14.5px] font-semibold text-ink")
                    }
                  >
                    {s.time}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Fixed footer */}
        <div className="shrink-0 border-t border-line bg-white/85 px-[22px] pb-7 pt-3 backdrop-blur-md">
          <button
            disabled={!selectedSlot}
            onClick={() => setStep(2)}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-cta text-[17px] font-bold tracking-tight2 text-white shadow-cta transition-transform active:scale-[.98] disabled:bg-none disabled:bg-fill-3 disabled:text-ink-3 disabled:shadow-none disabled:active:scale-100"
          >
            ถัดไป — อาการเบื้องต้น
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // ── STEP 2 ──────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header title="อาการเบื้องต้น" onBack={() => setStep(1)} />

        <div className="px-[22px]">
          <StepIndicator step1="complete" step2="active" step3="inactive" />
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-[22px] pb-4">
          {/* Recap chip */}
          <div className="flex items-center gap-2 rounded-chip bg-fill-1 px-3 py-2.5">
            <Calendar size={14} className="text-ink-3" />
            <span className="text-[12.5px] font-semibold text-ink-2">{vet.name}</span>
            <span className="text-[12.5px] text-ink-3">·</span>
            <span className="text-[12.5px] text-ink-2">
              {selectedSlot && `${thaiDayLabel(selectedSlot.dayOffset)} ${selectedSlot.time} น.`}
            </span>
          </div>

          {/* Textarea */}
          <div className="flex flex-col gap-2">
            <div>
              <span className="block text-[14px] font-bold text-ink">เล่าอาการของน้องเบื้องต้น</span>
              <span className="mt-0.5 block text-[12px] leading-[1.5] text-ink-2">
                ช่วยให้สัตวแพทย์เตรียมตัวและใช้เวลาของคุณได้คุ้มค่าที่สุด
              </span>
            </div>
            <div className="flex flex-col justify-between rounded-chip border-[1.5px] border-line bg-white px-3.5 py-3.5" style={{ minHeight: 160 }}>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value.slice(0, 500))}
                placeholder="เล่าอาการของน้องสั้น ๆ เช่น ซึม ไม่กินอาหารมา 2 วัน"
                className="flex-1 resize-none bg-transparent text-[15px] leading-[1.55] text-ink outline-none placeholder:text-ink-3"
                style={{ minHeight: 100 }}
              />
              <span className="mt-2 self-end font-mono text-[10px] text-ink-3">{topic.length}/500</span>
            </div>

            {/* Suggestions */}
            <div className="rounded-chip bg-fill-1 px-3 py-2.5">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-2">
                ข้อมูลที่เป็นประโยชน์
              </span>
              <div className="flex flex-col gap-1.5">
                {["อาการเริ่มเมื่อไหร่ กินนานแค่ไหน?", "กินยาหรืออาหารใหม่ก่อนหน้า?", "น้ำหนัก อายุ เพศ (ทำหมันหรือยัง?)"].map((s) => (
                  <div key={s} className="flex items-start gap-1.5">
                    <span className="mt-0.5 shrink-0 text-[11px] text-ink-3">·</span>
                    <span className="text-[12px] leading-[1.5] text-ink-2">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed footer */}
        <div className="shrink-0 border-t border-line bg-white/85 px-[22px] pb-7 pt-3 backdrop-blur-md">
          <button
            disabled={!topic.trim() || loading}
            onClick={handleConfirm}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-cta text-[17px] font-bold tracking-tight2 text-white shadow-cta transition-transform active:scale-[.98] disabled:bg-none disabled:bg-fill-3 disabled:text-ink-3 disabled:shadow-none disabled:active:scale-100"
          >
            {loading ? "กำลังบันทึก..." : "ยืนยันการจอง"}
          </button>
        </div>
      </div>
    );
  }

  // ── STEP 3 (SUCCESS) ────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col">
      <Header title="จองสำเร็จ" />

      <div className="px-[22px]">
        <StepIndicator step1="complete" step2="complete" step3="active" />
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-[22px] pb-8">
        {/* Success hero */}
        <div className="flex animate-pop flex-col items-center gap-1.5 pb-6 pt-2 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-teal-soft text-teal-ink">
            <Check size={34} strokeWidth={2.6} />
          </div>
          <span className="mt-3.5 text-[21px] font-bold tracking-tight2 text-ink">จองคิวสำเร็จ</span>
          <p className="mt-1 max-w-[250px] text-[13.5px] leading-[1.5] text-ink-2">
            นี่คือการจองในระบบสาธิต — ไม่มีการเรียกเก็บเงินหรือนัดหมายจริง
          </p>
          <span className="mt-1.5 font-mono text-[11px] tracking-[0.06em] text-ink-3">#{bookingRef}</span>
        </div>

        {/* Booking detail card */}
        <div className="rounded-panel bg-white px-4 py-1.5 shadow-card">
          <div className="flex items-center justify-between border-b border-fill-1 py-3.5">
            <span className="text-[13px] font-medium text-ink-3">สัตวแพทย์</span>
            <span className="text-[14px] font-bold text-ink">{vet.name}</span>
          </div>
          <div className="flex items-center justify-between border-b border-fill-1 py-3.5">
            <span className="text-[13px] font-medium text-ink-3">วันและเวลา</span>
            <span className="text-right text-[14px] font-bold text-ink">
              {selectedSlot && `${thaiDateFull(selectedSlot.slotDate)} · ${selectedSlot.time} น.`}
            </span>
          </div>
          <div className="flex items-start justify-between border-b border-fill-1 py-3.5">
            <span className="shrink-0 text-[13px] font-medium text-ink-3">อาการ</span>
            <span className="ml-4 flex-1 text-right text-[13px] leading-[1.5] text-ink-2">
              {topic.length > 60 ? topic.slice(0, 60) + "…" : topic}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-fill-1 py-3.5">
            <span className="text-[13px] font-medium text-ink-3">ค่าปรึกษา (สาธิต)</span>
            <span className="text-[14px] font-bold text-ink">฿{vet.fee}</span>
          </div>
          <div className="flex items-center justify-between py-3.5">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-3">
              <Monitor size={14} /> ช่องทาง
            </span>
            <span className="text-[14px] font-semibold text-blue">Video Call</span>
          </div>
        </div>

        {/* Amber disclaimer */}
        <div className="mt-4 flex items-start gap-2 rounded-chip border border-amber/30 bg-amber-soft px-3 py-2.5">
          <AlertOctagon size={12} className="mt-px shrink-0 text-amber-deep" />
          <p className="text-[11px] leading-[1.6] text-amber-deep">
            ระบบสาธิต — ไม่มีการนัดหมายจริง สัตวแพทย์และเวลาทั้งหมดเป็นข้อมูลจำลอง
          </p>
        </div>

        {/* Primary CTA */}
        <a
          href="/app/care/vet-online/bookings"
          className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-cta text-[17px] font-bold tracking-tight2 text-white shadow-cta transition-transform active:scale-[.98]"
        >
          ดูการจองของฉัน
        </a>

        {/* Secondary */}
        <a
          href="/app/care/vet-online"
          className="mt-1.5 flex h-11 items-center justify-center text-[13px] font-semibold text-ink-2"
        >
          กลับหน้าหลัก
        </a>
      </div>
    </div>
  );
}
