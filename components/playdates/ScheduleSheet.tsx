"use client";

import { useEffect, useRef, useState } from "react";
import {
  X, Coffee, Waves, Trees, Hotel, MapPin, ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Spot = {
  id: string;
  name: string;
  type: "park" | "cafe" | "beach" | "resort" | "other";
  province: string;
  district: string | null;
  description: string | null;
};

interface Props {
  matchId: string;
  myPetId: string;
  province: string;        // other pet's province — used to suggest spots
  onClose: () => void;
  onSuccess: () => void;   // called after proposal is created
}

// Next 14 days for the date strip
function buildDates(): Date[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

// 30-minute slots from 08:00 to 20:00
const TIME_OPTIONS: string[] = [];
for (let h = 8; h <= 20; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 20) TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:30`);
}

const SHORT_DAY  = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const SHORT_MONTH = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

const SPOT_TYPE_OPTS = [
  { value: "all",   label: "ทั้งหมด" },
  { value: "park",  label: "สวน" },
  { value: "cafe",  label: "คาเฟ่" },
  { value: "beach", label: "ชายหาด" },
];

function spotIcon(type: string) {
  if (type === "park")   return <Trees  size={16} className="shrink-0 text-teal" />;
  if (type === "cafe")   return <Coffee size={16} className="shrink-0 text-amber-dark" />;
  if (type === "beach")  return <Waves  size={16} className="shrink-0 text-teal" />;
  if (type === "resort") return <Hotel  size={16} className="shrink-0 text-brown-muted" />;
  return                        <MapPin size={16} className="shrink-0 text-brown-muted" />;
}

const DATES = buildDates();

export default function ScheduleSheet({ matchId, myPetId, province, onClose, onSuccess }: Props) {
  const supabase = createClient();

  const [selectedDate, setSelectedDate] = useState<Date>(DATES[0]);
  const [selectedTime, setSelectedTime] = useState("10:00");
  const [spotFilter,   setSpotFilter]   = useState("all");
  const [spots,        setSpots]        = useState<Spot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [customLoc,    setCustomLoc]    = useState("");
  const [note,         setNote]         = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const dateScrollRef = useRef<HTMLDivElement>(null);

  // Fetch spots for the given province (or all when province has no spots)
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("playdate_spots")
        .select("id, name, type, province, district, description")
        .eq("province", province)
        .order("type")
        .limit(20);
      setSpots(data ?? []);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [province]);

  const filteredSpots = spotFilter === "all"
    ? spots
    : spots.filter((s) => s.type === spotFilter);

  const location = selectedSpot ? selectedSpot.name
    : customLoc.trim() ? customLoc.trim()
    : null;

  async function handleSubmit() {
    if (!location) { setError("กรุณาเลือกหรือระบุสถานที่ก่อนนะ"); return; }
    setSubmitting(true);
    setError(null);

    // Combine date + time into a UTC timestamp
    const [h, m] = selectedTime.split(":").map(Number);
    const dt = new Date(
      selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(),
      h, m, 0
    );

    // Cancel any existing pending proposal for this match
    await supabase
      .from("playdate_proposals")
      .update({ status: "cancelled" })
      .eq("match_id", matchId)
      .eq("status", "pending");

    // Insert new proposal
    const { error: insertErr } = await supabase
      .from("playdate_proposals")
      .insert({
        match_id:         matchId,
        proposer_pet_id:  myPetId,
        proposed_at:      dt.toISOString(),
        spot_id:          selectedSpot?.id ?? null,
        custom_location:  selectedSpot ? null : customLoc.trim() || null,
        note:             note.trim() || null,
        status:           "pending",
      });

    if (insertErr) {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
      setSubmitting(false);
      return;
    }

    // Send a chat message so the other side sees a preview in the match list
    const dayLabel = `${SHORT_DAY[dt.getDay()]} ${dt.getDate()} ${SHORT_MONTH[dt.getMonth()]}`;
    const timeLabel = selectedTime;
    await supabase.from("messages").insert({
      match_id:       matchId,
      sender_pet_id:  myPetId,
      content:        `📅 ขอนัดหมาย: ${dayLabel} เวลา ${timeLabel} น. ที่ ${location}`,
    });

    onSuccess();
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black/50">
      <div className="flex-1" onClick={onClose} />

      <div
        className="mx-auto flex w-full max-w-[480px] flex-col rounded-t-[28px] bg-white"
        style={{ maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/5 px-6 pb-4 pt-6">
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-cream">
            <X size={20} />
          </button>
          <h2 className="text-base font-bold text-brown">นัดหมาย</h2>
          <div className="w-8" />
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-6">

            {/* ── Date strip ── */}
            <div>
              <p className="mb-3 text-sm font-bold text-brown">เลือกวัน</p>
              <div ref={dateScrollRef} className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {DATES.map((d, i) => {
                  const active = d.toDateString() === selectedDate.toDateString();
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedDate(d)}
                      className={`flex shrink-0 flex-col items-center rounded-2xl px-3 py-2.5 transition-all ${
                        active
                          ? "bg-coral text-white"
                          : "bg-cream text-brown hover:bg-coral/10"
                      }`}
                    >
                      <span className="text-[10px] font-bold">{SHORT_DAY[d.getDay()]}</span>
                      <span className="mt-0.5 text-lg font-bold leading-none">{d.getDate()}</span>
                      <span className="mt-0.5 text-[10px]">{SHORT_MONTH[d.getMonth()]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Time ── */}
            <div>
              <p className="mb-2 text-sm font-bold text-brown">เวลา</p>
              <div className="relative">
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-black/10 bg-white px-4 py-3 text-sm focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t} น.</option>
                  ))}
                </select>
                <ChevronRight
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-brown-muted"
                />
              </div>
            </div>

            {/* ── Spot picker ── */}
            <div>
              <p className="mb-2 text-sm font-bold text-brown">
                สถานที่แนะนำใน{province}
              </p>

              {/* Type filter pills */}
              <div className="mb-3 flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
                {SPOT_TYPE_OPTS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSpotFilter(opt.value)}
                    className={`shrink-0 rounded-full border-2 px-3 py-1 text-xs font-bold transition-all ${
                      spotFilter === opt.value
                        ? "border-teal bg-teal text-white"
                        : "border-black/10 text-brown-muted hover:border-teal/40"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {filteredSpots.length === 0 ? (
                <p className="rounded-xl bg-cream px-4 py-3 text-sm text-brown-muted">
                  ไม่มีสถานที่แนะนำสำหรับจังหวัดนี้ — ระบุเองด้านล่างได้เลย
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredSpots.map((spot) => (
                    <button
                      key={spot.id}
                      type="button"
                      onClick={() => {
                        setSelectedSpot(selectedSpot?.id === spot.id ? null : spot);
                        setCustomLoc("");
                      }}
                      className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                        selectedSpot?.id === spot.id
                          ? "border-coral bg-coral/5"
                          : "border-black/8 hover:border-coral/40"
                      }`}
                    >
                      <div className="mt-0.5">{spotIcon(spot.type)}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-brown">{spot.name}</p>
                        {spot.district && (
                          <p className="text-xs text-brown-muted">{spot.district}, {spot.province}</p>
                        )}
                        {spot.description && (
                          <p className="mt-0.5 text-xs text-brown-muted">{spot.description}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Custom location input */}
              <div className="mt-3">
                <p className="mb-1.5 text-xs font-medium text-brown-muted">หรือระบุสถานที่เอง</p>
                <input
                  type="text"
                  value={customLoc}
                  onChange={(e) => {
                    setCustomLoc(e.target.value);
                    if (e.target.value) setSelectedSpot(null);
                  }}
                  placeholder="พิมพ์ชื่อสถานที่..."
                  className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30"
                />
              </div>
            </div>

            {/* ── Note ── */}
            <div className="pb-2">
              <p className="mb-2 text-sm font-bold text-brown">หมายเหตุ (ไม่บังคับ)</p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="เช่น นัดแถวทางเข้าหลัก / เจอกันตอนบ่าย"
                rows={2}
                maxLength={200}
                className="w-full resize-none rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30"
              />
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-black/5 px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4">
          {error && <p className="mb-3 text-center text-sm text-red-500">{error}</p>}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !location}
            className="w-full rounded-full bg-coral py-3 font-bold text-white transition-all hover:bg-coral-dark disabled:opacity-40"
          >
            {submitting ? "กำลังส่ง..." : "ส่งคำขอนัดหมาย"}
          </button>
        </div>
      </div>
    </div>
  );
}
