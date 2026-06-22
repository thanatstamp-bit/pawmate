"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronDown, Search, Info, SearchX, List, Map as MapIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { haversineKm } from "@/lib/geo";
import { PROVINCES } from "@/lib/data/provinces";
import HospitalCard, { type Hospital } from "@/components/care/HospitalCard";
import HospitalDetailSheet from "@/components/care/HospitalDetailSheet";

// Leaflet reads `window` at import time, so it can only run on the client —
// loading it via next/dynamic with ssr:false keeps the server bundle clean.
const HospitalMap = dynamic(() => import("@/components/care/HospitalMap"), {
  ssr: false,
});

type ViewMode = "list" | "map";
type LocationState = "pending" | "granted" | "denied";

const BANGKOK_CENTER: [number, number] = [13.7563, 100.5018];

export default function HospitalFinderPage() {
  const supabase = createClient();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("list");
  const [province, setProvince] = useState("");
  const [petProvince, setPetProvince] = useState<string | null>(null);
  const [open24hOnly, setOpen24hOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [locationState, setLocationState] = useState<LocationState>("pending");
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [selected, setSelected] = useState<Hospital | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      let resolvedProvince: string | null = null;

      if (user) {
        const storedId = localStorage.getItem("pawmate_active_pet_id");
        let pet: { province: string } | null = null;
        if (storedId) {
          const { data } = await supabase
            .from("pets")
            .select("province")
            .eq("owner_id", user.id)
            .eq("id", storedId)
            .maybeSingle();
          pet = data;
        }
        if (!pet) {
          const { data } = await supabase
            .from("pets")
            .select("province")
            .eq("owner_id", user.id)
            .limit(1)
            .maybeSingle();
          pet = data;
        }
        resolvedProvince = pet?.province ?? null;
      }
      setPetProvince(resolvedProvince);
      setProvince(resolvedProvince ?? "");

      const { data: hospitalsData } = await supabase
        .from("hospitals")
        .select("id, name, province, district, address, phone, lat, lng, open_24h, services")
        .order("name", { ascending: true });
      setHospitals(hospitalsData ?? []);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationState("denied");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationState("granted");
      },
      () => setLocationState("denied"),
      { timeout: 8000 }
    );
  }, []);

  const filtered = useMemo(() => {
    let list = hospitals;
    if (province) list = list.filter((h) => h.province === province);
    if (open24hOnly) list = list.filter((h) => h.open_24h);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((h) => h.name.toLowerCase().includes(q));
    }

    if (userPos) {
      list = list
        .map((h) => ({ ...h, distanceKm: haversineKm(userPos.lat, userPos.lng, h.lat, h.lng) }))
        .sort((a, b) => a.distanceKm - b.distanceKm);
    } else {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name, "th"));
    }
    return list;
  }, [hospitals, province, open24hOnly, search, userPos]);

  function clearFilters() {
    setProvince(petProvince ?? "");
    setOpen24hOnly(false);
    setSearch("");
  }

  const mapCenter: [number, number] = userPos
    ? [userPos.lat, userPos.lng]
    : filtered[0]
      ? [filtered[0].lat, filtered[0].lng]
      : BANGKOK_CENTER;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header — back arrow + page title, no logo (own navigation header) */}
      <div className="flex shrink-0 items-center gap-3 px-[22px] pb-3 pt-1">
        <Link
          href="/app/care"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border-[1.5px] border-line bg-white text-ink shadow-[0_6px_16px_-10px_rgba(120,72,60,.3)] transition-transform active:scale-95"
        >
          <ChevronLeft size={20} />
        </Link>
        <span className="flex-1 truncate text-[21px] font-bold tracking-title text-ink">โรงพยาบาลสัตว์</span>
      </div>

      <div className="flex flex-1 flex-col px-[22px] pb-6 pt-2">
        {/* รายการ | แผนที่ segment toggle */}
        <div className="flex gap-[5px] rounded-chip bg-[#F4EEE9] p-[5px]">
          <button
            type="button"
            onClick={() => setView("list")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-[10px] py-2 text-sm font-bold tracking-tight2 transition-all ${
              view === "list" ? "bg-white text-ink shadow-card" : "text-ink-3"
            }`}
          >
            <List size={15} />
            รายการ
          </button>
          <button
            type="button"
            onClick={() => setView("map")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-[10px] py-2 text-sm font-bold tracking-tight2 transition-all ${
              view === "map" ? "bg-white text-ink shadow-card" : "text-ink-3"
            }`}
          >
            <MapIcon size={15} />
            แผนที่
          </button>
        </div>

        {/* Full-width search bar */}
        <div className="mt-3 flex h-[46px] items-center gap-2 rounded-[14px] border-[1.5px] border-[#ECE5DF] bg-white px-3.5">
          <Search size={16} className="shrink-0 text-ink-3" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อโรงพยาบาล"
            className="w-full min-w-0 bg-transparent text-[15px] text-ink placeholder:text-ink-3 focus:outline-none"
          />
        </div>

        {/* Province + 24h row */}
        <div className="mt-2.5 flex items-center gap-2">
          <div className="relative flex h-[42px] min-w-0 flex-1 items-center rounded-xl border-[1.5px] border-[#ECE5DF] bg-white pl-3.5 pr-7">
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full appearance-none bg-transparent text-sm font-semibold text-ink focus:outline-none"
            >
              <option value="">ทุกจังหวัด</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-2.5 text-ink-3" />
          </div>

          <button
            type="button"
            onClick={() => setOpen24hOnly((v) => !v)}
            className={`flex h-[42px] shrink-0 items-center gap-1.5 rounded-xl border-[1.5px] px-3 text-[13px] font-semibold transition-colors ${
              open24hOnly ? "border-coral/40 bg-coral-soft text-coral-ink" : "border-[#ECE5DF] bg-white text-ink-2"
            }`}
          >
            เปิด 24 ชม.
            <span className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${open24hOnly ? "bg-coral" : "bg-fill-3"}`}>
              <span
                className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${
                  open24hOnly ? "left-3.5" : "left-0.5"
                }`}
              />
            </span>
          </button>
        </div>

        {/* Location denied — neutral fallback note, app keeps working */}
        {locationState === "denied" && (
          <div className="mt-3 flex items-start gap-2 rounded-[14px] border border-[#ECE5DF] bg-fill-2 px-3.5 py-3">
            <Info size={15} className="mt-0.5 shrink-0 text-ink-3" />
            <div>
              <p className="text-[13.5px] font-bold text-ink">ไม่ได้เปิดตำแหน่ง</p>
              <p className="text-xs text-ink-2">
                กำลังเรียงตามจังหวัด{" "}
                <strong className="text-ink-2">({petProvince ?? "ไม่ระบุ"})</strong> แทนระยะทาง
              </p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="mt-4 flex-1">
          {loading ? (
            <ListSkeleton />
          ) : filtered.length === 0 ? (
            <EmptyState onClear={clearFilters} />
          ) : view === "list" ? (
            <div className="flex flex-col gap-2.5">
              <p className="text-[13px] font-semibold text-ink-3">
                พบ {filtered.length} แห่ง{province ? ` · ${province}` : ""}
              </p>
              {filtered.map((h) => (
                <HospitalCard key={h.id} hospital={h} onClick={() => setSelected(h)} />
              ))}
            </div>
          ) : (
            <div className="h-[60vh]">
              <HospitalMap hospitals={filtered} center={mapCenter} onSelect={setSelected} />
            </div>
          )}
        </div>
      </div>

      {selected && <HospitalDetailSheet hospital={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 px-10 pt-10 text-center">
      <div className="flex h-[84px] w-[84px] items-center justify-center rounded-[26px] bg-fill-2">
        <SearchX size={40} strokeWidth={1.6} className="text-ink-3" />
      </div>
      <div>
        <p className="text-lg font-bold tracking-tight2 text-ink">ไม่พบโรงพยาบาลตามตัวกรอง</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          ลองปรับจังหวัดหรือล้างตัวกรองเพื่อดูผลลัพธ์เพิ่มเติม
        </p>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="flex h-12 items-center justify-center rounded-[14px] bg-gradient-cta px-6 text-[15px] font-bold tracking-tight2 text-white shadow-cta transition-transform active:scale-95"
      >
        ล้างตัวกรอง
      </button>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-2.5 rounded-2xl border border-black/5 bg-white p-4">
          <div className="flex items-center gap-2">
            <div className="h-4 flex-1 animate-pulse rounded bg-black/10" />
            <div className="h-5 w-12 animate-pulse rounded-lg bg-black/10" />
          </div>
          <div className="h-3 w-2/5 animate-pulse rounded bg-black/5" />
          <div className="flex gap-1.5">
            <div className="h-5 w-12 animate-pulse rounded-lg bg-black/5" />
            <div className="h-5 w-16 animate-pulse rounded-lg bg-black/5" />
            <div className="h-5 w-10 animate-pulse rounded-lg bg-black/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
