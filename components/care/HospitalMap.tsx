"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Hospital } from "./HospitalCard";

// MapContainer's center prop is init-time only in react-leaflet v4.
// This child component uses the imperative useMap() hook to re-center
// whenever the parent's center prop changes (e.g., after geolocation resolves).
function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

type Props = {
  hospitals: Hospital[];
  center: [number, number];
  onSelect: (hospital: Hospital) => void;
};

// Every marker below supplies its own divIcon (a colored circle + number),
// so we never fall back to Leaflet's default teardrop icon — sidesteps the
// well-known "default marker images 404 under webpack" bundling issue
// without needing an L.Icon.Default.mergeOptions() path-rewrite.
function markerIcon(number: number, color: string) {
  return L.divIcon({
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="width:30px;height:30px;background:${color};border-radius:50%;border:2.5px solid white;box-shadow:0 2px 7px rgba(0,0,0,0.22);display:flex;align-items:center;justify-content:center;">
          <span style="font-size:11px;font-weight:700;color:white;line-height:1;">${number}</span>
        </div>
        <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${color};margin-top:-1px;"></div>
      </div>
    `,
    className: "",
    iconSize: [30, 38],
    iconAnchor: [15, 38],
  });
}

const COLOR_24H = "#FF6B5B"; // coral
const COLOR_REGULAR = "#2D2A26"; // brown

export default function HospitalMap({ hospitals, center, onSelect }: Props) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      <MapContainer center={center} zoom={12} className="h-full w-full" scrollWheelZoom>
        <RecenterMap center={center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hospitals.map((h, i) => (
          <Marker
            key={h.id}
            position={[h.lat, h.lng]}
            icon={markerIcon(i + 1, h.open_24h ? COLOR_24H : COLOR_REGULAR)}
            eventHandlers={{ click: () => onSelect(h) }}
          />
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute left-2 top-2 z-[400] flex flex-col gap-1 rounded-lg bg-white/90 px-2 py-1.5 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLOR_24H }} />
          <span className="text-[10px] text-brown-muted">เปิด 24 ชม.</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLOR_REGULAR }} />
          <span className="text-[10px] text-brown-muted">ทั่วไป</span>
        </div>
      </div>
    </div>
  );
}
