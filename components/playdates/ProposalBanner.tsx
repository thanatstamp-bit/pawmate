"use client";

import { CalendarDays, MapPin, Check, X, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

type Spot = {
  name: string;
  district: string | null;
};

export type ProposalData = {
  id: string;
  proposer_pet_id: string;
  proposed_at: string;
  custom_location: string | null;
  note: string | null;
  status: "pending" | "accepted" | "declined" | "cancelled";
  spot: Spot | null;
};

interface Props {
  proposal: ProposalData;
  myPetId: string;
  matchId: string;
  onRefetch: () => void;
}

const FULL_DAY   = ["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์","เสาร์"];
const FULL_MONTH = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

function formatDate(iso: string) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  return `${FULL_DAY[d.getDay()]}ที่ ${d.getDate()} ${FULL_MONTH[d.getMonth()]} เวลา ${time} น.`;
}

export default function ProposalBanner({ proposal, myPetId, matchId, onRefetch }: Props) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const isProposer = proposal.proposer_pet_id === myPetId;
  const location   = proposal.spot?.name ?? proposal.custom_location ?? "ไม่ระบุสถานที่";
  const district   = proposal.spot?.district;
  const dateStr    = formatDate(proposal.proposed_at);

  async function updateStatus(status: "accepted" | "declined" | "cancelled") {
    setLoading(true);
    await supabase
      .from("playdate_proposals")
      .update({ status })
      .eq("id", proposal.id);

    // Send a system message to reflect the action
    if (status === "accepted") {
      await supabase.from("messages").insert({
        match_id: matchId,
        sender_pet_id: myPetId,
        content: `✅ ยืนยันนัดหมายแล้ว! พบกัน ${dateStr} ที่ ${location}`,
      });
    } else if (status === "declined") {
      await supabase.from("messages").insert({
        match_id: matchId,
        sender_pet_id: myPetId,
        content: "❌ ขอโทษด้วยนะ ขอปฏิเสธนัดหมายในครั้งนี้",
      });
    }

    setLoading(false);
    onRefetch();
  }

  // ── Accepted state ────────────────────────────────────────────────────────
  if (proposal.status === "accepted") {
    return (
      <div className="mx-4 mb-2 mt-1 rounded-2xl border-l-4 border-teal bg-teal/8 px-4 py-3">
        <div className="flex items-center gap-2 text-teal-dark">
          <Check size={16} strokeWidth={2.5} />
          <span className="text-xs font-bold">นัดหมายยืนยันแล้ว!</span>
        </div>
        <p className="mt-1 text-sm font-medium text-ink">{dateStr}</p>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-2">
          <MapPin size={12} />
          <span>{location}{district ? `, ${district}` : ""}</span>
        </div>
        {proposal.note && (
          <p className="mt-1 text-xs text-ink-2">💬 {proposal.note}</p>
        )}
      </div>
    );
  }

  // ── Pending — proposer waiting ────────────────────────────────────────────
  if (proposal.status === "pending" && isProposer) {
    return (
      <div className="mx-4 mb-2 mt-1 rounded-2xl border-l-4 border-amber bg-amber/8 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-dark">
            <Clock size={16} />
            <span className="text-xs font-bold">รอการตอบรับ</span>
          </div>
          <button
            type="button"
            onClick={() => updateStatus("cancelled")}
            disabled={loading}
            className="text-xs text-ink-2 underline disabled:opacity-40"
          >
            ยกเลิก
          </button>
        </div>
        <p className="mt-1 text-sm font-medium text-ink">{dateStr}</p>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-2">
          <MapPin size={12} />
          <span>{location}{district ? `, ${district}` : ""}</span>
        </div>
      </div>
    );
  }

  // ── Pending — receiver can accept/decline ─────────────────────────────────
  if (proposal.status === "pending" && !isProposer) {
    return (
      <div className="mx-4 mb-2 mt-1 rounded-2xl border-l-4 border-coral bg-coral/8 px-4 py-3">
        <div className="flex items-center gap-2 text-coral">
          <CalendarDays size={16} />
          <span className="text-xs font-bold">ได้รับคำขอนัดหมาย</span>
        </div>
        <p className="mt-1 text-sm font-medium text-ink">{dateStr}</p>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-2">
          <MapPin size={12} />
          <span>{location}{district ? `, ${district}` : ""}</span>
        </div>
        {proposal.note && (
          <p className="mt-1 text-xs text-ink-2">💬 {proposal.note}</p>
        )}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => updateStatus("accepted")}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-teal py-2 text-sm font-bold text-white transition-transform active:scale-[.98] disabled:opacity-40"
          >
            <Check size={15} strokeWidth={2.5} /> ยืนยัน
          </button>
          <button
            type="button"
            onClick={() => updateStatus("declined")}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border-2 border-black/10 py-2 text-sm font-bold text-ink-2 disabled:opacity-40"
          >
            <X size={15} /> ปฏิเสธ
          </button>
        </div>
      </div>
    );
  }

  return null;
}
