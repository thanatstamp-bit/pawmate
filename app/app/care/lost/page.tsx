"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronDown, MapPin, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PROVINCES } from "@/lib/data/provinces";
import LostPetCard, { type LostPet } from "@/components/lost/LostPetCard";

type Species = "" | "dog" | "cat" | "other";
type StatusFilter = "" | "lost" | "found";

const selectClass =
  "h-[34px] appearance-none rounded-[10px] bg-[#F5F3F0] pl-3 pr-7 text-[13px] " +
  "text-brown focus:outline-none cursor-pointer";

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
    <div className="flex min-h-screen flex-col bg-cream">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center gap-1 border-b border-black/5 bg-white px-1">
        <Link
          href="/app/care"
          className="flex h-11 w-11 shrink-0 items-center justify-center text-brown"
        >
          <ChevronLeft size={20} />
        </Link>
        <span className="flex-1 text-[17px] font-bold text-brown">ประกาศสัตว์หาย</span>
      </div>

      {/* Filter row */}
      <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-black/5 bg-white px-4 py-3">
        {/* Province */}
        <div className="relative flex shrink-0 items-center">
          <MapPin
            size={11}
            className="pointer-events-none absolute left-2 z-10 text-[#5A5650]"
          />
          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className={`${selectClass} pl-[22px]`}
          >
            <option value="">ทุกจังหวัด</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <ChevronDown
            size={11}
            className="pointer-events-none absolute right-2 text-brown-muted"
          />
        </div>

        {/* Species */}
        <div className="relative flex shrink-0 items-center">
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
          <ChevronDown
            size={11}
            className="pointer-events-none absolute right-2 text-brown-muted"
          />
        </div>

        {/* Status */}
        <div className="relative flex shrink-0 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className={selectClass}
          >
            <option value="">ทั้งหมด</option>
            <option value="lost">ยังตามหา</option>
            <option value="found">พบแล้ว</option>
          </select>
          <ChevronDown
            size={11}
            className="pointer-events-none absolute right-2 text-brown-muted"
          />
        </div>
      </div>

      {/* Feed content */}
      <div className="flex-1 px-4 pb-[100px] pt-4">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-[#EDEAE6] bg-white"
              >
                <div className="h-[152px] animate-pulse bg-[#EDEAE6]" />
                <div className="px-3.5 py-3">
                  <div className="mb-2 flex justify-between">
                    <div className="h-4 w-20 animate-pulse rounded bg-[#EDEAE6]" />
                    <div className="h-3 w-24 animate-pulse rounded bg-[#EDEAE6]" />
                  </div>
                  <div className="mb-1.5 h-3 w-28 animate-pulse rounded bg-[#F5F3F0]" />
                  <div className="h-3 w-40 animate-pulse rounded bg-[#F5F3F0]" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="mb-4">
              <ellipse
                cx="36"
                cy="48"
                rx="18"
                ry="14"
                fill="#F0EDE8"
                stroke="#D5D1CC"
                strokeWidth="1.5"
              />
              <ellipse
                cx="20"
                cy="34"
                rx="7"
                ry="9"
                fill="#F0EDE8"
                stroke="#D5D1CC"
                strokeWidth="1.5"
              />
              <ellipse
                cx="32"
                cy="28"
                rx="7"
                ry="9"
                fill="#F0EDE8"
                stroke="#D5D1CC"
                strokeWidth="1.5"
              />
              <ellipse
                cx="44"
                cy="28"
                rx="7"
                ry="9"
                fill="#F0EDE8"
                stroke="#D5D1CC"
                strokeWidth="1.5"
              />
              <ellipse
                cx="56"
                cy="34"
                rx="7"
                ry="9"
                fill="#F0EDE8"
                stroke="#D5D1CC"
                strokeWidth="1.5"
              />
            </svg>
            <p className="mb-2 text-[17px] font-bold text-brown">ยังไม่มีประกาศในพื้นที่นี้</p>
            <p className="mb-5 text-[13px] leading-relaxed text-brown-muted">
              ถ้าน้องของคุณหายหรือเห็นสัตว์ไม่มีเจ้าของ
              <br />
              ช่วยแจ้งเพื่อให้ชุมชนรับรู้นะ
            </p>
            <Link
              href="/app/care/lost/new"
              className="flex h-[52px] items-center gap-2 rounded-2xl bg-coral px-7 font-bold text-white shadow-[0_4px_16px_rgba(255,107,91,0.28)]"
            >
              <Plus size={18} />
              แจ้งสัตว์หาย
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((post) => (
              <LostPetCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>

      {/* FAB — extended pill per wireframe */}
      <Link
        href="/app/care/lost/new"
        className="fixed right-4 z-[60] flex h-[52px] items-center gap-2 rounded-[18px] bg-coral px-5 shadow-[0_4px_20px_rgba(255,107,91,0.38)]"
        style={{ bottom: "76px" }}
      >
        <Plus size={18} strokeWidth={2.5} className="text-white" />
        <span className="text-[14px] font-bold text-white">แจ้งสัตว์หาย</span>
      </Link>
    </div>
  );
}
