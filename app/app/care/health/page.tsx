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
import { Avatar } from "@/components/ui";

const TYPE_LABEL: Record<HealthRecord["type"], string> = {
  vaccine: "วัคซีน",
  deworm: "ถ่ายพยาธิ",
  checkup: "ตรวจสุขภาพ",
  other: "อื่นๆ",
};

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

const TYPE_META: Record<
  HealthRecord["type"],
  { icon: typeof ShieldPlus; dotColor: string; iconBg: string; iconColor: string }
> = {
  // Semantic timeline colors aligned to the design tokens (coral/teal/blue/ink).
  vaccine:  { icon: ShieldPlus, dotColor: "#FF6B5B", iconBg: "#FFE9E4", iconColor: "#C13B2C" },
  deworm:   { icon: Pill,       dotColor: "#2EC4B6", iconBg: "#DCF5F2", iconColor: "#137F75" },
  checkup:  { icon: Activity,   dotColor: "#5B8DEF", iconBg: "#E5EDFC", iconColor: "#2F5FBF" },
  other:    { icon: FileText,   dotColor: "#A39D95", iconBg: "#F4EEE9", iconColor: "#6B655E" },
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

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + "T00:00:00");
  return Math.floor((due.getTime() - now.getTime()) / 86400000);
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
        <header className="flex h-14 shrink-0 items-center border-b border-line px-1">
          <div className="flex h-11 w-11 items-center justify-center">
            <ChevronLeft size={20} className="text-ink" />
          </div>
          <div className="flex-1 text-center">
            <div className="mx-auto h-5 w-28 animate-pulse rounded bg-black/10" />
          </div>
          <div className="w-11" />
        </header>
        <div className="flex flex-col gap-4 px-5 pt-4">
          {/* Pet header skeleton */}
          <div className="flex items-center gap-3.5 rounded-2xl bg-fill-1 px-3.5 py-3">
            <div className="h-16 w-16 shrink-0 animate-pulse rounded-full bg-fill-3" />
            <div className="flex flex-1 flex-col gap-2 pt-1">
              <div className="h-[17px] w-[44%] animate-pulse rounded bg-fill-3" />
              <div className="h-3 w-[62%] animate-pulse rounded bg-line" />
            </div>
            <div className="h-8 w-8 shrink-0 animate-pulse rounded-xl bg-fill-3" />
          </div>
          {/* Due section skeleton */}
          <div className="flex flex-col gap-2.5 rounded-panel border-[1.5px] border-line p-3.5">
            <div className="h-3 w-[36%] animate-pulse rounded bg-fill-3" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-3 w-[44%] animate-pulse rounded bg-fill-3" />
                <div className="h-5 w-18 animate-pulse rounded-md bg-fill-3" />
              </div>
            ))}
          </div>
          {/* Timeline skeleton */}
          <div className="flex flex-col gap-0">
            <div className="mb-2.5 flex items-center gap-2.5">
              <div className="h-3.5 w-3.5 shrink-0 animate-pulse rounded-full bg-fill-3" />
              <div className="h-2.5 w-9 animate-pulse rounded bg-fill-3" />
            </div>
            {[0, 1].map((i) => (
              <div key={i} className="mb-3.5 flex gap-2.5">
                <div className="flex w-5 shrink-0 flex-col items-center">
                  <div className="mt-[7px] h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-fill-3" />
                  <div className="min-h-8 w-[1.5px] flex-1 bg-line" />
                </div>
                <div className="flex flex-1 gap-2 pb-3.5">
                  <div className="mt-0.5 h-[30px] w-[30px] shrink-0 animate-pulse rounded-[9px] bg-fill-3" />
                  <div className="flex flex-1 flex-col gap-1.5 pt-0.5">
                    <div className="h-3 w-[62%] animate-pulse rounded bg-fill-3" />
                    <div className="h-2.5 w-[40%] animate-pulse rounded bg-line" />
                    <div className="h-3 w-[76%] animate-pulse rounded bg-line" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* FAB skeleton */}
        <div className="ml-auto mr-5 mt-auto pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-3">
          <div className="h-[52px] w-[52px] animate-pulse rounded-full bg-fill-3" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">

      {/* ── Header — back + pet avatar + name (matches Health mockup) ── */}
      <div className="flex shrink-0 items-center gap-3 border-b border-line px-[22px] pb-3.5 pt-1">
        <Link
          href="/app/care"
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl border-[1.5px] border-line bg-white text-ink transition-transform active:scale-95"
        >
          <ChevronLeft size={20} />
        </Link>
        {activePet && (
          <button
            type="button"
            onClick={() => pets.length > 1 && setSwitcherOpen(true)}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            <Avatar src={activePet.photos[0]} name={activePet.name} size={50} square />
            <div className="min-w-0 flex-1">
              <p className="text-[11.5px] font-semibold text-ink-3">สมุดสุขภาพ</p>
              <p className="truncate text-lg font-bold leading-[1.1] tracking-title text-ink">
                {activePet.name}{" "}
                <span className="text-sm font-medium text-ink-2">· {calcAge(activePet.birth_month)}</span>
              </p>
            </div>
            {pets.length > 1 && <ChevronDown size={16} className="shrink-0 text-ink-3" />}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-5 px-[22px] pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4">

        {/* ── ใกล้ถึงกำหนด ── separate colored cards per item */}
        {dueRecords.length > 0 && (
          <div>
            <div className="mb-2.5 flex items-center gap-1.5">
              <Clock size={15} className="text-ink" />
              <span className="text-base font-bold tracking-tight2 text-ink">ใกล้ถึงกำหนด</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {dueRecords.map((r) => {
                const days = daysUntil(r.next_due_date!);
                const urgent = days <= 7;
                const Meta = TYPE_META[r.type];
                const Icon = Meta.icon;
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 rounded-panel border bg-white p-3.5"
                    style={{ borderColor: urgent ? "rgba(224,68,90,.30)" : "rgba(255,184,76,.45)" }}
                  >
                    <div
                      className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl"
                      style={{ background: Meta.iconBg }}
                    >
                      <Icon size={18} style={{ color: Meta.iconColor }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14.5px] font-bold leading-tight text-ink">{r.title}</p>
                      <p className="mt-px text-[12.5px] text-ink-2">
                        ครบกำหนด {formatDateThai(r.next_due_date!)}
                      </p>
                    </div>
                    <span
                      className="shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold"
                      style={{
                        background: urgent ? "#FBE2E6" : "#FFF1DA",
                        color:      urgent ? "#B12C3F" : "#C49010",
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
            <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-blue-soft">
              <FilePlus size={38} strokeWidth={1.6} className="text-blue-ink" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight2 text-ink">ยังไม่มีบันทึกสุขภาพ</p>
              <p className="mx-auto mt-2 max-w-[240px] text-[13px] leading-[1.7] text-ink-2">
                บันทึกวัคซีน การถ่ายพยาธิ และการตรวจสุขภาพไว้ที่นี่ เพื่อรับการแจ้งเตือนอัตโนมัติ
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-1 flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-gradient-cta px-7 font-bold tracking-tight2 text-white shadow-cta transition-transform active:scale-[.98]"
            >
              <Plus size={16} strokeWidth={2.5} />
              เพิ่มบันทึกแรก
            </button>
          </div>
        ) : (
          /* Timeline */
          <div className="flex flex-col gap-1">
            {years.map((year) => {
              const yearRecords = byYear[year];
              return (
                <div key={year}>
                  {/* Year header — label + divider + count */}
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="text-[15px] font-bold tracking-tight2 text-ink">{year}</span>
                    <div className="h-px flex-1 bg-line" />
                    <span className="text-xs font-semibold text-ink-3">{yearRecords.length} รายการ</span>
                  </div>

                  {/* Entries */}
                  {yearRecords.map((r) => {
                    const isLast = entryIndex === totalEntries - 1;
                    entryIndex++;
                    const Meta = TYPE_META[r.type];
                    const Icon = Meta.icon;

                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleOpenEdit(r)}
                        className="flex w-full items-stretch gap-3 text-left"
                      >
                        {/* Type icon + connector line */}
                        <div className="flex flex-col items-center">
                          <div
                            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl"
                            style={{ background: Meta.iconBg }}
                          >
                            <Icon size={18} style={{ color: Meta.iconColor }} />
                          </div>
                          {!isLast && <div className="min-h-3 w-[1.5px] flex-1 bg-line" />}
                        </div>

                        {/* Entry card */}
                        <div className="min-w-0 flex-1 pb-5">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="truncate text-[15px] font-bold leading-tight tracking-tight2 text-ink">
                              {r.title}
                            </span>
                            <span className="shrink-0 text-xs font-semibold text-ink-3">
                              {formatDateThai(r.record_date)}
                            </span>
                          </div>
                          <span
                            className="mt-1.5 inline-flex rounded-md px-2 py-[2px] text-[11px] font-semibold"
                            style={{ background: Meta.iconBg, color: Meta.iconColor }}
                          >
                            {TYPE_LABEL[r.type]}
                          </span>
                          {r.notes && (
                            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{r.notes}</p>
                          )}
                          {r.next_due_date && (
                            <div className="mt-2 inline-flex items-center gap-1 rounded-[9px] bg-fill-2 px-2.5 py-1 text-[11.5px] font-semibold text-ink-2">
                              <Clock size={11} />
                              ครั้งถัดไป {formatDateThai(r.next_due_date)}
                            </div>
                          )}
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
          className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-5 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-gradient-cta text-white shadow-cta transition-transform active:scale-95"
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}

      {/* ── Pet Switcher Sheet ── */}
      {switcherOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black/50">
          <div className="flex-1" onClick={() => setSwitcherOpen(false)} />
          <div className="mx-auto flex w-full max-w-[480px] flex-col rounded-t-card bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <p className="mb-3 font-bold text-ink">สลับน้อง</p>
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
                  <span className="font-bold text-ink">{pet.name}</span>
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
