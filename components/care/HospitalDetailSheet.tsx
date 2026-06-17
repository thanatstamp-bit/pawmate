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
      <div className="fixed inset-x-0 bottom-[60px] z-[60] mx-auto w-full max-w-[480px] rounded-t-[28px] bg-white p-5 shadow-[0_-4px_24px_rgba(0,0,0,0.13)]">
        <div className="mx-auto mb-3.5 h-1 w-9 rounded-full bg-black/10" />

        <div className="mb-3 flex items-start gap-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-bold leading-tight text-brown">{hospital.name}</p>
            {hospital.open_24h && (
              <span className="mt-1.5 inline-flex rounded-lg bg-coral/10 px-2 py-0.5 text-[11px] font-bold text-coral">
                24 ชม.
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream text-brown-muted"
          >
            <X size={14} />
          </button>
        </div>

        {hospital.address && (
          <div className="mb-2.5 flex items-start gap-2">
            <MapPin size={14} className="mt-0.5 shrink-0 text-brown-muted/60" />
            <span className="text-[13px] leading-relaxed text-brown-muted">{hospital.address}</span>
          </div>
        )}

        {hospital.phone && (
          <a
            href={`tel:${hospital.phone}`}
            className="mb-3 flex items-center gap-2 rounded-xl bg-cream px-3 py-2.5"
          >
            <Phone size={16} className="text-brown-muted" />
            <span className="flex-1 text-sm font-medium text-brown">{hospital.phone}</span>
          </a>
        )}

        {hospital.services.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {hospital.services.map((s) => (
              <span key={s} className="rounded-lg bg-cream px-2.5 py-0.5 text-[11px] text-brown-muted">
                {s}
              </span>
            ))}
          </div>
        )}

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-coral font-bold text-white"
        >
          <Navigation size={18} />
          นำทาง
        </a>
      </div>
    </>
  );
}
