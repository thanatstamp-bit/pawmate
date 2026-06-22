"use client";

import { Users, Heart, AlertTriangle, CheckCircle2 } from "lucide-react";

interface Props {
  modes: ("playdate" | "breeding")[];
  vaccinated: boolean | null;
  neutered: boolean | null;
  onChange: (data: {
    modes?: ("playdate" | "breeding")[];
    vaccinated?: boolean | null;
    neutered?: boolean | null;
  }) => void;
}

function YesNoToggle({
  label,
  value,
  onSelect,
}: {
  label: string;
  value: boolean | null;
  onSelect: (v: boolean) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-ink">{label}</p>
      <div className="grid grid-cols-2 gap-3">
        {(
          [
            { v: true, label: "ใช่" },
            { v: false, label: "ยังไม่ได้" },
          ] as const
        ).map(({ v, label: l }) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => onSelect(v)}
            className={`rounded-2xl border-2 py-2.5 text-sm font-bold transition-all ${
              value === v
                ? "border-teal bg-teal text-white"
                : "border-black/10 bg-white text-ink-2 hover:border-teal/40"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Step4Modes({ modes, vaccinated, neutered, onChange }: Props) {
  function toggleMode(mode: "playdate" | "breeding") {
    const has = modes.includes(mode);
    if (has && modes.length === 1) return; // must keep at least one
    const next = has ? modes.filter((m) => m !== mode) : [...modes, mode];
    onChange({ modes: next });
  }

  const breedingOn = modes.includes("breeding");
  const showNeuteredWarning = breedingOn && neutered === true;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-ink-2">เลือกได้มากกว่า 1 โหมด</p>

      {/* Mode cards */}
      <div className="flex flex-col gap-3">
        {/* Playdate */}
        <button
          type="button"
          onClick={() => toggleMode("playdate")}
          className={`relative flex items-start gap-4 rounded-card border-2 p-4 text-left transition-all ${
            modes.includes("playdate")
              ? "border-teal bg-teal-soft shadow-card"
              : "border-black/10 bg-white hover:border-teal/40"
          }`}
        >
          <div
            className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-chip ${
              modes.includes("playdate") ? "bg-teal text-white" : "bg-fill-2 text-ink-3"
            }`}
          >
            <Users size={20} />
          </div>
          <div className="pr-7">
            <p className="font-bold tracking-tight2 text-ink">หาเพื่อนเล่น</p>
            <p className="text-sm text-ink-2">
              หาน้องหมา/แมวแถวบ้านมาเป็นเพื่อนเล่น นัดเจอกัน ออกกำลังกายด้วยกัน
            </p>
          </div>
          {modes.includes("playdate") && (
            <CheckCircle2 size={22} className="absolute right-3.5 top-3.5 text-teal" fill="white" />
          )}
        </button>

        {/* Breeding */}
        <button
          type="button"
          onClick={() => toggleMode("breeding")}
          className={`relative flex items-start gap-4 rounded-card border-2 p-4 text-left transition-all ${
            breedingOn
              ? "border-amber bg-amber-soft shadow-card"
              : "border-black/10 bg-white hover:border-amber/40"
          }`}
        >
          <div
            className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-chip ${
              breedingOn ? "bg-amber text-white" : "bg-fill-2 text-ink-3"
            }`}
          >
            <Heart size={20} />
          </div>
          <div className="pr-7">
            <p className="font-bold tracking-tight2 text-ink">หาคู่ผสมพันธุ์</p>
            <p className="text-sm text-ink-2">
              หาคู่สายพันธุ์เดียวกัน เพื่อให้ได้ลูกที่สุขภาพดีและมีสายพันธุ์แท้
            </p>
          </div>
          {breedingOn && (
            <CheckCircle2 size={22} className="absolute right-3.5 top-3.5 text-amber-deep" fill="white" />
          )}
        </button>
      </div>

      {/* Breeding extra fields */}
      {breedingOn && (
        <div className="flex flex-col gap-4 rounded-card bg-amber-soft p-4">
          <YesNoToggle
            label="ฉีดวัคซีนครบแล้ว?"
            value={vaccinated}
            onSelect={(v) => onChange({ vaccinated: v })}
          />
          <YesNoToggle
            label="ทำหมันแล้ว?"
            value={neutered}
            onSelect={(v) => onChange({ neutered: v })}
          />
          {showNeuteredWarning && (
            <div className="flex items-start gap-2 rounded-2xl bg-amber/20 px-3 py-2.5 text-sm text-amber-deep">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <p>
                น้องที่ทำหมันแล้วอาจผสมพันธุ์ไม่ได้ ตรวจสอบกับสัตวแพทย์ก่อนนัดเจอกันนะ
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
