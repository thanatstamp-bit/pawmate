"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, AlertOctagon, Calendar, Check, LogIn, VideoOff, Video } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MOCK_VETS, thaiDateFull } from "@/lib/data/mock-vets";
import type { MockVet } from "@/lib/data/mock-vets";
import { Avatar } from "@/components/ui";

type Booking = {
  id: string;
  vet_id: string;
  slot_time: string;
  topic: string;
  status: "upcoming" | "cancelled";
  created_at: string;
};

type BookingWithVet = Booking & { vet: MockVet | undefined };

function DemoBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-[9px] bg-amber-soft px-2.5 py-[5px] text-[11.5px] font-bold text-amber-deep">
      <AlertOctagon size={11} />
      ระบบสาธิต (Demo)
    </span>
  );
}

function Header({ title, onBack, href }: { title: string; onBack?: () => void; href?: string }) {
  const back =
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border-[1.5px] border-line bg-white text-ink shadow-[0_6px_16px_-10px_rgba(120,72,60,.3)] active:scale-95";
  return (
    <header className="flex shrink-0 items-center gap-2.5 border-b border-line px-4 pb-3 pt-0.5">
      {href ? (
        <Link href={href} className={back}>
          <ChevronLeft size={20} />
        </Link>
      ) : (
        <button onClick={onBack} className={back}>
          <ChevronLeft size={20} />
        </button>
      )}
      <h1 className="flex-1 text-lg font-bold tracking-title text-ink">{title}</h1>
      <DemoBadge />
    </header>
  );
}

