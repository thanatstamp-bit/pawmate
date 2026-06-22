"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  MapPin,
  Phone,
  Check,
  CheckCheck,
  Droplet,
  AlertTriangle,
  HeartHandshake,
  SearchX,
} from "lucide-react";
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
  crossmatch,
  onResponded,
}: {
  donor: DonorRow;
  isOwner: boolean;
  requestId: string;
  hasResponded: boolean;
  crossmatch?: boolean;
  onResponded: () => void;
}) {
  const supabase = createClient();
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(hasResponded);

  const pet = donor.pets;

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
    <div
      className={`rounded-[16px] p-3 ${
        crossmatch ? "border border-[#F1E6CE] bg-[#FFFBF5]" : "bg-white shadow-[0_8px_22px_-14px_rgba(120,72,60,.2)]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-gradient-avatar">
          {pet.photos?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pet.photos[0]} alt={pet.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[19px] font-bold text-white">{pet.name?.trim()?.[0] ?? "🐾"}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-ink">{pet.name}</p>
          <p className="mt-px text-[12.5px] text-ink-2">{donor.weight_kg} กก.</p>
        </div>
        {done ? (
          <span className="flex shrink-0 items-center gap-1 text-[12px] font-bold text-teal-ink">
            <CheckCheck size={14} /> แจ้งแล้ว
          </span>
        ) : crossmatch ? (
          <span className="shrink-0 whitespace-nowrap rounded-[10px] bg-amber-soft px-[11px] py-1.5 text-[12px] font-semibold text-amber-deep">
            ไม่ทราบหมู่
          </span>
        ) : (
          <span className="shrink-0 whitespace-nowrap rounded-[10px] bg-teal-soft px-[11px] py-1.5 text-[13px] font-bold text-teal-ink">
            {bloodTypeLabel(donor.blood_type)}
          </span>
        )}
      </div>

      {/* Respond action (non-owner, not yet responded) */}
      {!isOwner && !done && (
        <>
          {!showForm ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-gradient-cta text-[14px] font-bold text-white shadow-cta transition-transform active:scale-[.98]"
            >
              <HeartHandshake size={16} />
              ยินดีช่วยเหลือ
            </button>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              <textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="ข้อความถึงเจ้าของประกาศ..."
                className="w-full resize-none rounded-[12px] border-[1.5px] border-line bg-[#FBF7F3] px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-3/60"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-[12px] border-[1.5px] border-line py-2.5 text-sm font-semibold text-ink-2"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={respond}
                  disabled={submitting || !message.trim()}
                  className="flex-1 rounded-[12px] bg-gradient-cta py-2.5 text-sm font-bold text-white shadow-cta disabled:opacity-40"
                >
                  {submitting ? "กำลังส่ง..." : "ส่ง"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Response card (for request owner to see who responded) ──────────────────

function ResponseRow({ resp }: { resp: ResponseRecord & { pets: { name: string; photos: string[]; province: string } | null } }) {
  if (!resp.pets) return null;
  return (
    <div className="rounded-[16px] bg-white p-3.5 shadow-[0_8px_22px_-14px_rgba(120,72,60,.2)]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-avatar">
          {resp.pets.photos?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resp.pets.photos[0]} alt={resp.pets.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[16px] font-bold text-white">{resp.pets.name?.trim()?.[0] ?? "🐾"}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14.5px] font-bold text-ink">{resp.pets.name}</p>
          <div className="mt-px flex items-center gap-1 text-[12px] text-ink-2">
            <MapPin size={11} />
            <span>{resp.pets.province}</span>
          </div>
        </div>
        <span className="shrink-0 text-[11.5px] font-medium text-ink-3">{timeAgo(resp.created_at)}</span>
      </div>
      {resp.message && <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink">{resp.message}</p>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BloodDetailPage() {
  const { id } = useParams<{ id: string }>();
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
      // pets!inner → filtering on the embedded resource actually drops donor
      // rows of the wrong species. Without !inner, Supabase keeps the parent
      // row with pets=null, which then crashes matchDonors/DonorCard.
      const { data: donorRows } = await supabase
        .from("blood_donors")
        .select("*, pets!inner(id, name, photos, species, birth_month, province, vaccinated, owner_id, profiles(display_name))")
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

  function Header() {
    return (
      <div className="flex shrink-0 items-center gap-3 border-b border-line px-[22px] pb-3 pt-1">
        <Link
          href="/app/care/blood"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border-[1.5px] border-line bg-white text-ink shadow-[0_6px_16px_-10px_rgba(120,72,60,.3)] transition-transform active:scale-95"
        >
          <ChevronLeft size={20} />
        </Link>
        <h1 className="flex-1 truncate text-[19px] font-bold tracking-title text-ink">คำขอรับบริจาคเลือด</h1>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-rose" />
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-ink-2">ไม่พบประกาศนี้</p>
        </div>
      </div>
    );
  }

  const fulfilled = request.status === "fulfilled";
  const totalMatched = matchResult.exact.length + matchResult.crossmatch.length;

  return (
    <div className="flex min-h-screen flex-col pb-28">
      <Header />

      <div className="flex flex-col gap-3 px-[22px] pt-4">
        {/* Request summary card */}
        <div className="rounded-card bg-white p-[18px] shadow-card">
          <div className="mb-3.5 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-[10px] bg-fill-2 px-2.5 py-1 text-[12.5px] font-semibold text-ink-2">
              <Droplet size={14} />
              {request.species === "dog" ? "สุนัข" : "แมว"}
            </span>
            {fulfilled ? (
              <span className="inline-flex items-center rounded-[9px] bg-teal-soft px-2.5 py-1 text-[11.5px] font-bold text-teal-ink">
                ปิดแล้ว
              </span>
            ) : request.urgency === "urgent" ? (
              <span className="inline-flex items-center rounded-[9px] bg-rose px-2.5 py-1 text-[11.5px] font-bold text-white">
                ด่วนมาก
              </span>
            ) : (
              <span className="inline-flex items-center rounded-[9px] bg-fill-2 px-2.5 py-1 text-[11.5px] font-semibold text-ink-2">
                ทั่วไป
              </span>
            )}
          </div>

          <div className="flex items-center gap-3.5">
            <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[17px] bg-rose-soft">
              <Droplet size={26} className="text-rose" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-ink-3">ต้องการหมู่เลือด</p>
              <p className="text-[30px] font-bold leading-[1.05] tracking-title text-ink">
                {bloodTypeLabel(request.blood_type_needed)}
              </p>
            </div>
            <span className="shrink-0 self-start text-[12.5px] font-medium text-ink-3">{timeAgo(request.created_at)}</span>
          </div>

          {request.details && (
            <p className="mt-3.5 border-t border-[#F4EDE7] pt-3.5 text-[14px] leading-relaxed text-ink">
              {request.details}
            </p>
          )}

          <div className="mt-3.5 flex items-center gap-2">
            <MapPin size={15} className="shrink-0 text-ink-3" />
            <span className="text-[13.5px] font-semibold text-ink">{request.hospital_name}</span>
            <span className="text-[13px] text-ink-3">· {request.province}</span>
          </div>
        </div>

        {/* Contact card */}
        <a
          href={`tel:${request.contact}`}
          className="flex items-center gap-3 rounded-panel bg-white p-3.5 shadow-card transition-transform active:scale-[.99]"
        >
          <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] bg-teal-soft">
            <Phone size={18} className="text-teal-ink" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14.5px] font-bold text-ink">โทรหาผู้ประสานงาน</p>
            <p className="mt-px text-[12.5px] text-ink-2">{request.contact}</p>
          </div>
          <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] bg-blue-soft">
            <Phone size={18} className="text-blue-ink" />
          </div>
        </a>

        {/* Fulfilled celebration */}
        {fulfilled && (
          <div className="flex animate-pop items-center gap-3 rounded-panel border border-teal/45 bg-teal-soft p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-teal shadow-[0_8px_18px_-8px_rgba(46,196,182,.6)]">
              <Check size={24} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[16px] font-bold tracking-tight2 text-teal-ink">ได้รับความช่วยเหลือแล้ว</p>
              <p className="mt-0.5 text-[13px] text-teal-ink">ขอบคุณผู้บริจาคทุกคนที่ช่วยชีวิตน้อง</p>
            </div>
          </div>
        )}

        {/* ─── Donor section (non-owner sees matching donors) ─── */}
        {!isOwner && !fulfilled && (
          <>
            {totalMatched === 0 ? (
              <div className="mt-3 flex flex-col items-center rounded-panel border-[1.5px] border-dashed border-fill-3 bg-[#FBF7F3] px-6 py-[30px] text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-fill-2">
                  <SearchX size={26} className="text-ink-3" />
                </div>
                <p className="mt-3.5 text-[15px] font-bold text-ink">ยังไม่มีผู้บริจาคที่เข้าเกณฑ์</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">
                  ยังไม่มีผู้บริจาคเข้าเกณฑ์ในจังหวัดนี้ — ลองเช็คใหม่ภายหลัง หรือโทรติดต่อโดยตรง
                </p>
              </div>
            ) : (
              <>
                {/* Exact-match donors */}
                <div className="mb-1 mt-3 flex items-baseline gap-2 px-0.5">
                  <span className="text-[16px] font-bold tracking-tight2 text-ink">ผู้บริจาคที่เข้าเกณฑ์ในจังหวัดนี้</span>
                  <span className="text-[14px] font-bold text-teal-ink">{totalMatched} ตัว</span>
                </div>

                {matchResult.exact.length > 0 && (
                  <div className="flex flex-col gap-2.5">
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

                {/* Crossmatch donors */}
                {matchResult.crossmatch.length > 0 && (
                  <>
                    <div className="mb-1 mt-2 flex items-center gap-1.5 px-0.5">
                      <AlertTriangle size={15} className="text-amber-deep" />
                      <span className="text-[13.5px] font-bold text-amber-deep">ต้องตรวจ crossmatch ก่อน</span>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {matchResult.crossmatch.map((d) => (
                        <DonorCard
                          key={d.id}
                          donor={d}
                          isOwner={isOwner}
                          requestId={request.id}
                          crossmatch
                          hasResponded={respondedIds.has(d.pet_id)}
                          onResponded={() => setRespondedIds((prev) => new Set(Array.from(prev).concat(d.pet_id)))}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* ─── Responses section (request owner sees who responded) ─── */}
        {isOwner && (
          <>
            <div className="mb-1 mt-3 flex items-baseline gap-2 px-0.5">
              <span className="text-[16px] font-bold tracking-tight2 text-ink">การตอบรับ</span>
              {responses.length > 0 && (
                <span className="text-[14px] font-bold text-coral-ink">{responses.length}</span>
              )}
            </div>
            {responses.length === 0 ? (
              <div className="rounded-panel border-[1.5px] border-dashed border-fill-3 bg-[#FBF7F3] py-8 text-center">
                <p className="text-sm text-ink-2">ยังไม่มีผู้แจ้งความสนใจ</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {responses.map((r) => <ResponseRow key={r.id} resp={r} />)}
              </div>
            )}

            {/* Mark fulfilled */}
            {request.status === "open" && (
              <button
                type="button"
                onClick={markFulfilled}
                disabled={fulfilling}
                className="mt-3 flex h-[54px] w-full items-center justify-center gap-2 rounded-[16px] border-[1.5px] border-teal/40 bg-teal-soft text-[15.5px] font-bold text-teal-ink transition-transform active:scale-[.98] disabled:opacity-40"
              >
                <Check size={18} />
                {fulfilling ? "กำลังอัปเดต..." : "ปิดประกาศ (ได้รับความช่วยเหลือแล้ว)"}
              </button>
            )}
          </>
        )}

        {/* Disclaimer */}
        <p className="mt-1 text-center text-[11px] leading-relaxed text-ink-3">
          PawMate เป็นสื่อกลางเท่านั้น การบริจาคต้องผ่านการตรวจสุขภาพและดูแลโดยสัตวแพทย์
        </p>
      </div>
    </div>
  );
}
