"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Droplet, MapPin, ChevronDown, Check, X, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PROVINCES } from "@/lib/data/provinces";
import {
  evaluateEligibility,
  monthsSinceLastDonation,
  type DonorRow,
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
  const speciesIcon = req.species === "dog" ? "🐕" : "🐈";
  return (
    <Link
      href={`/app/care/blood/${req.id}`}
      className="flex items-start gap-3.5 rounded-2xl bg-white p-4 shadow-card"
    >
      <div className="mt-0.5 text-2xl">{speciesIcon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-brown">{bloodTypeLabel(req.blood_type_needed)}</span>
          {req.urgency === "urgent" && (
            <span className="rounded-full bg-rose/10 px-2 py-0.5 text-[11px] font-bold text-rose">
              ด่วนมาก
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm font-medium text-brown">{req.hospital_name}</p>
        <div className="mt-1 flex items-center gap-1 text-[12px] text-brown-muted">
          <MapPin size={11} />
          <span>{req.province}</span>
          <span className="mx-1">·</span>
          <span>{timeAgo(req.created_at)}</span>
        </div>
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

  const donorStatusLabel = (() => {
    if (!donorRecord) return null;
    if (!donorRecord.eligible) return { text: "ไม่ผ่านเกณฑ์บางข้อ", color: "text-brown-muted" };
    if (!donorRecord.available && donorRecord.last_donation_date) {
      return { text: `พักการบริจาคถึง ${addMonths(donorRecord.last_donation_date, 3)}`, color: "text-amber-dark" };
    }
    if (!donorRecord.available) return { text: "หยุดพักชั่วคราว", color: "text-amber-dark" };
    return { text: "พร้อมบริจาค", color: "text-teal-dark" };
  })();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <Droplet size={32} className="animate-pulse text-rose/40" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col pb-24">
      <Header />

      {/* Disclaimer */}
      <div className="border-b border-black/5 bg-amber/10 px-5 py-2.5">
        <p className="text-[11px] leading-relaxed text-brown-muted">
          PawMate เป็นสื่อกลางช่วยหาผู้บริจาคเท่านั้น การบริจาคจริงต้องผ่านการตรวจและดูแลโดยสัตวแพทย์
        </p>
      </div>

      {/* Tab bar */}
      <div className="sticky top-0 z-10 flex border-b border-black/5 bg-white">
        {(["feed", "donor"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-[13px] font-semibold transition-colors ${
              tab === t ? "border-b-2 border-rose text-rose" : "text-brown-muted"
            }`}
          >
            {t === "feed" ? "ประกาศขอรับบริจาค" : "เป็นผู้บริจาค"}
          </button>
        ))}
      </div>

      {/* ─── Tab 1: Feed ─── */}
      {tab === "feed" && (
        <div className="flex flex-col gap-3 px-5 pt-4">
          {/* Filters */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                value={filterProvince}
                onChange={(e) => setFilterProvince(e.target.value)}
                className="w-full appearance-none rounded-xl border border-black/10 bg-white py-2 pl-3 pr-7 text-[13px] text-brown"
              >
                <option value="">ทุกจังหวัด</option>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-brown-muted" />
            </div>
            <div className="relative w-[110px]">
              <select
                value={filterSpecies}
                onChange={(e) => setFilterSpecies(e.target.value)}
                className="w-full appearance-none rounded-xl border border-black/10 bg-white py-2 pl-3 pr-7 text-[13px] text-brown"
              >
                <option value="">ทุกชนิด</option>
                <option value="dog">สุนัข</option>
                <option value="cat">แมว</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-brown-muted" />
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-black/10 bg-white/60 py-12 text-center">
              <Droplet size={32} className="text-brown-muted/40" />
              <p className="font-bold text-brown">ยังไม่มีประกาศ</p>
              <p className="text-sm text-brown-muted">เป็นคนแรกที่ขอรับบริจาค</p>
              <button
                type="button"
                onClick={() => setShowRequestForm(true)}
                className="mt-1 rounded-xl bg-rose px-5 py-2.5 text-sm font-bold text-white"
              >
                ขอรับบริจาค
              </button>
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
        <div className="px-5 pt-4">
          {!activePet ? (
            <div className="rounded-2xl bg-white p-6 text-center shadow-card">
              <p className="text-brown-muted">ต้องสร้างโปรไฟล์น้องก่อน</p>
              <Link href="/onboarding" className="mt-3 inline-block rounded-xl bg-coral px-5 py-2.5 text-sm font-bold text-white">
                สร้างโปรไฟล์
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Pet header */}
              <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card">
                <div className="h-12 w-12 overflow-hidden rounded-2xl bg-cream">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={activePet.photos[0]} alt={activePet.name} className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="font-bold text-brown">{activePet.name}</p>
                  <p className="text-[12px] text-brown-muted">{activePet.species === "dog" ? "สุนัข" : "แมว"}</p>
                </div>
                {donorStatusLabel && (
                  <span className={`ml-auto text-[12px] font-bold ${donorStatusLabel.color}`}>
                    🩸 {donorStatusLabel.text}
                  </span>
                )}
              </div>

              {/* Donor status card (when registered) */}
              {donorRecord && (
                <div className="rounded-2xl border border-black/8 bg-white p-4">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-brown-muted/70">ข้อมูลผู้บริจาค</p>
                  <div className="mb-3 flex gap-4">
                    <div>
                      <p className="text-[11px] text-brown-muted">กรุ๊ปเลือด</p>
                      <p className="font-bold text-brown">{bloodTypeLabel(donorRecord.blood_type)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-brown-muted">น้ำหนัก</p>
                      <p className="font-bold text-brown">{donorRecord.weight_kg} กก.</p>
                    </div>
                    {donorRecord.last_donation_date && (
                      <div>
                        <p className="text-[11px] text-brown-muted">บริจาคล่าสุด</p>
                        <p className="font-bold text-brown">
                          {new Date(donorRecord.last_donation_date + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={toggleAvailable}
                    className={`w-full rounded-xl py-2.5 text-sm font-bold transition-colors ${
                      donorRecord.available
                        ? "bg-teal/10 text-teal-dark"
                        : "bg-cream text-brown-muted"
                    }`}
                  >
                    {donorRecord.available ? "✓ ว่างให้บริจาค" : "พักการบริจาคชั่วคราว"}
                  </button>
                </div>
              )}

              {/* Registration / Edit form */}
              <div className="rounded-2xl border border-black/8 bg-white p-4">
                <p className="mb-4 text-[13px] font-bold text-brown">
                  {donorRecord ? "แก้ไขข้อมูลผู้บริจาค" : "ลงทะเบียนเป็นผู้บริจาค"}
                </p>

                <div className="flex flex-col gap-4">
                  {/* Blood type */}
                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-brown-muted">กรุ๊ปเลือด *</label>
                    <div className="relative">
                      <select
                        value={bloodType}
                        onChange={(e) => setBloodType(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-black/10 bg-cream py-3 pl-4 pr-8 text-sm text-brown"
                      >
                        <option value="">เลือกกรุ๊ปเลือด</option>
                        {bloodTypes.map((bt) => <option key={bt.value} value={bt.value}>{bt.label}</option>)}
                      </select>
                      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brown-muted" />
                    </div>
                    {bloodType === "unknown" && (
                      <p className="mt-1 text-[11px] text-brown-muted">ตรวจกรุ๊ปเลือดได้ที่โรงพยาบาลสัตว์ใกล้บ้าน</p>
                    )}
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-brown-muted">น้ำหนัก (กก.) *</label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      placeholder="เช่น 25.5"
                      className="w-full rounded-xl border border-black/10 bg-cream px-4 py-3 text-sm text-brown placeholder:text-brown-muted/50"
                    />
                  </div>

                  {/* Indoor-only (cats only) */}
                  {activePet.species === "cat" && (
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-black/10 bg-cream px-4 py-3">
                      <div className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors ${indoorOnly ? "border-teal bg-teal" : "border-black/20"}`}>
                        {indoorOnly && <Check size={12} className="text-white" />}
                      </div>
                      <input type="checkbox" checked={indoorOnly} onChange={(e) => setIndoorOnly(e.target.checked)} className="sr-only" />
                      <span className="text-sm text-brown">น้องอยู่ในบ้านเท่านั้น (indoor-only)</span>
                    </label>
                  )}

                  {/* Last donation date */}
                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-brown-muted">วันที่บริจาคล่าสุด (ถ้ามี)</label>
                    <input
                      type="date"
                      value={lastDonationDate}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setLastDonationDate(e.target.value)}
                      className="w-full rounded-xl border border-black/10 bg-cream px-4 py-3 text-sm text-brown"
                    />
                  </div>

                  {/* Eligibility checklist */}
                  {eligibility && (
                    <div className={`rounded-xl p-3.5 ${eligibility.allPass ? "bg-teal/8" : "bg-cream"}`}>
                      <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-brown-muted/70">เกณฑ์การบริจาค</p>
                      <div className="flex flex-col gap-2">
                        {eligibility.criteria.map((c, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${c.pass ? "bg-teal" : "bg-rose/20"}`}>
                              {c.pass
                                ? <Check size={10} className="text-white" />
                                : <X size={10} className="text-rose" />}
                            </div>
                            <p className={`text-[12px] ${c.pass ? "text-brown" : "text-rose"}`}>{c.label}</p>
                          </div>
                        ))}
                      </div>
                      {eligibility.allPass && (
                        <p className="mt-2.5 text-[11px] font-bold text-teal-dark">✓ ผ่านเกณฑ์ทุกข้อ</p>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={saveDonorRecord}
                    disabled={saving || !bloodType || !weightKg}
                    className="h-12 rounded-xl bg-rose font-bold text-white transition-opacity disabled:opacity-40"
                  >
                    {saving ? "กำลังบันทึก..." : donorRecord ? "บันทึกการเปลี่ยนแปลง" : "ลงทะเบียนผู้บริจาค"}
                  </button>
                </div>
              </div>

              {/* Donor info note */}
              <div className="flex gap-2 rounded-xl bg-amber/10 p-3.5">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-dark" />
                <p className="text-[11px] leading-relaxed text-brown-muted">
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
          className="fixed bottom-[76px] right-4 z-[60] flex h-[52px] items-center gap-2 rounded-[18px] bg-rose px-5 shadow-[0_4px_20px_rgba(224,68,90,0.38)]"
        >
          <Droplet size={18} className="text-white" />
          <span className="text-[14px] font-bold text-white">ขอรับบริจาค</span>
        </button>
      )}

      {/* ─── Create Request Overlay ─── */}
      {showRequestForm && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/50" onClick={() => setShowRequestForm(false)} />
          <div
            className="fixed inset-x-0 bottom-0 z-[70] mx-auto max-w-[480px] overflow-y-auto rounded-t-[28px] bg-white pb-[env(safe-area-inset-bottom)]"
            style={{ maxHeight: "88vh" }}
          >
            <div className="sticky top-0 bg-white px-5 pb-3 pt-5">
              <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-black/10" />
              <p className="text-base font-bold text-brown">ขอรับบริจาคเลือด</p>
              <p className="mt-0.5 text-[12px] text-brown-muted">กรอกข้อมูลให้ครบเพื่อให้ผู้บริจาคติดต่อได้</p>
            </div>

            <div className="flex flex-col gap-4 px-5 pb-6">
              {/* Species */}
              <div>
                <label className="mb-2 block text-[12px] font-semibold text-brown-muted">ชนิดสัตว์ *</label>
                <div className="flex gap-2">
                  {(["dog", "cat"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { setReqSpecies(s); setReqBloodType(""); }}
                      className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition-colors ${
                        reqSpecies === s ? "border-rose bg-rose/8 text-rose" : "border-black/10 text-brown-muted"
                      }`}
                    >
                      {s === "dog" ? "🐕 สุนัข" : "🐈 แมว"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Blood type needed */}
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-brown-muted">กรุ๊ปเลือดที่ต้องการ *</label>
                <div className="relative">
                  <select
                    value={reqBloodType}
                    onChange={(e) => setReqBloodType(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-black/10 bg-cream py-3 pl-4 pr-8 text-sm text-brown"
                  >
                    <option value="">เลือกกรุ๊ปเลือด</option>
                    {reqBloodTypes.map((bt) => <option key={bt.value} value={bt.value}>{bt.label}</option>)}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brown-muted" />
                </div>
              </div>

              {/* Urgency */}
              <div>
                <label className="mb-2 block text-[12px] font-semibold text-brown-muted">ความเร่งด่วน *</label>
                <div className="flex gap-2">
                  {([["normal", "ทั่วไป"], ["urgent", "ด่วนมาก"]] as const).map(([v, label]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setReqUrgency(v)}
                      className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition-colors ${
                        reqUrgency === v
                          ? v === "urgent" ? "border-rose bg-rose/8 text-rose" : "border-teal bg-teal/8 text-teal-dark"
                          : "border-black/10 text-brown-muted"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hospital */}
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-brown-muted">โรงพยาบาลสัตว์ *</label>
                <input
                  type="text"
                  value={reqHospital}
                  onChange={(e) => setReqHospital(e.target.value)}
                  placeholder="เช่น โรงพยาบาลสัตว์กรุงเทพ"
                  className="w-full rounded-xl border border-black/10 bg-cream px-4 py-3 text-sm text-brown placeholder:text-brown-muted/50"
                />
              </div>

              {/* Province */}
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-brown-muted">จังหวัด *</label>
                <div className="relative">
                  <select
                    value={reqProvince}
                    onChange={(e) => setReqProvince(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-black/10 bg-cream py-3 pl-4 pr-8 text-sm text-brown"
                  >
                    <option value="">เลือกจังหวัด</option>
                    {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brown-muted" />
                </div>
              </div>

              {/* Details */}
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-brown-muted">รายละเอียดเพิ่มเติม</label>
                <textarea
                  value={reqDetails}
                  onChange={(e) => setReqDetails(e.target.value)}
                  rows={3}
                  placeholder="เช่น สายพันธุ์น้อง น้ำหนัก สถานการณ์"
                  className="w-full resize-none rounded-xl border border-black/10 bg-cream px-4 py-3 text-sm text-brown placeholder:text-brown-muted/50"
                />
              </div>

              {/* Contact */}
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-brown-muted">เบอร์ติดต่อ *</label>
                <input
                  type="text"
                  value={reqContact}
                  onChange={(e) => setReqContact(e.target.value)}
                  placeholder="08x-xxx-xxxx"
                  className="w-full rounded-xl border border-black/10 bg-cream px-4 py-3 text-sm text-brown placeholder:text-brown-muted/50"
                />
              </div>

              <button
                type="button"
                onClick={submitRequest}
                disabled={submittingReq || !reqBloodType || !reqHospital || !reqProvince || !reqContact}
                className="h-[52px] rounded-2xl bg-rose font-bold text-white transition-opacity disabled:opacity-40"
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

function Header() {
  return (
    <div className="flex h-14 shrink-0 items-center gap-1 border-b border-black/5 px-1">
      <Link href="/app/care" className="flex h-11 w-11 shrink-0 items-center justify-center text-brown">
        <ChevronLeft size={20} />
      </Link>
      <p className="font-bold text-brown">ศูนย์บริจาคเลือดสัตว์</p>
    </div>
  );
}
