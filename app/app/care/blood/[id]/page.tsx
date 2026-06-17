"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, MapPin, Phone, Check, CheckCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { matchDonors, type DonorRow, type MatchResult } from "@/lib/blood-matching";

// ─── Types ───────────────────────────────────────────────────────────────────

type BloodRequest = {
  id: string;
  requester_id: string;
  species: string;
  blood_type_needed: string;
  urgency: "urgent" | "normal";
  hospital_name: string;
  province: string;
  details: string;
  contact: string;
  status: "open" | "fulfilled";
  created_at: string;
};

type ResponseRecord = {
  id: string;
  request_id: string;
  donor_pet_id: string;
  message: string | null;
  created_at: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function bloodTypeLabel(bt: string) {
  return bt === "DEA1.1+" ? "DEA 1.1+" : bt === "DEA1.1-" ? "DEA 1.1-" : bt === "unknown" ? "ไม่ทราบ" : bt;
}

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "เมื่อวาน" : `${days} วันที่แล้ว`;
}

// ─── Donor card ───────────────────────────────────────────────────────────────

function DonorCard({
  donor,
  isOwner,
  requestId,
  hasResponded,
  onResponded,
}: {
  donor: DonorRow;
  isOwner: boolean;
  requestId: string;
  hasResponded: boolean;
  onResponded: () => void;
}) {
  const supabase = createClient();
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(hasResponded);

  const pet = donor.pets;
  const profileName = Array.isArray(pet.profiles)
    ? pet.profiles[0]?.display_name
    : (pet.profiles as { display_name: string | null } | null)?.display_name;

  async function respond() {
    if (!message.trim()) return;
    setSubmitting(true);
    await supabase.from("blood_responses").insert({
      request_id: requestId,
      donor_pet_id: donor.pet_id,
      message: message.trim(),
    });
    setDone(true);
    setShowForm(false);
    onResponded();
    setSubmitting(false);
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 overflow-hidden rounded-xl bg-cream">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pet.photos[0]} alt={pet.name} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-brown">{pet.name}</p>
          <p className="text-[12px] text-brown-muted">
            กรุ๊ป {bloodTypeLabel(donor.blood_type)} · {donor.weight_kg} กก.
          </p>
          <div className="mt-0.5 flex items-center gap-1 text-[12px] text-brown-muted">
            <MapPin size={10} />
            <span>{pet.province}</span>
          </div>
        </div>
        {done ? (
          <span className="flex items-center gap-1 text-[12px] font-bold text-teal-dark">
            <CheckCheck size={14} /> แจ้งแล้ว
          </span>
        ) : !isOwner && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-xl bg-teal/10 px-3 py-2 text-[12px] font-bold text-teal-dark"
          >
            แจ้งความสนใจ
          </button>
        )}
      </div>

      {showForm && !done && (
        <div className="mt-3 flex flex-col gap-2">
          <textarea
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="ข้อความถึงเจ้าของประกาศ..."
            className="w-full resize-none rounded-xl border border-black/10 bg-cream px-3 py-2.5 text-sm text-brown placeholder:text-brown-muted/50"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-xl border border-black/10 py-2.5 text-sm font-semibold text-brown-muted"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={respond}
              disabled={submitting || !message.trim()}
              className="flex-1 rounded-xl bg-teal py-2.5 text-sm font-bold text-white disabled:opacity-40"
            >
              {submitting ? "กำลังส่ง..." : "ส่ง"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Response card (for request owner to see who responded) ──────────────────

function ResponseRow({ resp }: { resp: ResponseRecord & { pets: { name: string; photos: string[]; province: string } | null } }) {
  if (!resp.pets) return null;
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-card">
      <div className="h-10 w-10 overflow-hidden rounded-xl bg-cream">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={resp.pets.photos[0]} alt={resp.pets.name} className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-brown">{resp.pets.name}</p>
        <div className="flex items-center gap-1 text-[11px] text-brown-muted">
          <MapPin size={10} />
          <span>{resp.pets.province}</span>
          <span className="mx-1">·</span>
          <span>{timeAgo(resp.created_at)}</span>
        </div>
        {resp.message && <p className="mt-1 text-[13px] text-brown">{resp.message}</p>}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BloodDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [donors, setDonors] = useState<DonorRow[]>([]);
  const [responses, setResponses] = useState<(ResponseRecord & { pets: { name: string; photos: string[]; province: string } | null })[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [activePetId, setActivePetId] = useState<string | null>(null);
  const [respondedIds, setRespondedIds] = useState<Set<string>>(new Set());
  const [fulfilling, setFulfilling] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const storedPetId = localStorage.getItem("pawmate_active_pet_id");

      // Load request
      const { data: req } = await supabase
        .from("blood_requests")
        .select("*")
        .eq("id", id)
        .single();
      setRequest(req);

      if (!req) { setLoading(false); return; }

      // Load matching donors
      const { data: donorRows } = await supabase
        .from("blood_donors")
        .select("*, pets(id, name, photos, species, birth_month, province, vaccinated, owner_id, profiles(display_name))")
        .eq("pets.species", req.species);
      setDonors((donorRows ?? []) as DonorRow[]);

      // Resolve active pet (validate it belongs to user)
      if (storedPetId) {
        const { data: pet } = await supabase
          .from("pets")
          .select("id")
          .eq("owner_id", user.id)
          .eq("id", storedPetId)
          .maybeSingle();
        if (pet) setActivePetId(pet.id);
      }
      if (!activePetId && !storedPetId) {
        const { data: pet } = await supabase
          .from("pets")
          .select("id")
          .eq("owner_id", user.id)
          .limit(1)
          .maybeSingle();
        if (pet) {
          setActivePetId(pet.id);
          localStorage.setItem("pawmate_active_pet_id", pet.id);
        }
      }

      // Load responses (RLS: only donor owner or request owner can see)
      const { data: resps } = await supabase
        .from("blood_responses")
        .select("*, pets(name, photos, province)")
        .eq("request_id", id)
        .order("created_at", { ascending: true });
      setResponses((resps ?? []) as typeof responses);

      // Track which donor pets this user has already responded on behalf of
      if (resps) {
        setRespondedIds(new Set(resps.map((r: ResponseRecord) => r.donor_pet_id)));
      }

      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const matchResult: MatchResult = useMemo(() => {
    if (!request) return { exact: [], crossmatch: [] };
    return matchDonors(donors, request.province, request.blood_type_needed);
  }, [donors, request]);

  const isOwner = request?.requester_id === userId;

  async function markFulfilled() {
    if (!request) return;
    setFulfilling(true);
    const { data } = await supabase
      .from("blood_requests")
      .update({ status: "fulfilled" })
      .eq("id", request.id)
      .select()
      .single();
    if (data) setRequest(data);
    setFulfilling(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex h-14 items-center gap-1 border-b border-black/5 px-1">
          <Link href="/app/care/blood" className="flex h-11 w-11 items-center justify-center text-brown">
            <ChevronLeft size={20} />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/10 border-t-rose" />
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex h-14 items-center gap-1 border-b border-black/5 px-1">
          <Link href="/app/care/blood" className="flex h-11 w-11 items-center justify-center text-brown">
            <ChevronLeft size={20} />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-brown-muted">ไม่พบประกาศนี้</p>
        </div>
      </div>
    );
  }

  const speciesIcon = request.species === "dog" ? "🐕" : "🐈";

  return (
    <div className="flex min-h-screen flex-col pb-28">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center gap-1 border-b border-black/5 px-1">
        <Link href="/app/care/blood" className="flex h-11 w-11 items-center justify-center text-brown">
          <ChevronLeft size={20} />
        </Link>
        <p className="font-bold text-brown">รายละเอียดประกาศ</p>
      </div>

      <div className="flex flex-col gap-4 px-5 pt-4">
        {/* Request card */}
        <div className="rounded-2xl bg-white p-5 shadow-card">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-3xl">{speciesIcon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-brown">{bloodTypeLabel(request.blood_type_needed)}</span>
                  {request.urgency === "urgent" && (
                    <span className="rounded-full bg-rose/10 px-2.5 py-0.5 text-[12px] font-bold text-rose">ด่วนมาก</span>
                  )}
                </div>
                <p className="text-[13px] text-brown-muted">{request.species === "dog" ? "สุนัข" : "แมว"}</p>
              </div>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
              request.status === "open" ? "bg-teal/10 text-teal-dark" : "bg-black/8 text-brown-muted"
            }`}>
              {request.status === "open" ? "เปิดรับ" : "ปิดแล้ว"}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 border-t border-black/5 pt-3">
            <div className="flex items-start gap-2">
              <span className="min-w-[72px] text-[12px] text-brown-muted">โรงพยาบาล</span>
              <span className="text-[13px] font-semibold text-brown">{request.hospital_name}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="min-w-[72px] text-[12px] text-brown-muted">จังหวัด</span>
              <span className="flex items-center gap-1 text-[13px] font-semibold text-brown">
                <MapPin size={12} className="text-brown-muted" />
                {request.province}
              </span>
            </div>
            {request.details && (
              <div className="flex items-start gap-2">
                <span className="min-w-[72px] text-[12px] text-brown-muted">รายละเอียด</span>
                <span className="text-[13px] text-brown">{request.details}</span>
              </div>
            )}
            <div className="flex items-start gap-2">
              <span className="min-w-[72px] text-[12px] text-brown-muted">โพสต์เมื่อ</span>
              <span className="text-[12px] text-brown-muted">{timeAgo(request.created_at)}</span>
            </div>
          </div>

          {/* Contact — visible to all */}
          <a
            href={`tel:${request.contact}`}
            className="mt-4 flex h-11 items-center justify-center gap-2 rounded-xl bg-rose/10 font-bold text-rose"
          >
            <Phone size={16} />
            <span>โทร {request.contact}</span>
          </a>

          {/* Mark fulfilled (owner only) */}
          {isOwner && request.status === "open" && (
            <button
              type="button"
              onClick={markFulfilled}
              disabled={fulfilling}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal/10 font-bold text-teal-dark disabled:opacity-40"
            >
              <Check size={16} />
              {fulfilling ? "กำลังอัปเดต..." : "ทำเครื่องหมายว่าหาได้แล้ว"}
            </button>
          )}
        </div>

        {/* ─── Donor section (non-owner sees matching donors) ─── */}
        {!isOwner && request.status === "open" && (
          <>
            {matchResult.exact.length === 0 && matchResult.crossmatch.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-black/8 bg-white/60 py-8 text-center">
                <p className="font-bold text-brown">ยังไม่มีผู้บริจาคที่ตรงเกณฑ์</p>
                <p className="mt-1 text-sm text-brown-muted">ลองเช็คใหม่ภายหลัง หรือโทรติดต่อโดยตรง</p>
              </div>
            ) : (
              <>
                {matchResult.exact.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-bold text-brown">กรุ๊ปตรง ({matchResult.exact.length})</p>
                      <div className="h-px flex-1 bg-black/8" />
                    </div>
                    {matchResult.exact.map((d) => (
                      <DonorCard
                        key={d.id}
                        donor={d}
                        isOwner={isOwner}
                        requestId={request.id}
                        hasResponded={respondedIds.has(d.pet_id)}
                        onResponded={() => setRespondedIds((prev) => new Set(Array.from(prev).concat(d.pet_id)))}
                      />
                    ))}
                  </div>
                )}
                {matchResult.crossmatch.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-bold text-brown">ต้องตรวจ crossmatch ({matchResult.crossmatch.length})</p>
                      <div className="h-px flex-1 bg-black/8" />
                    </div>
                    <p className="text-[11px] text-brown-muted">กรุ๊ปเลือดไม่ทราบ ต้องตรวจ crossmatch ก่อนรับบริจาค</p>
                    {matchResult.crossmatch.map((d) => (
                      <DonorCard
                        key={d.id}
                        donor={d}
                        isOwner={isOwner}
                        requestId={request.id}
                        hasResponded={respondedIds.has(d.pet_id)}
                        onResponded={() => setRespondedIds((prev) => new Set(Array.from(prev).concat(d.pet_id)))}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ─── Responses section (request owner sees who responded) ─── */}
        {isOwner && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-bold text-brown">
                ผู้แจ้งความสนใจ {responses.length > 0 ? `(${responses.length})` : ""}
              </p>
              <div className="h-px flex-1 bg-black/8" />
            </div>
            {responses.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-black/8 bg-white/60 py-8 text-center">
                <p className="text-sm text-brown-muted">ยังไม่มีผู้แจ้งความสนใจ</p>
              </div>
            ) : (
              responses.map((r) => <ResponseRow key={r.id} resp={r} />)
            )}
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-center text-[11px] leading-relaxed text-brown-muted/70">
          PawMate เป็นสื่อกลางเท่านั้น การบริจาคต้องผ่านการตรวจสุขภาพและดูแลโดยสัตวแพทย์
        </p>
      </div>
    </div>
  );
}
