"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronDown, Search, Info, SearchX } from "lucide-react";
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
      <div className="flex h-14 shrink-0 items-center gap-1 border-b border-black/5 px-1">
        <Link href="/app/care" className="flex h-11 w-11 shrink-0 items-center justify-center text-brown">
          <ChevronLeft size={20} />
        </Link>
        <span className="flex-1 truncate text-[17px] font-bold text-brown">โรงพยาบาลสัตว์ใกล้ฉัน</span>
        <div className="h-11 w-11 shrink-0" />
      </div>

      <div className="flex flex-1 flex-col px-5 pb-6 pt-4">
        {/* รายการ | แผนที่ segment toggle */}
        <div className="flex rounded-full bg-cream p-1">
          <button
            type="button"
            onClick={() => setView("list")}
            className={`flex-1 rounded-full py-2 text-sm font-bold transition-all ${
              view === "list" ? "bg-white text-brown shadow-card" : "text-brown-muted"
            }`}
          >
            รายการ
          </button>
          <button
            type="button"
            onClick={() => setView("map")}
            className={`flex-1 rounded-full py-2 text-sm font-bold transition-all ${
              view === "map" ? "bg-white text-brown shadow-card" : "text-brown-muted"
            }`}
          >
            แผนที่
          </button>
        </div>

        {/* Filter row */}
        <div className="mt-3 flex items-center gap-2">
          <div className="relative shrink-0">
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="appearance-none rounded-xl bg-cream py-2 pl-3 pr-7 text-sm font-medium text-brown focus:outline-none"
            >
              <option value="">ทุกจังหวัด</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-brown-muted"
            />
          </div>

          <button
            type="button"
            onClick={() => setOpen24hOnly((v) => !v)}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-colors ${
              open24hOnly ? "bg-coral/10 text-coral" : "bg-cream text-brown-muted"
            }`}
          >
            เปิด 24 ชม.
            <span className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${open24hOnly ? "bg-coral" : "bg-black/15"}`}>
              <span
                className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${
                  open24hOnly ? "left-3.5" : "left-0.5"
                }`}
              />
            </span>
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-xl bg-cream px-2.5 py-2">
            <Search size={13} className="shrink-0 text-brown-muted/60" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ชื่อโรงพยาบาล"
              className="w-full min-w-0 bg-transparent text-xs text-brown placeholder:text-brown-muted/60 focus:outline-none"
            />
          </div>
        </div>

        {/* Location denied — neutral fallback note, app keeps working */}
        {locationState === "denied" && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-cream px-3 py-2.5">
            <Info size={14} className="mt-0.5 shrink-0 text-brown-muted" />
            <p className="text-xs leading-relaxed text-brown-muted">
              ไม่สามารถเข้าถึงตำแหน่งของคุณ — เรียงผลตามจังหวัดของน้อง{" "}
              <strong className="text-brown">({petProvince ?? "ไม่ระบุ"})</strong>
            </p>
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
    <div className="flex flex-col items-center gap-3.5 px-10 pt-12 text-center">
      <SearchX size={56} className="text-black/15" />
      <div>
        <p className="font-bold text-brown">ไม่พบโรงพยาบาลตามตัวกรอง</p>
        <p className="mt-2 text-sm leading-relaxed text-brown-muted">
          ลองเปลี่ยนจังหวัด หรือปิดตัวกรอง &quot;เปิด 24 ชม.&quot;
        </p>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="rounded-2xl border-[1.5px] border-coral px-6 py-2.5 text-sm font-bold text-coral"
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