function StatusBadge({ label, color }: { label: string; color: "amber" | "grey" }) {
  const tone =
    color === "amber" ? "bg-amber-soft text-amber-deep" : "bg-fill-2 text-ink-2";
  return (
    <span className={"shrink-0 self-start whitespace-nowrap rounded-[9px] px-2.5 py-[5px] text-[11.5px] font-bold " + tone}>
      {label}
    </span>
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
    <div className="flex min-h-screen flex-col">
      <Header title="ห้องรอปรึกษา" onBack={onBack} />

      <div className="flex flex-col gap-[18px] px-[22px] pb-8 pt-[18px]">
        {/* Vet card */}
        <div className="flex items-center gap-3 rounded-panel bg-white p-[15px] shadow-card">
          <Avatar name={booking.vet?.name ?? booking.vet_id} size={52} square className="rounded-[16px]" />
          <div className="min-w-0 flex-1">
            <span className="block text-[16px] font-bold text-ink">
              {booking.vet?.name ?? booking.vet_id}
            </span>
            <span className="mt-px block text-[12.5px] text-ink-2">
              {thaiDateFull(new Date(booking.slot_time))} ·{" "}
              {new Date(booking.slot_time).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
            </span>
          </div>
        </div>

        {/* Countdown */}
        <div className="rounded-panel bg-amber-soft p-[18px] text-center">
          <div className="text-[12.5px] font-semibold text-amber-deep">สัตวแพทย์จะเริ่มปรึกษาในอีก</div>
          <div className="mt-1 text-[38px] font-bold leading-[1.1] tracking-[0.01em] tabular-nums text-ink">
            {mm}:{ss}
          </div>
        </div>

        {/* Disabled video frame (deliberately dark + demo) */}
        <div
          className="relative flex h-[240px] flex-col items-center justify-center overflow-hidden rounded-card px-6 text-center"
          style={{ background: "linear-gradient(160deg,#3a352f,#221f1b)" }}
        >
          <span className="absolute left-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-lg bg-amber-soft px-2.5 py-1 text-[11px] font-bold text-amber-deep">
            <AlertOctagon size={11} />
            ระบบสาธิต
          </span>
          <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-white/10 text-white/85">
            <VideoOff size={28} strokeWidth={1.8} />
          </div>
          <div className="mt-4 text-[15px] font-bold text-white">วิดีโอคอล (ปิดใช้งานในเดโม)</div>
          <p className="mt-2 max-w-[280px] text-[12.5px] leading-[1.55] text-white/70">
            ฟีเจอร์วิดีโอคอลจะเปิดใช้งานเมื่อเชื่อมต่อกับพาร์ทเนอร์สัตวแพทย์
          </p>
          <button
            disabled
            className="mt-4 flex h-[44px] w-full max-w-[260px] cursor-not-allowed items-center justify-center gap-2 rounded-chip bg-white/10 text-white/50"
          >
            <Video size={15} />
            <span className="text-[13px] font-semibold">เริ่มวิดีโอคอล</span>
          </button>
        </div>

        {/* Leave */}
        <button
          onClick={onBack}
          className="flex h-[50px] items-center justify-center rounded-[15px] border-[1.5px] border-line bg-white text-[15px] font-bold text-ink-2 transition-transform active:scale-[.98]"
        >
          ออกจากห้องรอ
        </button>
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
    <div className="flex min-h-screen flex-col">
      <Header title="การจองของฉัน" href="/app/care/vet-online" />

      {/* Cancellation toast */}
      {cancelToast && (
        <div className="mx-[22px] mt-3 flex items-center gap-2 rounded-chip border border-teal/30 bg-teal-soft px-3 py-2.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal/15 text-teal-ink">
            <Check size={12} strokeWidth={3} />
          </div>
          <span className="flex-1 text-[12px] font-semibold text-teal-ink">ยกเลิกนัดหมายสำเร็จแล้ว</span>
          <span className="shrink-0 font-mono text-[10px] text-ink-3">#DEMO</span>
        </div>
      )}

      <div className="flex flex-col gap-3 px-[22px] pb-8 pt-4">
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-20">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-coral border-t-transparent" />
          </div>
        ) : bookings.length === 0 ? (
          /* Empty state */
          <div className="flex animate-fade-up flex-col items-center px-8 pb-0 pt-[70px] text-center">
            <div className="flex h-[84px] w-[84px] items-center justify-center rounded-[26px] bg-fill-2 text-ink-3">
              <Calendar size={36} strokeWidth={1.8} />
            </div>
            <span className="mt-5 text-[18px] font-bold text-ink">ยังไม่มีการจอง</span>
            <p className="mt-[7px] max-w-[230px] text-[14px] leading-[1.5] text-ink-2">
              เลือกสัตวแพทย์เพื่อเริ่มปรึกษาอาการน้องในระบบสาธิต
            </p>
            <Link
              href="/app/care/vet-online"
              className="mt-[22px] flex h-[50px] items-center gap-2 rounded-[15px] bg-gradient-cta px-6 text-[15.5px] font-bold tracking-tight2 text-white shadow-cta transition-transform active:scale-[.96]"
            >
              <LogIn size={16} />
              เลือกสัตวแพทย์
            </Link>
          </div>
        ) : (
          <>
            {/* Upcoming */}
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.09em] text-ink-2">
              การจองที่กำลังจะมาถึง
            </span>

            {upcoming.length === 0 ? (
              <p className="text-[13px] text-ink-3">ไม่มีการจองที่กำลังจะมาถึง</p>
            ) : (
              upcoming.map((b) => {
                const isCancelled = b.status === "cancelled";
                return (
                  <div
                    key={b.id}
                    className="rounded-panel bg-white p-[15px] shadow-card"
                    style={{ opacity: isCancelled ? 0.6 : 1 }}
                  >
                    {/* Vet row */}
                    <div className="flex gap-3">
                      <Avatar name={b.vet?.name ?? b.vet_id} size={46} square className="rounded-[14px]" />
                      <div className="min-w-0 flex-1">
                        <span
                          className="block text-[15px] font-bold text-ink"
                          style={isCancelled ? { textDecoration: "line-through", textDecorationColor: "#A39D95" } : {}}
                        >
                          {b.vet?.name ?? b.vet_id}
                        </span>
                        <div className="mt-[3px] flex items-center gap-1.5">
                          <Calendar size={13} className="text-ink-3" />
                          <span className="text-[13px] font-semibold text-ink-2">
                            {thaiDateFull(new Date(b.slot_time))} ·{" "}
                            {new Date(b.slot_time).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
                          </span>
                        </div>
                      </div>
                      <StatusBadge
                        label={isCancelled ? "ยกเลิกแล้ว" : "รอเริ่มปรึกษา"}
                        color={isCancelled ? "grey" : "amber"}
                      />
                    </div>

                    {/* Action row */}
                    {!isCancelled && (
                      <div className="mt-[13px] flex gap-[9px]">
                        <button
                          onClick={() => setWaitingBooking(b)}
                          className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-chip bg-teal-soft text-[14px] font-bold text-teal-ink transition-transform active:scale-[.97]"
                        >
                          <LogIn size={15} />
                          เข้าห้องรอ
                        </button>
                        <button
                          onClick={() => handleCancel(b.id)}
                          className="flex h-11 items-center rounded-chip bg-fill-2 px-[18px] text-[14px] font-bold text-ink-2 transition-transform active:scale-[.97]"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Past */}
            {past.length > 0 && (
              <>
                <span className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.09em] text-ink-2">
                  ที่ผ่านมา
                </span>
                {past.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 rounded-panel border-[1.5px] border-line bg-white px-3.5 py-3"
                  >
                    <Avatar name={b.vet?.name ?? b.vet_id} size={40} square className="rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <span className="block text-[13px] font-bold text-ink">{b.vet?.name ?? b.vet_id}</span>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <Calendar size={11} className="text-ink-3" />
                        <span className="text-[11px] text-ink-2">
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
