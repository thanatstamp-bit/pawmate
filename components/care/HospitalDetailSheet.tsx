import { MapPin, Phone, Navigation, X } from "lucide-react";
import type { Hospital } from "./HospitalCard";

type Props = {
  hospital: Hospital;
  onClose: () => void;
};

// Unlike the app's other bottom sheets (z-[60], fixed inset-0), this one stops
// above the bottom nav (bottom-[60px]) so the nav stays visible/usable while
// the sheet is open — matches the Hospital Finder wireframe's frame ③.
export default function HospitalDetailSheet({ hospital, onClose }: Props) {
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`;

  return (
    <>
      <div
        className="fixed inset-x-0 top-0 bottom-[60px] z-[55] bg-black/40"
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-[60px] z-[60] mx-auto w-full max-w-[480px] rounded-t-card bg-white p-5 shadow-sheet">
        <div className="mx-auto mb-3.5 h-[5px] w-10 rounded-full bg-fill-3" />

        <div className="mb-3 flex items-start gap-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-bold leading-tight tracking-tight2 text-ink">{hospital.name}</p>
            {hospital.open_24h && (
              <span className="mt-1.5 inline-flex rounded-lg bg-coral-soft px-2 py-0.5 text-[11px] font-bold text-coral-ink">
                24 ชม.
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream text-ink-2"
          >
            <X size={14} />
          </button>
        </div>

        {hospital.address && (
          <div className="mb-2.5 flex items-start gap-2">
            <MapPin size={14} className="mt-0.5 shrink-0 text-ink-3" />
            <span className="text-[13px] leading-relaxed text-ink-2">{hospital.address}</span>
          </div>
        )}

        {hospital.phone && (
          <a
            href={`tel:${hospital.phone}`}
            className="mb-3 flex items-center gap-2 rounded-2xl bg-cream px-3 py-2.5"
          >
            <Phone size={16} className="text-ink-2" />
            <span className="flex-1 text-sm font-medium text-ink">{hospital.phone}</span>
          </a>
        )}

        {hospital.services.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {hospital.services.map((s) => (
              <span key={s} className="rounded-lg bg-cream px-2.5 py-0.5 text-[11px] text-ink-2">
                {s}
              </span>
            ))}
          </div>
        )}

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-gradient-cta font-bold tracking-tight2 text-white shadow-cta transition-transform active:scale-[.98]"
        >
          <Navigation size={18} />
          นำทาง
        </a>
      </div>
    </>
  );
}
