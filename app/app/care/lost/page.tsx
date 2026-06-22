"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronDown, MapPin, Plus, PawPrint } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PROVINCES } from "@/lib/data/provinces";
import LostPetCard, { type LostPet } from "@/components/lost/LostPetCard";

type Species = "" | "dog" | "cat" | "other";
type StatusFilter = "" | "lost" | "found";

const selectWrapClass =
  "flex flex-1 items-center rounded-xl border-[1.5px] border-line bg-white pl-3 pr-1";
const selectClass =
  "min-w-0 flex-1 appearance-none bg-transparent text-[13px] font-semibold text-ink " +
  "focus:outline-none cursor-pointer";

export default function LostFeedPage() {
  const supabase = createClient();
  const [posts, setPosts] = useState<LostPet[]>([]);
  const [loading, setLoading] = useState(true);
  const [province, setProvince] = useState("");
  const [species, setSpecies] = useState<Species>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("lost_pets")
        .select(
          "id, pet_name, species, breed, photos, last_seen_province, last_seen_district, lost_date, status, created_at"
        )
        .order("created_at", { ascending: false });
      setPosts((data as LostPet[]) ?? []);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () =>
      posts.filter((p) => {
        if (province && p.last_seen_province !== province) return false;
        if (species && p.species !== species) return false;
        if (statusFilter && p.status !== statusFilter) return false;
        return true;
      }),
    [posts, province, species, statusFilter]
  );

  return (
    <div className="flex min-h-screen flex-col bg-gradient-app">
      {/* Header */}
      <div className="shrink-0 px-[22px] pb-3 pt-1">
        <div className="flex items-center gap-3">
          <Link
            href="/app/care"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border-[1.5px] border-line bg-white text-ink shadow-[0_6px_16px_-10px_rgba(120,72,60,.3)] transition-transform active:scale-95"
          >
            <ChevronLeft size={20} />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-[21px] font-bold leading-tight tracking-title text-ink">
              ประกาศสัตว์หาย
            </h1>
            <p className="mt-px text-[12.5px] font-semibold text-teal-ink">
              ช่วยกันตามหาน้องกลับบ้าน 🐾
            </p>
          </div>
        </div>
      </div>

      {/* Filter row */}
      <div className="flex shrink-0 items-center gap-2.5 px-[22px] pb-3">
        {/* Province */}
        <div className={selectWrapClass}>
          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className={selectClass}
          >
            <option value="">ทุกจังหวัด</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <ChevronDown size={15} className="pointer-events-none shrink-0 text-ink-3" />
        </div>

        {/* Species */}
        <div className={selectWrapClass}>
          <select
            value={species}
            onChange={(e) => setSpecies(e.target.value as Species)}
            className={selectClass}
          >
            <option value="">ทุกชนิด</option>
            <option value="dog">สุนัข</option>
            <option value="cat">แมว</option>
            <option value="other">อื่นๆ</option>
          </select>
          <ChevronDown size={15} className="pointer-events-none shrink-0 text-ink-3" />
        </div>

        {/* Status */}
        <div className={selectWrapClass}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className={selectClass}
          >
            <option value="">ทั้งหมด</option>
            <option value="lost">ยังตามหา</option>
            <option value="found">พบแล้ว</option>
          </select>
          <ChevronDown size={15} className="pointer-events-none shrink-0 text-ink-3" />
        </div>
      </div>

      {/* Feed content */}
      <div className="relative flex-1">
        {loading ? (
          <div className="px-[22px] pb-[100px] pt-1">
            <div className="flex flex-col gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="overflow-hidden rounded-[20px] bg-white shadow-card">
                  <div className="skeleton h-[190px] animate-shimmer" />
                  <div className="p-[15px]">
                    <div className="skeleton h-[18px] w-1/2 animate-shimmer rounded-lg" />
                    <div className="skeleton mt-2.5 h-[13px] w-[72%] animate-shimmer rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-10 py-16 text-center animate-fade-up">
            <div className="flex h-[90px] w-[90px] items-center justify-center rounded-[28px] bg-teal-soft">
              <PawPrint size={40} className="text-teal-ink" />
            </div>
            <p className="mt-5 text-[19px] font-bold text-ink">ยังไม่มีประกาศ</p>
            <p className="mt-[7px] max-w-[240px] text-[14px] leading-relaxed text-ink-2">
              ยังไม่มีประกาศสัตว์หายตามตัวกรองนี้ — ขอให้น้องทุกตัวปลอดภัยนะ
            </p>
            <Link
              href="/app/care/lost/new"
              className="mt-[22px] flex h-[50px] items-center gap-2 rounded-[15px] bg-gradient-cta px-6 font-bold text-white shadow-cta transition-transform active:scale-95"
            >
              <Plus size={18} strokeWidth={2.5} />
              แจ้งสัตว์หาย
            </Link>
          </div>
        ) : (
          <div className="px-[22px] pb-[110px] pt-1">
            <div className="flex flex-col gap-4">
              {filtered.map((post) => (
                <LostPetCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FAB — extended pill per wireframe */}
      <Link
        href="/app/care/lost/new"
        className="fixed right-5 z-[60] flex h-[54px] items-center gap-2 rounded-[27px] bg-gradient-cta px-5 shadow-[0_14px_28px_-8px_rgba(239,78,60,.6)] transition-transform active:scale-95"
        style={{ bottom: "76px" }}
      >
        <Plus size={18} strokeWidth={2.5} className="text-white" />
        <span className="text-[15.5px] font-bold text-white">แจ้งสัตว์หาย</span>
      </Link>
    </div>
  );
}
