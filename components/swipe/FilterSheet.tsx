"use client";

import { useState } from "react";
import { X, ChevronDown, Check } from "lucide-react";
import { PROVINCES } from "@/lib/data/provinces";
import { PERSONALITY_TAGS } from "@/lib/data/tags";
import { DOG_BREEDS, CAT_BREEDS } from "@/lib/data/breeds";

export type SwipeFilters = {
  province: string;
  breed: string;
  size: string;     // '' | 'small' | 'medium' | 'large'
  ageMin: number;   // 0 = no min, in years
  ageMax: number;   // 0 = no max, in years
  tags: string[];
  vaccinated: boolean;
  neutered: boolean;
};

export const DEFAULT_FILTERS: SwipeFilters = {
  province: "",
  breed: "",
  size: "",
  ageMin: 0,
  ageMax: 0,
  tags: [],
  vaccinated: false,
  neutered: false,
};

export function countActiveFilters(f: SwipeFilters): number {
  return [
    !!f.province,
    !!f.breed,
    !!f.size,
    f.ageMin > 0 || f.ageMax > 0,
    f.tags.length > 0,
    f.vaccinated,
    f.neutered,
  ].filter(Boolean).length;
}

interface Props {
  filters: SwipeFilters;
  onChange: (f: SwipeFilters) => void;
  onClose: () => void;
  mode: "playdate" | "breeding";
  species: "dog" | "cat";
}

const SELECT_CLS =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm " +
  "focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30 appearance-none";

const SIZE_OPTIONS = [
  { value: "small", label: "เล็ก" },
  { value: "medium", label: "กลาง" },
  { value: "large", label: "ใหญ่" },
];

const AGE_YEARS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function FilterSheet({ filters, onChange, onClose, mode, species }: Props) {
  const [draft, setDraft] = useState<SwipeFilters>(filters);

  const breeds = species === "dog" ? DOG_BREEDS : CAT_BREEDS;
  const hasActive = countActiveFilters(draft) > 0;

  function toggleTag(tag: string) {
    setDraft((d) => ({
      ...d,
      tags: d.tags.includes(tag) ? d.tags.filter((t) => t !== tag) : [...d.tags, tag],
    }));
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/50">
      <div className="flex-1" onClick={onClose} />

      <div
        className="mx-auto flex w-full max-w-[480px] flex-col rounded-t-[28px] bg-white"
        style={{ maxHeight: "88vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/5 px-6 pb-4 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 hover:bg-cream"
          >
            <X size={20} />
          </button>
          <h2 className="text-base font-bold text-brown">ตัวกรอง</h2>
          <button
            type="button"
            onClick={() => setDraft(DEFAULT_FILTERS)}
            className={`text-sm font-semibold transition-colors ${
              hasActive ? "text-coral" : "text-brown-muted"
            }`}
          >
            รีเซ็ต
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-6">

            {/* ── Province ── */}
            <div>
              <p className="mb-2 text-sm font-bold text-brown">จังหวัด</p>
              <div className="relative">
                <select
                  value={draft.province}
                  onChange={(e) => setDraft((d) => ({ ...d, province: e.target.value }))}
                  className={SELECT_CLS + " pr-10"}
                >
                  <option value="">ทุกจังหวัด</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brown-muted"
                />
              </div>
            </div>

            {/* ── Breed (hidden in breeding mode — already fixed by own pet's breed) ── */}
            {mode !== "breeding" && (
              <div>
                <p className="mb-2 text-sm font-bold text-brown">สายพันธุ์</p>
                <div className="relative">
                  <select
                    value={draft.breed}
                    onChange={(e) => setDraft((d) => ({ ...d, breed: e.target.value }))}
                    className={SELECT_CLS + " pr-10"}
                  >
                    <option value="">ทุกสายพันธุ์</option>
                    {breeds.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brown-muted"
                  />
                </div>
              </div>
            )}

            {/* ── Size ── */}
            <div>
              <p className="mb-2 text-sm font-bold text-brown">ขนาด</p>
              <div className="flex gap-2">
                {SIZE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        size: d.size === opt.value ? "" : opt.value,
                      }))
                    }
                    className={`flex-1 rounded-full border-2 py-2.5 text-sm font-bold transition-all ${
                      draft.size === opt.value
                        ? "border-coral bg-coral text-white"
                        : "border-black/10 text-brown-muted hover:border-coral/40"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Age range ── */}
            <div>
              <p className="mb-2 text-sm font-bold text-brown">อายุ (ปี)</p>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <select
                    value={draft.ageMin}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, ageMin: Number(e.target.value) }))
                    }
                    className={SELECT_CLS + " pr-8"}
                  >
                    <option value={0}>ตั้งแต่</option>
                    {AGE_YEARS.map((n) => (
                      <option key={n} value={n}>{n} ปี</option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-brown-muted"
                  />
                </div>
                <span className="text-sm font-medium text-brown-muted">–</span>
                <div className="relative flex-1">
                  <select
                    value={draft.ageMax}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, ageMax: Number(e.target.value) }))
                    }
                    className={SELECT_CLS + " pr-8"}
                  >
                    <option value={0}>ถึง</option>
                    {AGE_YEARS.map((n) => (
                      <option key={n} value={n}>{n} ปี</option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-brown-muted"
                  />
                </div>
              </div>
            </div>

            {/* ── Personality tags ── */}
            <div>
              <p className="mb-2 text-sm font-bold text-brown">นิสัย</p>
              <div className="flex flex-wrap gap-2">
                {PERSONALITY_TAGS.map((tag) => {
                  const active = draft.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-all ${
                        active
                          ? "border-teal bg-teal text-white"
                          : "border-black/10 text-brown-muted hover:border-teal/40"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Health certificates ── */}
            <div className="pb-2">
              <p className="mb-2 text-sm font-bold text-brown">ใบรับรองสุขภาพ</p>
              <div className="flex flex-col gap-2">
                {(
                  [
                    { key: "vaccinated", label: "ฉีดวัคซีนแล้ว" },
                    { key: "neutered", label: "ทำหมันแล้ว" },
                  ] as const
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, [key]: !d[key] }))}
                    className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                      draft[key]
                        ? "border-teal bg-teal/10 text-teal-dark"
                        : "border-black/10 text-brown-muted hover:border-teal/40"
                    }`}
                  >
                    <div
                      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                        draft[key] ? "border-teal bg-teal" : "border-current"
                      }`}
                    >
                      {draft[key] && <Check size={11} className="text-white" strokeWidth={3} />}
                    </div>
                    {label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-black/5 px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4">
          <button
            type="button"
            onClick={() => onChange(draft)}
            className="w-full rounded-full bg-coral py-3 font-bold text-white hover:bg-coral-dark"
          >
            ดูผลลัพธ์
          </button>
        </div>
      </div>
    </div>
  );
}
