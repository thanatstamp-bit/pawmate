"use client";

import { Users, Heart, AlertTriangle } from "lucide-react";

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
      <p className="mb-2 text-sm font-bold text-brown">{label}</p>
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
            className={`rounded-full border-2 py-2.5 text-sm font-bold transition-all ${
              value === v
                ? "border-teal bg-teal text-white"
                : "border-black/10 bg-white text-brown-muted hover:border-teal/40"
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
      <p className="text-sm text-brown-muted">เลือกได้มากกว่า 1 โหมด</p>

      {/* Mode cards */}
      <div className="flex flex-col gap-3">
        {/* Playdate */}
        <button
          type="button"
          onClick={() => toggleMode("playdate")}
          className={`flex items-start gap-4 rounded-card border-2 p-4 text-left transition-all ${
            modes.includes("playdate")
              ? "border-teal bg-teal/10"
              : "border-black/10 bg-white hover:border-teal/40"
          }`}
        >
          <div
            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              modes.includes("playdate") ? "bg-teal text-white" : "bg-black/5 text-brown-muted"
            }`}
          >
            <Users size={20} />
          </div>
          <div>
            <p className="font-bold text-brown">หาเพื่อนเล่น</p>
            <p className="text-sm text-brown-muted">
              หาน้องหมา/แมวแถวบ้านมาเป็นเพื่อนเล่น นัดเจอกัน ออกกำลังกายด้วยกัน
            </p>
          </div>
        </button>

        {/* Breeding */}
        <button
          type="button"
          onClick={() => toggleMode("breeding")}
          className={`flex items-start gap-4 rounded-card border-2 p-4 text-left transition-all ${
            breedingOn
              ? "border-amber bg-amber/10"
              : "border-black/10 bg-white hover:border-amber/40"
          }`}
        >
          <div
            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              breedingOn ? "bg-amber text-white" : "bg-black/5 text-brown-muted"
            }`}
          >
            <Heart size={20} />
          </div>
          <div>
            <p className="font-bold text-brown">หาคู่ผสมพันธุ์</p>
            <p className="text-sm text-brown-muted">
              หาคู่สายพันธุ์เดียวกัน เพื่อให้ได้ลูกที่สุขภาพดีและมีสายพันธุ์แท้
            </p>
          </div>
        </button>
      </div>

      {/* Breeding extra fields */}
      {breedingOn && (
        <div className="flex flex-col gap-4 rounded-card bg-amber/5 p-4">
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
            <div className="flex items-start gap-2 rounded-xl bg-amber/20 px-3 py-2.5 text-sm text-amber-dark">
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
