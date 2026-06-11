"use client";

import { useState } from "react";
import { Dog, Cat, ChevronDown } from "lucide-react";
import { DOG_BREEDS, CAT_BREEDS } from "@/lib/data/breeds";

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
  "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
  "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 20 }, (_, i) => currentYear - i);

function calcAge(year: number, month: number): string {
  if (!year || !month) return "";
  const now = new Date();
  const totalMonths =
    (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month);
  if (totalMonths <= 0) return "";
  if (totalMonths < 12) return `${totalMonths} เดือน`;
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  return m > 0 ? `${y} ปี ${m} เดือน` : `${y} ปี`;
}

interface Props {
  species: "dog" | "cat" | "";
  breed: string;
  sex: "male" | "female" | "";
  birthYear: number;
  birthMonthNum: number;
  onChange: (data: {
    species?: "dog" | "cat" | "";
    breed?: string;
    sex?: "male" | "female" | "";
    birthYear?: number;
    birthMonthNum?: number;
  }) => void;
}

const selectClass =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm " +
  "focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30 appearance-none";

export default function Step2Basic({
  species, breed, sex, birthYear, birthMonthNum, onChange,
}: Props) {
  const [breedQuery, setBreedQuery] = useState(breed);
  const [breedOpen, setBreedOpen] = useState(false);

  const breedList = species === "dog" ? DOG_BREEDS : species === "cat" ? CAT_BREEDS : [];
  const filtered = breedList.filter((b) =>
    b.toLowerCase().includes(breedQuery.toLowerCase())
  );

  function selectSpecies(s: "dog" | "cat") {
    // Reset breed when species changes
    onChange({ species: s, breed: "" });
    setBreedQuery("");
  }

  function selectBreed(b: string) {
    onChange({ breed: b });
    setBreedQuery(b);
    setBreedOpen(false);
  }

  const age = calcAge(birthYear, birthMonthNum);

  return (
    <div className="flex flex-col gap-5">
      {/* Species */}
      <div>
        <p className="mb-2 text-sm font-bold text-brown">น้องเป็น…</p>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { value: "dog", label: "หมา", icon: Dog },
              { value: "cat", label: "แมว", icon: Cat },
            ] as const
          ).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => selectSpecies(value)}
              className={`flex flex-col items-center gap-2 rounded-card border-2 py-5 font-bold transition-all ${
                species === value
                  ? "border-coral bg-coral/10 text-coral"
                  : "border-black/10 bg-white text-brown-muted hover:border-coral/40"
              }`}
            >
              <Icon size={32} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Breed searchable select */}
      {species && (
        <div className="relative">
          <p className="mb-2 text-sm font-bold text-brown">สายพันธุ์</p>
          <div className="relative">
            <input
              type="text"
              value={breedQuery}
              onFocus={() => setBreedOpen(true)}
              onChange={(e) => {
                setBreedQuery(e.target.value);
                onChange({ breed: "" });
                setBreedOpen(true);
              }}
              placeholder="พิมพ์เพื่อค้นหา..."
              className={selectClass + " pr-10"}
            />
            <ChevronDown
              size={18}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brown-muted"
            />
          </div>
          {breedOpen && filtered.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-black/10 bg-white shadow-card">
              {filtered.map((b) => (
                <li key={b}>
                  <button
                    type="button"
                    onMouseDown={() => selectBreed(b)}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-cream"
                  >
                    {b}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {breedOpen && (
            // Invisible overlay to close dropdown on outside click
            <div
              className="fixed inset-0 z-10"
              onClick={() => setBreedOpen(false)}
            />
          )}
        </div>
      )}

      {/* Sex */}
      <div>
        <p className="mb-2 text-sm font-bold text-brown">เพศ</p>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { value: "male", label: "ผู้" },
              { value: "female", label: "เมีย" },
            ] as const
          ).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ sex: value })}
              className={`rounded-full border-2 py-3 font-bold transition-all ${
                sex === value
                  ? "border-coral bg-coral text-white"
                  : "border-black/10 bg-white text-brown-muted hover:border-coral/40"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Birth month + year */}
      <div>
        <p className="mb-2 text-sm font-bold text-brown">
          เดือน/ปีเกิด{age && <span className="ml-2 font-normal text-brown-muted">อายุ {age}</span>}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <select
              value={birthMonthNum}
              onChange={(e) => onChange({ birthMonthNum: Number(e.target.value) })}
              className={selectClass + " pr-10"}
            >
              <option value={0}>เดือน</option>
              {THAI_MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brown-muted" />
          </div>
          <div className="relative">
            <select
              value={birthYear}
              onChange={(e) => onChange({ birthYear: Number(e.target.value) })}
              className={selectClass + " pr-10"}
            >
              <option value={0}>ปี</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>{y + 543} ({y})</option>
              ))}
            </select>
            <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brown-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
