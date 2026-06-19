"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, AlertOctagon, Calendar, Check, LogIn, VideoOff, Video } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MOCK_VETS, thaiDateFull } from "@/lib/data/mock-vets";
import type { MockVet } from "@/lib/data/mock-vets";

type Booking = {
  id: string;
  vet_id: string;
  slot_time: string;
  topic: string;
  status: "upcoming" | "cancelled";
  created_at: string;
};

type BookingWithVet = Booking & { vet: MockVet | undefined };

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

function StatusBadge({ label, color }: { label: string; color: "teal" | "grey" }) {
  const styles =
    color === "teal"
      ? { background: "rgba(26,138,106,0.11)", borderColor: "rgba(26,138,106,0.22)", color: "#1A8A6A" }
      : { background: "rgba(175,165,155,0.14)", borderColor: "rgba(175,165,155,0.30)", color: "#8A8580" };
  return (
    <div
      className="shrink-0 rounded-full border px-2 py-[3px] text-[10px] font-bold whitespace-nowrap"
      style={styles}
    >
      {label}
    </div>
  );
}

// ── WAITING ROOM ────────────────────────────────────────────────
function WaitingRoom({ booking, onBack }: { booking: BookingWithVet; onBack: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    const target = new Date(booking.slot_time).getTime();
    const update = () => {
      const diff = Math.max(0, Math.floor((target - Date.now()) / 1000));
      setSecondsLeft(diff);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [booking.slot_time]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex h-14 shrink-0 items-center border-b border-black/5 px-1">
        <button onClick={onBack} className="flex h-11 w-11 items-center justify-center text-brown">
          <ChevronLeft size={20} />
        </button>
        <span className="flex-1 text-center text-base font-bold text-brown">ห้องรอ</span>
        <div className="w-11" />
      </div>

      <div className="flex flex-col gap-3 px-5 pt-3 pb-8">
        <DemoBadge />

        {/* Vet card */}
        <div className="flex items-center gap-3 rounded-[18px] border-[1.5px] border-[#EDEAE6] p-3.5">
          <AvatarPlaceholder size={56} />
          <div className="min-w-0 flex-1">
            <span className="mb-0.5 block text-[14px] font-bold text-brown">
              {booking.vet?.name ?? booking.vet_id}
            </span>
            <span className="mb-1.5 block text-[12px]" style={{ color: "#8A8580" }}>
              {booking.vet?.specialty}
            </span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="h-[7px] w-[7px] rounded-full" style={{ background: "#B5B0AA" }} />
                <span className="text-[10px]" style={{ color: "#8A8580" }}>กำลังรอ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Appointment info */}
        <div className="flex items-center gap-2 rounded-[13px] px-3.5 py-2.5" style={{ background: "#F5F3F0" }}>
          <Calendar size={14} style={{ color: "#B5B0AA", flexShrink: 0 }} />
          <span className="flex-1 text-[12px]" style={{ color: "#5A5650" }}>
            {thaiDateFull(new Date(booking.slot_time))}
          </span>
          <span className="text-[13px] font-bold text-brown">
            {new Date(booking.slot_time).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
          </span>
        </div>

        {/* Countdown */}
        <div
          className="flex flex-col items-center gap-2.5 rounded-[16px] pb-3.5 pt-4"
          style={{ background: "#F5F3F0" }}
        >
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: "#8A8580" }}>
            เข้าพบแพทย์ใน
          </span>
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-[64px] w-[78px] flex-col items-center justify-center gap-0.5 rounded-[14px] border-[1.5px] border-[#EDEAE6] bg-white"
            >
              <span className="text-[32px] font-bold leading-none text-brown">{mm}</span>
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.06em]" style={{ color: "#B5B0AA" }}>นาที</span>
            </div>
            <span className="mb-2.5 text-[28px] font-bold leading-none" style={{ color: "#C5C1BC" }}>:</span>
            <div
              className="flex h-[64px] w-[78px] flex-col items-center justify-center gap-0.5 rounded-[14px] border-[1.5px] border-[#EDEAE6] bg-white"
            >
              <span className="text-[32px] font-bold leading-none text-brown">{ss}</span>
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.06em]" style={{ color: "#B5B0AA" }}>วินาที</span>
            </div>
          </div>
          <span className="text-center text-[11px] leading-[1.5]" style={{ color: "#B5B0AA" }}>
            ห้องจะเปิดอัตโนมัติเมื่อถึงเวลานัด
          </span>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-2.5">
          <div className="h-px flex-1" style={{ background: "#EDEAE6" }} />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] whitespace-nowrap" style={{ color: "#B5B0AA" }}>
            ช่องทางการปรึกษา
          </span>
          <div className="h-px flex-1" style={{ background: "#EDEAE6" }} />
        </div>

        {/* Disabled video frame */}
        <div
          className="overflow-hidden rounded-[18px] border-2"
          style={{
            borderColor: "#D5D1CC",
            borderStyle: "dashed",
            background:
              "repeating-linear-gradient(135deg,#F5F3F0 0px,#F5F3F0 6px,#EAE7E3 6px,#EAE7E3 12px)",
          }}
        >
          <div className="flex flex-col items-center gap-3 px-6 py-6 text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full border-[1.5px]"
              style={{ background: "rgba(200,196,190,0.38)", borderColor: "#D5D1CC" }}
            >
              <VideoOff size={26} style={{ color: "#B5B0AA" }} strokeWidth={1.8} />
            </div>

            <div
              className="flex items-center gap-1 rounded-full border px-2.5 py-[3px]"
              style={{
                background: "rgba(168,112,24,0.18)",
                borderColor: "rgba(168,112,24,0.38)",
              }}
            >
              <AlertOctagon size={9} style={{ color: "#A06820" }} />
              <span className="text-[10px] font-bold" style={{ color: "#7A5818" }}>ระบบสาธิต</span>
            </div>

            <p className="max-w-[260px] text-[12px] leading-[1.7]" style={{ color: "#6A6560" }}>
              ฟีเจอร์วิดีโอคอลจะเปิดใช้งานเมื่อเชื่อมต่อกับพาร์ทเนอร์สัตวแพทย์
            </p>

            <button
              disabled
              className="flex h-[46px] w-full cursor-not-allowed items-center justify-center gap-2 rounded-[14px] opacity-60"
              style={{ background: "#D5D1CC" }}
            >
              <Video size={15} style={{ color: "#8A8580" }} />
              <span className="text-[13px] font-semibold" style={{ color: "#8A8580" }}>เริ่มวิดีโอคอล</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ───────────────────────────────────────────────────
