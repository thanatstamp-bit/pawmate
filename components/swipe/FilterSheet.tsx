"use client";

import { X, ChevronDown } from "lucide-react";
import { PROVINCES } from "@/lib/data/provinces";

export type SwipeFilters = {
  province: string;
};

interface Props {
  filters: SwipeFilters;
  onChange: (f: SwipeFilters) => void;
  onClose: () => void;
}

const selectClass =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm " +
  "focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30 appearance-none";

export default function FilterSheet({ filters, onChange, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/50">
      <div className="flex-1" onClick={onClose} />
      <div className="mx-auto w-full max-w-[480px] rounded-t-[28px] bg-white p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">ตัวกรอง</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 hover:bg-cream"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-sm font-bold text-brown">
              จังหวัด
            </label>
            <div className="relative">
              <select
                value={filters.province}
                onChange={(e) =>
                  onChange({ ...filters, province: e.target.value })
                }
                className={selectClass + " pr-10"}
              >
                <option value="">ทุกจังหวัด</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={18}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brown-muted"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-full bg-coral py-3 font-bold text-white hover:bg-coral-dark"
        >
          ดูผลลัพธ์
        </button>
      </div>
    </div>
  );
}
