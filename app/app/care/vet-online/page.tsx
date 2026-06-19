import Link from "next/link";
import { ChevronLeft, Star, AlertOctagon, ChevronRight, UserPlus } from "lucide-react";
import {
  MOCK_VETS,
  getNextAvailableSlots,
  thaiDayLabel,
} from "@/lib/data/mock-vets";

function AvatarPlaceholder({ size = 46 }: { size?: number }) {
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

export default function VetOnlinePage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center border-b border-black/5 bg-white px-1">
        <Link
          href="/app/care"
          className="flex h-11 w-11 shrink-0 items-center justify-center text-brown"
        >
          <ChevronLeft size={20} />
        </Link>
        <span className="flex-1 text-center text-base font-bold text-brown">
          สัตวแพทย์ออนไลน์
        </span>
        <div className="w-11" />
      </div>

      <div className="flex flex-col gap-3 px-5 pb-8 pt-3">
        <DemoBadge />

        {/* Intro card */}
        <div
          className="flex items-start gap-3 rounded-[14px] px-3.5 py-3"
          style={{ background: "#F5F3F0" }}
        >
          <div
            className="mt-0.5 flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px]"
            style={{ background: "rgba(90,143,212,0.14)" }}
          >
            <UserPlus size={16} style={{ color: "#5A8FD4" }} />
          </div>
          <p className="flex-1 text-[13px] leading-[1.7] text-brown">
            ปรึกษาอาการเบื้องต้นกับสัตวแพทย์ เพื่อประเมินว่าควรไป รพ. ด่วนแค่ไหน —{" "}
            <span className="font-medium" style={{ color: "#8A8580" }}>
              ไม่ใช่การวินิจฉัยหรือสั่งยา
            </span>
          </p>
        </div>

        {/* Emergency disclaimer */}
        <div
          className="flex items-center gap-2.5 rounded-[12px] border-[1.5px] px-3 py-2.5"
          style={{
            background: "rgba(155,34,34,0.06)",
            borderColor: "rgba(155,34,34,0.20)",
          }}
        >
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px]"
            style={{ background: "rgba(155,34,34,0.12)" }}
          >
            <AlertOctagon size={13} style={{ color: "#8B1A1A" }} />
          </div>
          <span
            className="flex-1 text-[12px] font-medium leading-[1.5]"
            style={{ color: "#8B1A1A" }}
          >
            หากฉุกเฉิน โทรหรือพาน้องไป รพ.สัตว์ทันที
          </span>
          <Link
            href="/app/care/hospitals"
            className="flex shrink-0 items-center gap-0.5"
          >
            <span className="text-[12px] font-bold" style={{ color: "#8B1A1A" }}>
              ดู รพ.
            </span>
            <ChevronRight size={12} style={{ color: "#8B1A1A" }} />
          </Link>
        </div>

        {/* Vet list */}
        <div className="flex flex-col gap-2.5 pb-5">
          {MOCK_VETS.map((vet) => {
            const slots = getNextAvailableSlots(vet.id, 2);
            return (
              <div
                key={vet.id}
                className="flex flex-col gap-2.5 rounded-[16px] border-[1.5px] border-[#EDEAE6] bg-white p-3.5"
              >
                {/* Top row */}
                <div className="flex items-start gap-3">
                  <AvatarPlaceholder size={46} />
                  <div className="min-w-0 flex-1">
                    <span className="block text-[13px] font-bold text-brown">
                      {vet.name}
                    </span>
                    <span className="mb-1.5 block text-[11px]" style={{ color: "#8A8580" }}>
                      {vet.specialty}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Star size={11} fill="#F59E0B" stroke="none" />
                      <span className="text-[11px] font-semibold" style={{ color: "#5A5650" }}>
                        {vet.rating}
                      </span>
                      <span className="text-[11px]" style={{ color: "#D5D1CC" }}>·</span>
                      <span className="text-[12px] font-bold text-brown">฿{vet.fee}</span>
                      <span className="text-[11px]" style={{ color: "#8A8580" }}>/ครั้ง</span>
                    </div>
                  </div>
                </div>

                {/* Slot chips + button */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="shrink-0 text-[11px]" style={{ color: "#8A8580" }}>
                    ว่าง:
                  </span>
                  {slots.map((s) => (
                    <div
                      key={s.slotDate.toISOString()}
                      className="flex h-6 shrink-0 items-center rounded-[12px] px-2.5"
                      style={
                        s.dayOffset === 0
                          ? { background: "rgba(26,138,106,0.10)" }
                          : { background: "#F5F3F0" }
                      }
                    >
                      <span
                        className="text-[11px] font-semibold whitespace-nowrap"
                        style={{ color: s.dayOffset === 0 ? "#1A8A6A" : "#5A5650" }}
                      >
                        {thaiDayLabel(s.dayOffset)} {s.time}
                      </span>
                    </div>
                  ))}
                  {slots.length === 0 && (
                    <span className="text-[11px]" style={{ color: "#B5B0AA" }}>
                      ไม่มีช่องว่าง
                    </span>
                  )}
                  <div className="flex-1" />
                  <Link
                    href={`/app/care/vet-online/book/${vet.id}`}
                    className="flex h-[30px] shrink-0 items-center rounded-[10px] px-3"
                    style={{
                      background: "#FF6B5B",
                      boxShadow: "0 2px 8px rgba(255,107,91,0.24)",
                    }}
                  >
                    <span className="text-[12px] font-semibold text-white">นัดหมาย</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