export default function VetBookingsPage() {
  const supabase = createClient();
  const [bookings, setBookings] = useState<BookingWithVet[]>([]);
  const [loading, setLoading] = useState(true);
  const [waitingBooking, setWaitingBooking] = useState<BookingWithVet | null>(null);
  const [cancelToast, setCancelToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("vet_bookings")
      .select("*")
      .eq("user_id", user.id)
      .order("slot_time", { ascending: false });

    const enriched: BookingWithVet[] = (data ?? []).map((b: Booking) => ({
      ...b,
      vet: MOCK_VETS.find((v) => v.id === b.vet_id),
    }));

    setBookings(enriched);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function handleCancel(bookingId: string) {
    await supabase
      .from("vet_bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);

    const b = bookings.find((b) => b.id === bookingId);
    if (b) setCancelToast(bookingId);

    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b))
    );

    setTimeout(() => setCancelToast(null), 4000);
  }

  if (waitingBooking) {
    return (
      <WaitingRoom
        booking={waitingBooking}
        onBack={() => setWaitingBooking(null)}
      />
    );
  }

  const now = new Date();
  const upcoming = bookings.filter((b) => new Date(b.slot_time) >= now);
  const past = bookings.filter((b) => new Date(b.slot_time) < now);

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <div className="flex h-14 shrink-0 items-center border-b border-black/5 bg-white px-1">
        <Link href="/app/care/vet-online" className="flex h-11 w-11 items-center justify-center text-brown">
          <ChevronLeft size={20} />
        </Link>
        <span className="flex-1 text-center text-base font-bold text-brown">การจองของฉัน</span>
        <div className="w-11" />
      </div>

      {/* Cancellation toast */}
      {cancelToast && (
        <div
          className="mx-5 mt-3 flex items-center gap-2 rounded-[12px] border px-3 py-2.5"
          style={{
            background: "rgba(26,138,106,0.08)",
            borderColor: "rgba(26,138,106,0.22)",
          }}
        >
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
            style={{ background: "rgba(26,138,106,0.14)" }}
          >
            <Check size={11} style={{ color: "#1A8A6A" }} strokeWidth={3} />
          </div>
          <span className="flex-1 text-[12px] font-semibold" style={{ color: "#146A52" }}>
            ยกเลิกนัดหมายสำเร็จแล้ว
          </span>
          <span className="shrink-0 font-mono text-[10px]" style={{ color: "#8A8580" }}>
            #DEMO
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2 px-5 pb-8 pt-4">
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-20">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-coral border-t-transparent" />
          </div>
        ) : bookings.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center gap-3 px-8 py-16 text-center">
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[22px]" style={{ background: "#F5F3F0" }}>
              <Calendar size={32} style={{ color: "#C5C1BC" }} strokeWidth={1.8} />
            </div>
            <span className="text-[18px] font-bold text-brown">ยังไม่มีการจอง</span>
            <p className="max-w-[240px] text-[13px] leading-[1.65]" style={{ color: "#8A8580" }}>
              ปรึกษาสัตวแพทย์ออนไลน์ได้เดี๋ยวนี้ เลือกสัตวแพทย์และเวลาที่สะดวก
            </p>
            <Link
              href="/app/care/vet-online"
              className="mt-2 flex h-[52px] w-full max-w-[280px] items-center justify-center gap-2 rounded-[16px] text-[15px] font-bold text-white"
              style={{ background: "#FF6B5B", boxShadow: "0 4px 14px rgba(255,107,91,0.28)" }}
            >
              <LogIn size={16} />
              นัดหมายสัตวแพทย์
            </Link>
            <Link href="/app/care/vet-online" className="mt-1 text-[12px] font-semibold" style={{ color: "#B5B0AA" }}>
              ← กลับหน้าหลัก
            </Link>
          </div>
        ) : (
          <>
            {/* Upcoming */}
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.09em]" style={{ color: "#8A8580" }}>
              การจองที่กำลังจะมาถึง
            </span>

            {upcoming.length === 0 ? (
              <p className="text-[13px]" style={{ color: "#B5B0AA" }}>ไม่มีการจองที่กำลังจะมาถึง</p>
            ) : (
              upcoming.map((b) => {
                const isCancelled = b.status === "cancelled";
                return (
                  <div
                    key={b.id}
                    className="overflow-hidden rounded-[18px] border-[1.5px] border-[#EDEAE6] bg-white"
                    style={{ opacity: isCancelled ? 0.6 : 1 }}
                  >
                    <div className="flex flex-col gap-2.5 px-3.5 pt-3 pb-3">
                      {/* Vet row */}
                      <div className="flex items-start gap-3">
                        <AvatarPlaceholder size={46} />
                        <div className="min-w-0 flex-1">
                          <span
                            className="mb-0.5 block text-[13px] font-bold text-brown"
                            style={isCancelled ? { textDecoration: "line-through", textDecorationColor: "#C5C1BC" } : {}}
                          >
                            {b.vet?.name ?? b.vet_id}
                          </span>
                          <span className="mb-1.5 block text-[11px]" style={{ color: "#8A8580" }}>
                            {b.vet?.specialty}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} style={{ color: "#B5B0AA" }} />
                            <span className="text-[12px]" style={{ color: "#5A5650" }}>
                              {thaiDateFull(new Date(b.slot_time))}
                            </span>
                            <span className="text-[12px] font-bold text-brown">
                              {new Date(b.slot_time).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
                            </span>
                          </div>
                        </div>
                        <StatusBadge
                          label={isCancelled ? "ยกเลิกแล้ว" : "กำลังจะถึง"}
                          color={isCancelled ? "grey" : "teal"}
                        />
                      </div>

                      {/* Action row */}
                      {!isCancelled && (
                        <>
                          <div className="h-px -mx-3.5" style={{ background: "#F5F3F0" }} />
                          <div className="flex gap-2">
                            <button
                              onClick={() => setWaitingBooking(b)}
                              className="flex flex-1 h-9 items-center justify-center gap-1.5 rounded-[11px] text-[13px] font-bold text-white"
                              style={{ background: "#FF6B5B", boxShadow: "0 2px 8px rgba(255,107,91,0.24)" }}
                            >
                              <LogIn size={13} />
                              เข้าห้องรอ
                            </button>
                            <button
                              onClick={() => handleCancel(b.id)}
                              className="flex h-9 items-center rounded-[11px] border-[1.5px] border-[#EDEAE6] px-3.5 text-[12px] font-semibold"
                              style={{ color: "#8A8580" }}
                            >
                              ยกเลิก
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Past */}
            {past.length > 0 && (
              <>
                <span className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.09em]" style={{ color: "#8A8580" }}>
                  ที่ผ่านมา
                </span>
                {past.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 rounded-[16px] border-[1.5px] border-[#EDEAE6] bg-white px-3 py-3"
                  >
                    <AvatarPlaceholder size={40} />
                    <div className="min-w-0 flex-1">
                      <span className="block text-[13px] font-bold text-brown">{b.vet?.name ?? b.vet_id}</span>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <Calendar size={11} style={{ color: "#C5C1BC" }} />
                        <span className="text-[11px]" style={{ color: "#8A8580" }}>
                          {thaiDateFull(new Date(b.slot_time))} · {new Date(b.slot_time).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
                        </span>
                      </div>
                    </div>
                    <StatusBadge
                      label={b.status === "cancelled" ? "ยกเลิกแล้ว" : "เสร็จสิ้น"}
                      color="grey"
                    />
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
