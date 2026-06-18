"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronDown,
  Plus,
  Clock,
  ShieldPlus,
  Pill,
  Activity,
  FileText,
  FilePlus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import HealthRecordForm, { type HealthRecord } from "@/components/care/HealthRecordForm";

// ─── Types ────────────────────────────────────────────────────────────────────

type Pet = {
  id: string;
  name: string;
  species: string;
  breed: string;
  birth_month: string;
  photos: string[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SPECIES_LABEL: Record<string, string> = { dog: "สุนัข", cat: "แมว" };

const TYPE_META: Record<
  HealthRecord["type"],
  { icon: typeof ShieldPlus; dotColor: string; iconBg: string; iconColor: string }
> = {
  vaccine:  { icon: ShieldPlus, dotColor: "#FF6B5B", iconBg: "rgba(255,107,91,0.09)",   iconColor: "#FF6B5B" },
  deworm:   { icon: Pill,       dotColor: "#1A8A6A", iconBg: "rgba(26,138,106,0.09)",   iconColor: "#1A8A6A" },
  checkup:  { icon: Activity,   dotColor: "#5A8FD4", iconBg: "rgba(90,143,212,0.10)",   iconColor: "#5A8FD4" },
  other:    { icon: FileText,   dotColor: "#B5B0AA", iconBg: "#F5F3F0",                 iconColor: "#8A8580" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcAge(birthMonth: string): string {
  const birth = new Date(birthMonth);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (months < 12) return `${months} เดือน`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y} ปี ${m} เดือน` : `${y} ปี`;
}

function formatDateThai(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function shortMonthThai(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("th-TH", {
    month: "short",
    year: "2-digit",
  });
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + "T00:00:00");
  return Math.floor((due.getTime() - now.getTime()) / 86400000);
}

function nextDueChip(
  nextDueDate: string
): { label: string; bg: string; color: string } | null {
  const days = daysUntil(nextDueDate);
  const month = shortMonthThai(nextDueDate);
  const label = `ครั้งต่อไป ${month}`;

  if (days < 0)
    return { label: `เลยกำหนด ${Math.abs(days)} วัน`, bg: "rgba(155,34,34,0.11)", color: "#8B1A1A" };
  if (days <= 7)
    return { label, bg: "rgba(155,34,34,0.11)", color: "#8B1A1A" };
  if (days <= 30)
    return { label, bg: "rgba(168,112,24,0.12)", color: "#A06820" };
  return { label, bg: "rgba(26,138,106,0.11)", color: "#146A52" };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HealthPage() {
  const supabase = createClient();

  const [pets, setPets] = useState<Pet[]>([]);
  const [activePetId, setActivePetId] = useState<string | null>(null);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<HealthRecord | undefined>(undefined);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const loadRecords = useCallback(
    async (petId: string) => {
      const { data } = await supabase
        .from("health_records")
        .select("*")
        .eq("pet_id", petId)
        .order("record_date", { ascending: false });
      setRecords((data as HealthRecord[]) ?? []);
    },
    [supabase]
  );

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: petsData } = await supabase
        .from("pets")
        .select("id, name, species, breed, birth_month, photos")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true });

      if (!petsData || petsData.length === 0) { setLoading(false); return; }
      setPets(petsData);

      const storedId = localStorage.getItem("pawmate_active_pet_id");
      const resolved =
        storedId && petsData.some((p) => p.id === storedId) ? storedId : petsData[0].id;
      setActivePetId(resolved);
      localStorage.setItem("pawmate_active_pet_id", resolved);

      await loadRecords(resolved);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSwitchPet(petId: string) {
    setActivePetId(petId);
    localStorage.setItem("pawmate_active_pet_id", petId);
    setSwitcherOpen(false);
    await loadRecords(petId);
  }

  function handleOpenAdd() {
    setEditRecord(undefined);
    setShowForm(true);
  }

  function handleOpenEdit(record: HealthRecord) {
    setEditRecord(record);
    setShowForm(true);
  }

  async function handleFormSave() {
    setShowForm(false);
    if (activePetId) await loadRecords(activePetId);
  }

  // ── Derived ──
  const activePet = pets.find((p) => p.id === activePetId) ?? pets[0] ?? null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in30 = new Date(today);
  in30.setDate(in30.getDate() + 30);

  const dueRecords = records.filter((r) => {
    if (!r.next_due_date) return false;
    const d = new Date(r.next_due_date + "T00:00:00");
    return d >= today && d <= in30;
  });

  // Group by year, newest first
  const byYear = records.reduce<Record<number, HealthRecord[]>>((acc, r) => {
    const y = new Date(r.record_date + "T00:00:00").getFullYear();
    if (!acc[y]) acc[y] = [];
    acc[y].push(r);
    return acc;
  }, {});
  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);

  // Flat list for "is last entry?" check
  const totalEntries = records.length;
  let entryIndex = 0;

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="flex h-14 shrink-0 items-center border-b border-black/5 px-1">
          <div className="flex h-11 w-11 items-center justify-center">
            <ChevronLeft size={20} className="text-brown" />
          </div>
          <div className="flex-1 text-center">
            <div className="mx-auto h-5 w-28 animate-pulse rounded bg-black/10" />
          </div>
          <div className="w-11" />
        </header>
        <div className="flex flex-col gap-4 px-5 pt-4">
          {/* Pet header skeleton */}
          <div className="flex items-center gap-3.5 rounded-2xl bg-[#F5F3F0] px-3.5 py-3">
            <div className="h-16 w-16 shrink-0 animate-pulse rounded-full bg-[#E5E2DE]" />
            <div className="flex flex-1 flex-col gap-2 pt-1">
              <div className="h-[17px] w-[44%] animate-pulse rounded bg-[#E5E2DE]" />
              <div className="h-3 w-[62%] animate-pulse rounded bg-[#EDEAE6]" />
            </div>
            <div className="h-8 w-8 shrink-0 animate-pulse rounded-xl bg-[#E5E2DE]" />
          </div>
          {/* Due section skeleton */}
          <div className="flex flex-col gap-2.5 rounded-[14px] border-[1.5px] border-[#EDEAE6] p-3.5">
            <div className="h-3 w-[36%] animate-pulse rounded bg-[#E5E2DE]" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-3 w-[44%] animate-pulse rounded bg-[#E5E2DE]" />
                <div className="h-5 w-18 animate-pulse rounded-md bg-[#E5E2DE]" />
              </div>
            ))}
          </div>
          {/* Timeline skeleton */}
          <div className="flex flex-col gap-0">
            <div className="mb-2.5 flex items-center gap-2.5">
              <div className="h-3.5 w-3.5 shrink-0 animate-pulse rounded-full bg-[#E5E2DE]" />
              <div className="h-2.5 w-9 animate-pulse rounded bg-[#E5E2DE]" />
            </div>
            {[0, 1].map((i) => (
              <div key={i} className="mb-3.5 flex gap-2.5">
                <div className="flex w-5 shrink-0 flex-col items-center">
                  <div className="mt-[7px] h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-[#E5E2DE]" />
                  <div className="min-h-8 w-[1.5px] flex-1 bg-[#EDEAE6]" />
                </div>
                <div className="flex flex-1 gap-2 pb-3.5">
                  <div className="mt-0.5 h-[30px] w-[30px] shrink-0 animate-pulse rounded-[9px] bg-[#E5E2DE]" />
                  <div className="flex flex-1 flex-col gap-1.5 pt-0.5">
                    <div className="h-3 w-[62%] animate-pulse rounded bg-[#E5E2DE]" />
                    <div className="h-2.5 w-[40%] animate-pulse rounded bg-[#EDEAE6]" />
                    <div className="h-3 w-[76%] animate-pulse rounded bg-[#EDEAE6]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* FAB skeleton */}
        <div className="ml-auto mr-5 mt-auto pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-3">
          <div className="h-[52px] w-[52px] animate-pulse rounded-full bg-[#E5E2DE]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">

      {/* ── Header ── */}
      <header className="flex h-14 shrink-0 items-center border-b border-black/5 px-1">
        <Link
          href="/app/care"
          className="flex h-11 w-11 shrink-0 items-center justify-center text-brown"
        >
          <ChevronLeft size={20} />
        </Link>
        <p className="flex-1 text-center text-base font-bold text-brown">สมุดสุขภาพ</p>
        {/* share icon — visual only */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center text-brown-muted">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </div>
      </header>

      <div className="flex flex-col gap-3.5 px-5 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4">

        {/* ── Pet Header ── */}
        {activePet && (
          <button
            type="button"
            onClick={() => pets.length > 1 && setSwitcherOpen(true)}
            className="flex w-full items-center gap-3.5 rounded-2xl bg-[#F5F3F0] px-3.5 py-3 text-left"
          >
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-[#D5D1CC] bg-cream">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={activePet.photos[0]} alt={activePet.name} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold text-brown">{activePet.name}</p>
              <p className="mt-0.5 text-xs text-brown-muted">
                {SPECIES_LABEL[activePet.species] ?? activePet.species} · {activePet.breed} · {calcAge(activePet.birth_month)}
              </p>
            </div>
            {pets.length > 1 && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-[#EDEAE6] bg-white">
                <ChevronDown size={14} className="text-brown-muted" />
              </div>
            )}
          </button>
        )}

        {/* ── ใกล้ถึงกำหนด ── */}
        {dueRecords.length > 0 && (
          <div
            className="rounded-[14px] p-3.5"
            style={{ background: "rgba(155,34,34,0.03)", border: "1.5px solid rgba(155,34,34,0.18)" }}
          >
            <div className="mb-2.5 flex items-center gap-1.5">
              <Clock size={13} style={{ color: "#8B1A1A" }} />
              <span className="text-xs font-bold" style={{ color: "#8B1A1A" }}>ใกล้ถึงกำหนด</span>
            </div>
            <div className="flex flex-col gap-2">
              {dueRecords.map((r) => {
                const days = daysUntil(r.next_due_date!);
                const urgent = days <= 7;
                const Meta = TYPE_META[r.type];
                const Icon = Meta.icon;
                return (
                  <div key={r.id} className="flex items-center gap-2">
                    <div
                      className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px]"
                      style={{ background: Meta.iconBg }}
                    >
                      <Icon size={11} style={{ color: Meta.iconColor }} />
                    </div>
                    <span className="flex-1 text-xs font-medium text-brown">{r.title}</span>
                    <span
                      className="shrink-0 rounded-[6px] px-2 py-0.5 text-[11px] font-bold"
                      style={{
                        background: urgent ? "rgba(155,34,34,0.12)" : "rgba(168,112,24,0.12)",
                        color:      urgent ? "#8B1A1A"              : "#A06820",
                      }}
                    >
                      {days === 0 ? "วันนี้" : `อีก ${days} วัน`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Timeline / Empty ── */}
        {records.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center gap-3.5 py-8 text-center">
            <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[#F5F3F0]">
              <FilePlus size={38} strokeWidth={1.6} className="text-[#D5D1CC]" />
            </div>
            <div>
              <p className="text-base font-bold text-brown">ยังไม่มีบันทึกสุขภาพ</p>
              <p className="mx-auto mt-2 max-w-[240px] text-[13px] leading-[1.7] text-brown-muted">
                บันทึกวัคซีน การถ่ายพยาธิ และการตรวจสุขภาพไว้ที่นี่ เพื่อรับการแจ้งเตือนอัตโนมัติ
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-1 flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-coral px-7 font-bold text-white shadow-[0_4px_14px_rgba(255,107,91,0.30)]"
            >
              <Plus size={16} strokeWidth={2.5} />
              เพิ่มบันทึกแรก
            </button>
          </div>
        ) : (
          /* Timeline */
          <div className="flex flex-col">
            {years.map((year) => {
              const yearRecords = byYear[year];
              return (
                <div key={year}>
                  {/* Year node */}
                  <div className="mb-0.5 flex items-start gap-2.5">
                    <div className="flex w-5 shrink-0 flex-col items-center">
                      <div
                        className="h-3.5 w-3.5 shrink-0 rounded-full"
                        style={{ background: "#F5F3F0", border: "1.5px solid #EDEAE6" }}
                      />
                      <div className="min-h-2 w-[1.5px] flex-1 bg-[#EDEAE6]" />
                    </div>
                    <span className="pt-px text-[11px] font-bold tracking-widest text-brown-muted">
                      {year}
                    </span>
                  </div>

                  {/* Entries */}
                  {yearRecords.map((r) => {
                    const isLast = entryIndex === totalEntries - 1;
                    entryIndex++;
                    const Meta = TYPE_META[r.type];
                    const Icon = Meta.icon;
                    const chip = r.next_due_date ? nextDueChip(r.next_due_date) : null;

                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleOpenEdit(r)}
                        className="flex w-full items-start gap-2.5 text-left"
                      >
                        {/* Dot + vertical line */}
                        <div className="flex w-5 shrink-0 flex-col items-center">
                          <div
                            className="mt-[7px] h-2.5 w-2.5 shrink-0 rounded-full bg-white"
                            style={{ border: `2px solid ${Meta.dotColor}` }}
                          />
                          {!isLast && (
                            <div className="min-h-3 w-[1.5px] flex-1 bg-[#EDEAE6]" />
                          )}
                        </div>

                        {/* Entry card */}
                        <div className="flex flex-1 items-start gap-2 pb-3.5">
                          {/* Type icon */}
                          <div
                            className="mt-px flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px]"
                            style={{ background: Meta.iconBg }}
                          >
                            <Icon size={14} style={{ color: Meta.iconColor }} />
                          </div>

                          {/* Text */}
                          <div className="min-w-0 flex-1">
                            <div className="mb-[3px] flex items-start justify-between gap-1.5">
                              <span className="text-[13px] font-bold leading-[1.3] text-brown">
                                {r.title}
                              </span>
                              {chip && (
                                <span
                                  className="shrink-0 rounded-[6px] px-1.5 py-[2px] text-[10px] font-semibold"
                                  style={{ background: chip.bg, color: chip.color }}
                                >
                                  {chip.label}
                                </span>
                              )}
                            </div>
                            <span className="block text-[11px] text-[#B5B0AA]">
                              {formatDateThai(r.record_date)}
                            </span>
                            {r.notes && (
                              <span className="mt-[3px] block text-xs text-[#5A5650]">{r.notes}</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FAB ── */}
      {records.length > 0 && (
        <button
          type="button"
          onClick={handleOpenAdd}
          className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-5 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-coral text-white"
          style={{ boxShadow: "0 4px 16px rgba(255,107,91,0.36)" }}
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}

      {/* ── Pet Switcher Sheet ── */}
      {switcherOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black/50">
          <div className="flex-1" onClick={() => setSwitcherOpen(false)} />
          <div className="mx-auto flex w-full max-w-[480px] flex-col rounded-t-[28px] bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <p className="mb-3 font-bold text-brown">สลับน้อง</p>
            <div className="flex flex-col gap-2">
              {pets.map((pet) => (
                <button
                  key={pet.id}
                  type="button"
                  onClick={() => handleSwitchPet(pet.id)}
                  className={`flex items-center gap-3 rounded-2xl p-2.5 text-left transition-colors ${
                    pet.id === activePetId ? "bg-coral/10" : "hover:bg-cream"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pet.photos[0]} alt={pet.name} className="h-12 w-12 rounded-xl object-cover" />
                  <span className="font-bold text-brown">{pet.name}</span>
                  {pet.id === activePetId && (
                    <span className="ml-auto rounded-full bg-coral/15 px-2 py-0.5 text-[10px] font-bold text-coral">
                      กำลังใช้อยู่
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Form Sheet ── */}
      {showForm && activePet && (
        <HealthRecordForm
          petId={activePet.id}
          record={editRecord}
          onClose={() => setShowForm(false)}
          onSave={handleFormSave}
        />
      )}
    </div>
  );
}
