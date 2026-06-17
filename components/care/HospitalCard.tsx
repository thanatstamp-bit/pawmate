import { MapPin } from "lucide-react";

export type Hospital = {
  id: string;
  name: string;
  province: string;
  district: string | null;
  address: string | null;
  phone: string | null;
  lat: number;
  lng: number;
  open_24h: boolean;
  services: string[];
  distanceKm?: number;
};

type Props = {
  hospital: Hospital;
  onClick: () => void;
};

export default function HospitalCard({ hospital, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-2 rounded-2xl border border-black/5 bg-white p-4 text-left shadow-card"
    >
      <div className="flex items-start gap-2">
        <span className="flex-1 text-[15px] font-bold leading-tight text-brown">
          {hospital.name}
        </span>
        {hospital.open_24h && (
          <span className="shrink-0 rounded-lg bg-coral/10 px-2 py-0.5 text-[11px] font-bold text-coral">
            24 ชม.
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-xs text-brown-muted">
          <MapPin size={12} className="text-brown-muted/60" />
          <span>
            {hospital.district ? `${hospital.district} · ` : ""}
            {hospital.province}
          </span>
        </div>
        {hospital.distanceKm !== undefined && (
          <span className="shrink-0 text-xs text-brown-muted/70">
            {hospital.distanceKm.toFixed(1)} กม.
          </span>
        )}
      </div>

      {hospital.services.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {hospital.services.map((s) => (
            <span key={s} className="rounded-lg bg-cream px-2.5 py-0.5 text-[11px] text-brown-muted">
              {s}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
