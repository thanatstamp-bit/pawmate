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
      className="flex flex-col gap-2.5 rounded-panel bg-white p-[15px] text-left shadow-card transition-transform active:scale-[.985]"
    >
      <div className="flex items-start gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[15.5px] font-bold leading-tight tracking-tight2 text-ink">
              {hospital.name}
            </span>
            {hospital.open_24h && (
              <span className="inline-flex shrink-0 items-center rounded-lg bg-coral-soft px-2 py-[3px] text-[10.5px] font-bold text-coral-ink">
                24 ชม.
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[13px] font-medium text-ink-2">
            <MapPin size={13} className="shrink-0 text-ink-3" />
            <span>
              {hospital.district ? `${hospital.district} · ` : ""}
              {hospital.province}
            </span>
          </div>
        </div>
        {hospital.distanceKm !== undefined && (
          <div className="shrink-0 text-right leading-none">
            <div className="text-base font-bold tabular-nums text-coral-ink">
              {hospital.distanceKm.toFixed(1)}
            </div>
            <div className="mt-0.5 text-[10.5px] text-ink-3">กม.</div>
          </div>
        )}
      </div>

      {hospital.services.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {hospital.services.map((s) => (
            <span key={s} className="rounded-lg bg-teal-soft px-[9px] py-1 text-[11px] font-semibold text-teal-ink">
              {s}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
