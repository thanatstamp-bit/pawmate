"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Droplet,
  MapPin,
  ChevronDown,
  Check,
  X,
  Info,
  Dog,
  Cat,
  Weight,
  CalendarDays,
  ShieldCheck,
  PauseCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PROVINCES } from "@/lib/data/provinces";
import { Skeleton } from "@/components/ui";
import {
  evaluateEligibility,
  monthsSinceLastDonation,
} from "@/lib/blood-matching";

// ─── Types ────────────────────────────────────────────────────────────────────

type Pet = {
  id: string;
  name: string;
  species: string;
  birth_month: string;
  vaccinated: boolean | null;
  photos: string[];
  province: string;
};

type BloodRequest = {
  id: string;
  species: string;
  blood_type_needed: string;
  urgency: "urgent" | "normal";
  hospital_name: string;
  province: string;
  details: string;
  contact: string;
  status: "open" | "fulfilled";
  created_at: string;
  requester_id: string;
};

type DonorRecord = {
  id: string;
  pet_id: string;
  blood_type: string;
  weight_kg: number;
  eligible: boolean;
  available: boolean;
  last_donation_date: string | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DOG_BLOOD_TYPES = [
  { value: "DEA1.1+", label: "DEA 1.1+ (บวก)" },
  { value: "DEA1.1-", label: "DEA 1.1- (ลบ)" },
  { value: "unknown", label: "ไม่ทราบ" },
];
const CAT_BLOOD_TYPES = [
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "AB", label: "AB" },
  { value: "unknown", label: "ไม่ทราบ" },
];

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

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RequestCard({ req }: { req: BloodRequest }) {
  const SpeciesIcon = req.species === "dog" ? Dog : Cat;
  return (
    <Link
      href={`/app/care/blood/${req.id}`}
      className="block rounded-panel bg-white p-4 shadow-card transition-transform active:scale-[.985]"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-[10px] bg-fill-2 px-2.5 py-1 text-[12.5px] font-semibold text-ink-2">
          <SpeciesIcon size={14} />
          {req.species === "dog" ? "สุนัข" : "แมว"}
        </span>
        {req.urgency === "urgent" ? (
          <span className="inline-flex items-center rounded-[9px] bg-rose px-2.5 py-1 text-[11.5px] font-bold text-white">
            ด่วนมาก
          </span>
        ) : (
          <span className="inline-flex items-center rounded-[9px] bg-fill-2 px-2.5 py-1 text-[11.5px] font-semibold text-ink-2">
            ทั่วไป
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[15px] bg-rose-soft">
          <Droplet size={22} className="text-rose" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11.5px] font-semibold text-ink-3">ต้องการหมู่เลือด</p>
          <p className="text-[26px] font-bold leading-[1.05] tracking-title text-ink">
            {bloodTypeLabel(req.blood_type_needed)}
          </p>
        </div>
        <span className="shrink-0 self-start text-[12px] font-medium text-ink-3">{timeAgo(req.created_at)}</span>
      </div>
      <div className="mt-3 flex items-center gap-1.5 border-t border-[#F4EDE7] pt-3">
        <MapPin size={13} className="shrink-0 text-ink-3" />
        <span className="truncate text-[13.5px] font-semibold text-ink">{req.hospital_name}</span>
        <span className="shrink-0 text-[13px] text-ink-3">· {req.province}</span>
      </div>
    </Link>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BloodPage() {
  const supabase = createClient();

  const [tab, setTab] = useState<"feed" | "donor">("feed");
  const [loading, setLoading] = useState(true);
  const [activePet, setActivePet] = useState<Pet | null>(null);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [donorRecord, setDonorRecord] = useState<DonorRecord | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Feed filters
  const [filterProvince, setFilterProvince] = useState("");
  const [filterSpecies, setFilterSpecies] = useState("");

  // Donor form state
  const [bloodType, setBloodType] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [lastDonationDate, setLastDonationDate] = useState("");
  const [indoorOnly, setIndoorOnly] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create request overlay
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [reqSpecies, setReqSpecies] = useState<"dog" | "cat">("dog");
  const [reqBloodType, setReqBloodType] = useState("");
  const [reqUrgency, setReqUrgency] = useState<"urgent" | "normal">("normal");
  const [reqHospital, setReqHospital] = useState("");
  const [reqProvince, setReqProvince] = useState("");
  const [reqDetails, setReqDetails] = useState("");
  const [reqContact, setReqContact] = useState("");
  const [submittingReq, setSubmittingReq] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Load active pet
      const storedId = localStorage.getItem("pawmate_active_pet_id");
      let pet: Pet | null = null;
      if (storedId) {
        const { data } = await supabase
          .from("pets")
          .select("id, name, species, birth_month, vaccinated, photos, province")
          .eq("owner_id", user.id)
          .eq("id", storedId)
          .maybeSingle();
        pet = data;
      }
      if (!pet) {
        const { data } = await supabase
          .from("pets")
          .select("id, name, species, birth_month, vaccinated, photos, province")
          .eq("owner_id", user.id)
          .limit(1)
          .maybeSingle();
        pet = data;
        if (pet) localStorage.setItem("pawmate_active_pet_id", pet.id);
      }
      setActivePet(pet);

      // Load requests feed
      const { data: reqs } = await supabase
        .from("blood_requests")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });
      setRequests(reqs ?? []);

      // Load donor record for this pet
      if (pet) {
        const { data: donor } = await supabase
          .from("blood_donors")
          .select("*")
          .eq("pet_id", pet.id)
          .maybeSingle();
        setDonorRecord(donor);
        if (donor) {
          setBloodType(donor.blood_type);
          setWeightKg(String(donor.weight_kg));
          setLastDonationDate(donor.last_donation_date ?? "");
        }
      }

      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (filterProvince && r.province !== filterProvince) return false;
      if (filterSpecies && r.species !== filterSpecies) return false;
      return true;
    });
  }, [requests, filterProvince, filterSpecies]);

  // Live eligibility evaluation for donor form
  const eligibility = useMemo(() => {
    if (!activePet || !weightKg) return null;
    const w = parseFloat(weightKg);
    if (isNaN(w)) return null;
    return evaluateEligibility(
      activePet.species,
      w,
      activePet.birth_month,
      activePet.vaccinated,
      indoorOnly,
    );
  }, [activePet, weightKg, indoorOnly]);

  async function saveDonorRecord() {
    if (!activePet || !bloodType || !weightKg || !eligibility) return;
    setSaving(true);
    const w = parseFloat(weightKg);
    const months = monthsSinceLastDonation(lastDonationDate || null);
    const available = eligibility.allPass && (months === null || months >= 3);

    if (donorRecord) {
      const { data } = await supabase
        .from("blood_donors")
        .update({ blood_type: bloodType, weight_kg: w, eligible: eligibility.allPass, available, last_donation_date: lastDonationDate || null })
        .eq("id", donorRecord.id)
        .select()
        .single();
      if (data) setDonorRecord(data);
    } else {
      const { data } = await supabase
        .from("blood_donors")
        .insert({ pet_id: activePet.id, blood_type: bloodType, weight_kg: w, eligible: eligibility.allPass, available, last_donation_date: lastDonationDate || null })
        .select()
        .single();
      if (data) setDonorRecord(data);
    }
    setSaving(false);
  }

  async function toggleAvailable() {
    if (!donorRecord) return;
    const { data } = await supabase
      .from("blood_donors")
      .update({ available: !donorRecord.available })
      .eq("id", donorRecord.id)
      .select()
      .single();
    if (data) setDonorRecord(data);
  }

  async function submitRequest() {
    if (!userId || !reqBloodType || !reqHospital || !reqProvince || !reqContact) return;
    setSubmittingReq(true);
    const { data } = await supabase
      .from("blood_requests")
      .insert({
        requester_id: userId,
        species: reqSpecies,
        blood_type_needed: reqBloodType,
        urgency: reqUrgency,
        hospital_name: reqHospital,
        province: reqProvince,
        details: reqDetails,
        contact: reqContact,
      })
      .select()
      .single();
    if (data) {
      setRequests((prev) => [data, ...prev]);
      setShowRequestForm(false);
      setReqBloodType("");
      setReqHospital("");
      setReqProvince("");
      setReqDetails("");
      setReqContact("");
    }
    setSubmittingReq(false);
  }

  const bloodTypes = activePet?.species === "cat" ? CAT_BLOOD_TYPES : DOG_BLOOD_TYPES;
  const reqBloodTypes = reqSpecies === "cat" ? CAT_BLOOD_TYPES : DOG_BLOOD_TYPES;

  // Donor status — drives the status card at the bottom of the donor tab
  const donorStatus = (() => {
    if (!donorRecord) return null;
    if (!donorRecord.eligible) {
      return { ready: false, title: "ไม่ผ่านเกณฑ์บางข้อ", sub: "ตรวจสอบเกณฑ์การบริจาคด้านบน" };
    }
    if (!donorRecord.available && donorRecord.last_donation_date) {
      return { ready: false, title: `พักการบริจาคถึง ${addMonths(donorRecord.last_donation_date, 3)}`, sub: "เว้นระยะอย่างน้อย 3 เดือนระหว่างการบริจาค" };
    }
    if (!donorRecord.available) {
      return { ready: false, title: "พร้อม แต่ปิดรับการติดต่อ", sub: 'เปิด "รับการติดต่อ" เพื่อให้เคสด่วนเห็นน้อง' };
    }
    return { ready: true, title: "พร้อมบริจาค", sub: "ขอบคุณที่เป็นฮีโร่ให้น้อง ๆ" };
  })();

  return (
    <div className="flex min-h-screen flex-col pb-24">
      {/* Header */}
      <div className="shrink-0 px-[22px] pb-3 pt-1">
        <div className="mb-2.5 flex items-center gap-3">
          <Link
            href="/app/care"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border-[1.5px] border-line bg-white text-ink shadow-[0_6px_16px_-10px_rgba(120,72,60,.3)] transition-transform active:scale-95"
          >
            <ChevronLeft size={20} />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-[21px] font-bold leading-[1.1] tracking-title text-ink">ศูนย์บริจาคเลือด</h1>
            <p className="mt-px text-[12.5px] text-ink-2">เชื่อมผู้บริจาคกับน้อง ๆ ที่ต้องการเลือดด่วน</p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mb-3 flex items-start gap-2 rounded-[12px] bg-fill-2 px-3 py-2.5">
          <Info size={15} className="mt-px shrink-0 text-ink-3" />
          <span className="text-[11.5px] leading-relaxed text-ink-3">
            PawMate เป็นสื่อกลางช่วยหาผู้บริจาคเท่านั้น ไม่ได้ให้บริการทางการแพทย์ กรุณาปรึกษาสัตวแพทย์ก่อนบริจาคทุกครั้ง
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-[5px] rounded-chip bg-fill-2 p-[5px]">
          {(["feed", "donor"] as const).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 rounded-[10px] py-[11px] text-center text-[14px] tracking-tight2 transition-all ${
                  active ? "bg-white font-bold text-ink shadow-card" : "font-semibold text-ink-3"
                }`}
              >
                {t === "feed" ? "ขอรับบริจาค" : "เป็นผู้บริจาค"}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Tab 1: Feed ─── */}
      {tab === "feed" && (
        <div className="flex flex-col gap-3 px-[22px] pt-1">
          {/* Filters */}
          <div className="flex gap-2.5">
            <div className="relative flex-1">
              <select
                value={filterProvince}
                onChange={(e) => setFilterProvince(e.target.value)}
                className="h-10 w-full appearance-none rounded-[12px] border-[1.5px] border-line bg-white pl-3 pr-8 text-[13px] font-semibold text-ink"
              >
                <option value="">ทุกจังหวัด</option>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
            </div>
            <div className="relative w-[120px]">
              <select
                value={filterSpecies}
                onChange={(e) => setFilterSpecies(e.target.value)}
                className="h-10 w-full appearance-none rounded-[12px] border-[1.5px] border-line bg-white pl-3 pr-8 text-[13px] font-semibold text-ink"
              >
                <option value="">ทุกชนิด</option>
                <option value="dog">สุนัข</option>
                <option value="cat">แมว</option>
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2, 3].map((k) => (
                <Skeleton key={k} className="h-[128px] rounded-panel" />
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="mt-2 flex animate-fade-up flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-[84px] w-[84px] items-center justify-center rounded-[26px] bg-teal-soft">
                <Droplet size={34} className="text-teal-ink" />
              </div>
              <p className="mt-1 text-[18px] font-bold text-ink">ไม่มีคำขอตอนนี้</p>
              <p className="max-w-[240px] text-[14px] leading-relaxed text-ink-2">
                ตอนนี้ยังไม่มีคำขอรับบริจาคตามตัวกรองนี้ — ข่าวดีสำหรับน้อง ๆ ทุกตัว
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredRequests.map((req) => <RequestCard key={req.id} req={req} />)}
            </div>
          )}
        </div>
      )}

      {/* ─── Tab 2: Donor ─── */}
      {tab === "donor" && (
        <div className="px-[22px] pt-1">
          {loading ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-[52px] rounded-[14px]" />
              <Skeleton className="h-[52px] rounded-[14px]" />
              <Skeleton className="h-[180px] rounded-panel" />
            </div>
          ) : !activePet ? (
            <div className="rounded-panel bg-white p-6 text-center shadow-card">
              <p className="text-ink-2">ต้องสร้างโปรไฟล์น้องก่อน</p>
              <Link href="/onboarding" className="mt-3 inline-block rounded-[12px] bg-gradient-cta px-5 py-2.5 text-sm font-bold text-white shadow-cta">
                สร้างโปรไฟล์
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Blood type */}
              <div>
                <label className="mb-[7px] block text-[13px] font-semibold text-ink">หมู่เลือดของน้อง</label>
                <div className="relative">
                  <select
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                    className="h-[52px] w-full appearance-none rounded-[14px] border-[1.5px] border-line bg-white pl-4 pr-10 text-[16px] font-semibold text-ink"
                  >
                    <option value="">เลือกหมู่เลือด</option>
                    {bloodTypes.map((bt) => <option key={bt.value} value={bt.value}>{bt.label}</option>)}
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
                </div>
                {bloodType === "unknown" && (
                  <div className="mt-[7px] flex items-center gap-1.5">
                    <Info size={14} className="shrink-0 text-blue-ink" />
                    <span className="text-[12px] font-medium text-blue-ink">
                      ไม่เป็นไร สัตวแพทย์จะตรวจหมู่เลือดให้ในวันบริจาค
                    </span>
                  </div>
                )}
              </div>

              {/* Weight */}
              <div>
                <label className="mb-[7px] block text-[13px] font-semibold text-ink">น้ำหนัก (กก.)</label>
                <div className="flex h-[52px] items-center gap-2.5 rounded-[14px] border-[1.5px] border-line bg-white px-3.5">
                  <Weight size={18} className="shrink-0 text-ink-3" />
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="เช่น 28"
                    className="min-w-0 flex-1 border-none bg-transparent text-[16px] font-medium text-ink outline-none placeholder:text-ink-3/60"
                  />
                  <span className="shrink-0 text-[14px] font-medium text-ink-3">กก.</span>
                </div>
              </div>

              {/* Indoor-only (cats only) */}
              {activePet.species === "cat" && (
                <label className="flex cursor-pointer items-center gap-3 rounded-[14px] border-[1.5px] border-line bg-white px-4 py-3">
                  <div className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors ${indoorOnly ? "border-teal bg-teal" : "border-line"}`}>
                    {indoorOnly && <Check size={12} className="text-white" />}
                  </div>
                  <input type="checkbox" checked={indoorOnly} onChange={(e) => setIndoorOnly(e.target.checked)} className="sr-only" />
                  <span className="text-sm text-ink">น้องอยู่ในบ้านเท่านั้น (indoor-only)</span>
                </label>
              )}

              {/* Eligibility checklist */}
              {eligibility && (
                <div>
                  <p className="mb-[11px] text-[13px] font-bold text-ink">คุณสมบัติผู้บริจาค</p>
                  <div className="rounded-[16px] bg-white px-4 py-[6px] shadow-card">
                    {eligibility.criteria.map((c, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-[11px] py-3 ${i < eligibility.criteria.length - 1 ? "border-b border-[#F4EDE7]" : ""}`}
                      >
                        <div className={`mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${c.pass ? "bg-teal" : "bg-rose"}`}>
                          {c.pass ? <Check size={14} className="text-white" /> : <X size={14} className="text-white" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-semibold leading-snug text-ink">{c.label}</p>
                          {!c.pass && (
                            <p className="mt-0.5 text-[12px] font-medium text-rose-ink">ยังไม่ผ่านเกณฑ์นี้</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Availability toggle (only meaningful once registered) */}
              {donorRecord && (
                <button
                  type="button"
                  onClick={toggleAvailable}
                  className="flex items-center justify-between rounded-[15px] border-[1.5px] border-line bg-white px-4 py-3.5 text-left shadow-[0_6px_18px_-14px_rgba(120,72,60,.2)]"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-[14.5px] font-semibold text-ink">รับการติดต่อเมื่อมีเคสด่วน</p>
                    <p className="mt-px text-[12px] text-ink-2">เราจะแจ้งเมื่อมีน้องใกล้คุณต้องการเลือด</p>
                  </div>
                  <span
                    className={`flex h-[27px] w-[46px] shrink-0 items-center rounded-full p-[3px] transition-all ${
                      donorRecord.available ? "justify-end bg-teal" : "justify-start bg-fill-3"
                    }`}
                  >
                    <span className="h-[21px] w-[21px] rounded-full bg-white shadow-[0_2px_5px_rgba(0,0,0,.2)]" />
                  </span>
                </button>
              )}

              {/* Last donation date */}
              <div>
                <label className="mb-[7px] block text-[13px] font-semibold text-ink">วันที่บริจาคล่าสุด</label>
                <div className="flex h-[52px] items-center gap-2.5 rounded-[14px] border-[1.5px] border-line bg-white px-3.5">
                  <CalendarDays size={18} className="shrink-0 text-ink-3" />
                  <input
                    type="date"
                    value={lastDonationDate}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setLastDonationDate(e.target.value)}
                    className="min-w-0 flex-1 border-none bg-transparent text-[16px] font-medium text-ink outline-none"
                  />
                  <span className="shrink-0 text-[12.5px] font-medium text-ink-3">ถ้ามี</span>
                </div>
              </div>

              {/* Donor status card */}
              {donorStatus && (
                <div
                  className={`flex items-center gap-3.5 rounded-panel p-4 ${
                    donorStatus.ready ? "border border-teal/45 bg-teal-soft" : "border border-line bg-fill-2"
                  }`}
                >
                  <div
                    className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[16px] ${
                      donorStatus.ready
                        ? "bg-teal shadow-[0_8px_18px_-8px_rgba(46,196,182,.6)]"
                        : "bg-ink-3 shadow-[0_8px_18px_-8px_rgba(120,72,60,.3)]"
                    }`}
                  >
                    {donorStatus.ready ? (
                      <ShieldCheck size={26} className="text-white" />
                    ) : (
                      <PauseCircle size={26} className="text-white" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[16.5px] font-bold tracking-tight2 ${donorStatus.ready ? "text-teal-ink" : "text-ink"}`}>
                      {donorStatus.title}
                    </p>
                    <p className={`mt-0.5 text-[12.5px] ${donorStatus.ready ? "text-teal-ink" : "text-ink-2"}`}>
                      {donorStatus.sub}
                    </p>
                  </div>
                </div>
              )}

              {/* Save / register CTA */}
              <button
                type="button"
                onClick={saveDonorRecord}
                disabled={saving || !bloodType || !weightKg}
                className="h-14 rounded-2xl bg-gradient-cta font-bold tracking-tight2 text-white shadow-cta transition-transform active:scale-[.98] disabled:opacity-40"
              >
                {saving ? "กำลังบันทึก..." : donorRecord ? "บันทึกการเปลี่ยนแปลง" : "ลงทะเบียนผู้บริจาค"}
              </button>

              {/* Donor info note */}
              <div className="flex gap-2 rounded-[14px] bg-amber-soft p-3.5">
                <Info size={15} className="mt-px shrink-0 text-amber-deep" />
                <p className="text-[11.5px] leading-relaxed text-ink-2">
                  ข้อมูลของน้องจะแสดงต่อเจ้าของประกาศที่ขอรับบริจาคเท่านั้น ไม่เปิดเผยต่อสาธารณะ
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FAB — ขอรับบริจาค (feed tab only) */}
      {tab === "feed" && (
        <button
          type="button"
          onClick={() => setShowRequestForm(true)}
          className="fixed bottom-[76px] right-5 z-[60] flex h-[54px] items-center gap-2 rounded-[27px] bg-gradient-cta px-5 shadow-cta transition-transform active:scale-95"
        >
          <Droplet size={18} className="text-white" />
          <span className="text-[15.5px] font-bold text-white">ขอรับบริจาค</span>
        </button>
      )}

      {/* ─── Create Request Overlay ─── */}
      {showRequestForm && (
        <>
          <div className="fixed inset-0 z-[60] bg-[rgba(35,24,20,.45)] backdrop-blur-[2px]" onClick={() => setShowRequestForm(false)} />
          <div
            className="fixed inset-x-0 bottom-0 z-[70] mx-auto max-w-[480px] animate-fade-up overflow-y-auto rounded-t-card bg-white pb-[env(safe-area-inset-bottom)] shadow-sheet"
            style={{ maxHeight: "88vh" }}
          >
            <div className="sticky top-0 bg-white px-6 pb-3 pt-3">
              <div className="mx-auto mb-4 h-[5px] w-10 rounded-full bg-fill-3" />
              <p className="text-lg font-bold tracking-tight2 text-ink">ขอรับบริจาคเลือด</p>
              <p className="mt-0.5 text-[12.5px] text-ink-2">กรอกข้อมูลให้ครบเพื่อให้ผู้บริจาคติดต่อได้</p>
            </div>

            <div className="flex flex-col gap-4 px-6 pb-6">
              {/* Species */}
              <div>
                <label className="mb-2 block text-[12.5px] font-semibold text-ink-2">ชนิดสัตว์ *</label>
                <div className="flex gap-2.5">
                  {(["dog", "cat"] as const).map((s) => {
                    const Icon = s === "dog" ? Dog : Cat;
                    const active = reqSpecies === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => { setReqSpecies(s); setReqBloodType(""); }}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-[14px] border-[1.5px] py-2.5 text-sm font-semibold transition-colors ${
                          active ? "border-coral/40 bg-coral-soft text-coral-ink" : "border-line bg-[#FBF7F3] text-ink-3"
                        }`}
                      >
                        <Icon size={16} />
                        {s === "dog" ? "สุนัข" : "แมว"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Blood type needed */}
              <div>
                <label className="mb-1.5 block text-[12.5px] font-semibold text-ink-2">หมู่เลือดที่ต้องการ *</label>
                <div className="relative">
                  <select
                    value={reqBloodType}
                    onChange={(e) => setReqBloodType(e.target.value)}
                    className="w-full appearance-none rounded-[14px] border-[1.5px] border-line bg-[#FBF7F3] py-3 pl-4 pr-9 text-sm font-medium text-ink"
                  >
                    <option value="">เลือกหมู่เลือด</option>
                    {reqBloodTypes.map((bt) => <option key={bt.value} value={bt.value}>{bt.label}</option>)}
                  </select>
                  <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
                </div>
              </div>

              {/* Urgency */}
              <div>
                <label className="mb-2 block text-[12.5px] font-semibold text-ink-2">ความเร่งด่วน *</label>
                <div className="flex gap-2.5">
                  {([["normal", "ทั่วไป"], ["urgent", "ด่วนมาก"]] as const).map(([v, label]) => {
                    const active = reqUrgency === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setReqUrgency(v)}
                        className={`flex-1 rounded-[14px] border-[1.5px] py-2.5 text-sm font-semibold transition-colors ${
                          active
                            ? v === "urgent" ? "border-rose/40 bg-rose-soft text-rose-ink" : "border-teal/40 bg-teal-soft text-teal-ink"
                            : "border-line bg-[#FBF7F3] text-ink-3"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hospital */}
              <div>
                <label className="mb-1.5 block text-[12.5px] font-semibold text-ink-2">โรงพยาบาลสัตว์ *</label>
                <input
                  type="text"
                  value={reqHospital}
                  onChange={(e) => setReqHospital(e.target.value)}
                  placeholder="เช่น โรงพยาบาลสัตว์กรุงเทพ"
                  className="w-full rounded-[14px] border-[1.5px] border-line bg-[#FBF7F3] px-4 py-3 text-sm text-ink placeholder:text-ink-3/60"
                />
              </div>

              {/* Province */}
              <div>
                <label className="mb-1.5 block text-[12.5px] font-semibold text-ink-2">จังหวัด *</label>
                <div className="relative">
                  <select
                    value={reqProvince}
                    onChange={(e) => setReqProvince(e.target.value)}
                    className="w-full appearance-none rounded-[14px] border-[1.5px] border-line bg-[#FBF7F3] py-3 pl-4 pr-9 text-sm font-medium text-ink"
                  >
                    <option value="">เลือกจังหวัด</option>
                    {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
                </div>
              </div>

              {/* Details */}
              <div>
                <label className="mb-1.5 block text-[12.5px] font-semibold text-ink-2">รายละเอียดเพิ่มเติม</label>
                <textarea
                  value={reqDetails}
                  onChange={(e) => setReqDetails(e.target.value)}
                  rows={3}
                  placeholder="เช่น สายพันธุ์น้อง น้ำหนัก สถานการณ์"
                  className="w-full resize-none rounded-[14px] border-[1.5px] border-line bg-[#FBF7F3] px-4 py-3 text-sm text-ink placeholder:text-ink-3/60"
                />
              </div>

              {/* Contact */}
              <div>
                <label className="mb-1.5 block text-[12.5px] font-semibold text-ink-2">เบอร์ติดต่อ *</label>
                <input
                  type="text"
                  value={reqContact}
                  onChange={(e) => setReqContact(e.target.value)}
                  placeholder="08x-xxx-xxxx"
                  className="w-full rounded-[14px] border-[1.5px] border-line bg-[#FBF7F3] px-4 py-3 text-sm text-ink placeholder:text-ink-3/60"
                />
              </div>

              <button
                type="button"
                onClick={submitRequest}
                disabled={submittingReq || !reqBloodType || !reqHospital || !reqProvince || !reqContact}
                className="h-14 rounded-2xl bg-gradient-cta font-bold tracking-tight2 text-white shadow-cta transition-transform active:scale-[.98] disabled:opacity-40"
              >
                {submittingReq ? "กำลังโพสต์..." : "โพสต์ประกาศ"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
