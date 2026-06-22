"use client";

import { ChevronDown } from "lucide-react";
import { PERSONALITY_TAGS } from "@/lib/data/tags";
import { PROVINCES } from "@/lib/data/provinces";

interface Props {
  personalityTags: string[];
  province: string;
  district: string;
  bio: string;
  onChange: (data: {
    personalityTags?: string[];
    province?: string;
    district?: string;
    bio?: string;
  }) => void;
}

const inputClass =
  "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-ink " +
  "placeholder:text-ink-3 focus:border-coral focus:outline-none " +
  "focus:ring-2 focus:ring-coral/30";

const selectClass =
  "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-ink " +
  "focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30 appearance-none";

export default function Step3Personality({
  personalityTags, province, district, bio, onChange,
}: Props) {
  function toggleTag(tag: string) {
    const next = personalityTags.includes(tag)
      ? personalityTags.filter((t) => t !== tag)
      : [...personalityTags, tag];
    onChange({ personalityTags: next });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Personality tags */}
      <div>
        <p className="mb-1 text-sm font-bold text-brown">นิสัยน้อง</p>
        <p className="mb-3 text-xs text-brown-muted">เลือกได้หลายอย่างเลย</p>
        <div className="flex flex-wrap gap-2">
          {PERSONALITY_TAGS.map((tag) => {
            const selected = personalityTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-chip border-[1.5px] px-3.5 py-1.5 text-sm font-semibold transition-all ${
                  selected
                    ? "border-coral/40 bg-coral text-white"
                    : "border-line bg-[#FBF7F3] text-ink-2 hover:border-coral/40"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Province */}
      <div>
        <label className="mb-2 block text-sm font-bold text-brown">
          จังหวัด
        </label>
        <div className="relative">
          <select
            value={province}
            onChange={(e) => onChange({ province: e.target.value })}
            className={selectClass + " pr-10"}
          >
            <option value="">เลือกจังหวัด</option>
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

      {/* District */}
      <div>
        <label className="mb-2 block text-sm font-bold text-brown">
          เขต/อำเภอ <span className="font-normal text-brown-muted">(ไม่บังคับ)</span>
        </label>
        <input
          type="text"
          value={district}
          onChange={(e) => onChange({ district: e.target.value })}
          placeholder="เช่น ลาดพร้าว, เมือง"
          maxLength={60}
          className={inputClass}
        />
      </div>

      {/* Bio */}
      <div>
        <label className="mb-2 block text-sm font-bold text-brown">
          แนะนำตัวน้อง <span className="font-normal text-brown-muted">(ไม่บังคับ)</span>
        </label>
        <textarea
          value={bio}
          onChange={(e) => onChange({ bio: e.target.value })}
          placeholder="เล่าให้ฟังหน่อยว่าน้องเป็นยังไง ชอบอะไร ไม่ชอบอะไร..."
          rows={3}
          maxLength={300}
          className={inputClass + " resize-none"}
        />
        <p className="mt-1 text-right text-xs text-brown-muted">
          {bio.length}/300
        </p>
      </div>
    </div>
  );
}
