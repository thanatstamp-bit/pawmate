import Link from "next/link";
import { ChevronLeft, Star, AlertOctagon, ChevronRight, Stethoscope, CalendarDays } from "lucide-react";
import {
  MOCK_VETS,
  getNextAvailableSlots,
  thaiDayLabel,
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

export default function VetOnlinePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-2.5 border-b border-line px-4 pb-3 pt-0.5">
        <Link
          href="/app/care"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border-[1.5px] border-line bg-white text-ink shadow-[0_6px_16px_-10px_rgba(120,72,60,.3)] active:scale-95"
        >
          <ChevronLeft size={20} />
        </Link>
        <h1 className="flex-1 text-lg font-bold tracking-title text-ink">ปรึกษาสัตวแพทย์</h1>
        <DemoBadge />
      </header>

      <div className="flex flex-col px-[22px] pb-8 pt-4">
        {/* Intro card */}
        <div className="mb-4 flex gap-3 rounded-panel bg-blue-soft p-[15px]">
          <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-chip bg-white text-blue">
            <Stethoscope size={20} />
          </div>
          <p className="flex-1 self-center text-[14.5px] font-bold leading-[1.4] text-ink">
            ปรึกษาอาการเบื้องต้นกับสัตวแพทย์ออนไลน์ ก่อนตัดสินใจพาน้องไปโรงพยาบาล
          </p>
        </div>

        {/* Emergency disclaimer → hospitals */}
        <Link
          href="/app/care/hospitals"
          className="mb-4 flex items-center gap-3 rounded-chip border border-rose/30 bg-rose-soft px-[15px] py-[13px] active:scale-[.99]"
        >
          <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-rose/15 text-rose-ink">
            <AlertOctagon size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-bold leading-[1.35] text-rose-ink">
              หากฉุกเฉิน โทรหรือพาน้องไป รพ.สัตว์ทันที
            </p>
            <p className="mt-px text-[12px] text-rose-ink/80">ดูโรงพยาบาลใกล้คุณ</p>
          </div>
          <ChevronRight size={18} className="shrink-0 text-rose-ink/70" />
        </Link>

        {/* My bookings shortcut */}
        <Link
          href="/app/care/vet-online/bookings"
          className="mb-5 flex items-center gap-3 rounded-chip border-[1.5px] border-line bg-white px-[15px] py-[13px] active:scale-[.99]"
        >
          <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-teal-soft text-teal-ink">
            <CalendarDays size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-bold text-ink">การจองของฉัน</p>
            <p className="mt-px text-[12px] text-ink-2">ดูนัดหมายและห้องรอ</p>
          </div>
          <ChevronRight size={18} className="shrink-0 text-ink-3" />
        </Link>

        <h2 className="mb-[13px] px-0.5 text-[15px] font-bold tracking-tight2 text-ink">เลือกสัตวแพทย์</h2>

        {/* Vet list */}
        <div className="flex flex-col gap-3">
          {MOCK_VETS.map((vet) => {
            const slots = getNextAvailableSlots(vet.id, 1);
            const next = slots[0];
            return (
              <Link
                key={vet.id}
                href={`/app/care/vet-online/book/${vet.id}`}
                className="rounded-panel bg-white p-[15px] shadow-card transition-transform active:scale-[.985]"
              >
                <div className="flex gap-3">
                  <Avatar name={vet.name} size={50} square className="rounded-chip" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-[7px]">
                      <span className="text-[15.5px] font-bold text-ink">{vet.name}</span>
                      <span className="inline-flex shrink-0 items-center gap-[3px] text-[12px] font-bold text-amber-deep">
                        <Star size={12} fill="currentColor" stroke="none" />
                        {vet.rating}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12.5px] text-ink-2">{vet.specialty}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-ink">
                        ฿{vet.fee} <span className="font-medium text-ink-3">/ ครั้ง</span>
                      </span>
                      {next && (
                        <>
                          <span className="h-[3px] w-[3px] rounded-full bg-fill-3" />
                          <span className="text-[12px] font-semibold text-teal-ink">
                            ว่าง {thaiDayLabel(next.dayOffset)} {next.time}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={18} className="shrink-0 self-center text-ink-3" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
