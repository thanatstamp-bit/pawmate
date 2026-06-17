"use client";

import { useState, useRef } from "react";
import { MapPin, Info, X, ShieldCheck, Scissors, AlertTriangle, Megaphone, Ban, Check, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import RatingSummary from "@/components/trust/RatingSummary";
import ReportSheet from "@/components/trust/ReportSheet";
import BlockConfirm from "@/components/trust/BlockConfirm";
import Toast from "@/components/trust/Toast";

export type PetCardData = {
  id: string;
  name: string;
  species: string;
  breed: string;
  sex: string;
  birth_month: string;
  photos: string[];
  personality_tags: string[];
  province: string;
  district: string | null;
  vaccinated: boolean | null;
  neutered: boolean | null;
  bio: string | null;
};

function calcAge(birthMonth: string): string {
  const birth = new Date(birthMonth);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (months < 12) return `${months} เดือน`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y} ปี ${m} เดือน` : `${y} ปี`;
}

interface Props {
  pet: PetCardData;
  mode: "playdate" | "breeding";
  myPetId: string;
  onBlock: () => void;
  isTop: boolean;
}

export default function PetCard({ pet, mode, myPetId, onBlock, isTop }: Props) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [dragY, setDragY] = useState(0);
  const dragStartY = useRef(0);
  const dragging = useRef(false);

  const onHandleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    dragging.current = true;
  };
  const onHandleTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    setDragY(Math.max(0, e.touches[0].clientY - dragStartY.current));
  };
  const onHandleTouchEnd = () => {
    dragging.current = false;
    if (dragY > 100) {
      setDetailOpen(false);
      setDragY(0);
    } else {
      setDragY(0);
    }
  };

  const photo = pet.photos[photoIdx] ?? pet.photos[0];
  const age = calcAge(pet.birth_month);
  const location = [pet.district, pet.province].filter(Boolean).join(", ");

  // Trust badge flags (computed once to avoid narrowing quirks in JSX conditions)
  const showVaccinated = pet.vaccinated === true;
  const showNeutered = pet.neutered === true;
  const showVaccineWarning = mode === "breeding" && !showVaccinated;

  if (!isTop) {
    // Peeking card behind — static, no interactions. Stretches to match the
    // front card's height (set by the flex-1 parent) instead of a fixed
    // aspect ratio.
    return (
      <div className="absolute inset-x-0 top-3 bottom-0 mx-auto max-w-[420px] scale-[0.96] rounded-card bg-white shadow-card" />
    );
  }

  return (
    <>
      {/* Main card — fills the height given by its flex-1 parent (which is
          itself bounded by the page's fixed viewport height). The photo
          (flex-1 below) absorbs whatever space is left after the info strip,
          so it's as large as possible while the page still can't scroll. */}
      <div className="relative mx-auto flex h-full max-w-[420px] flex-col overflow-hidden rounded-card bg-white shadow-card">
        {/* Photo */}
        <div
          className="relative min-h-0 flex-1 cursor-pointer bg-cream"
          onClick={() => setDetailOpen(true)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo}
            alt={pet.name}
            className="h-full w-full object-cover"
          />

          {/* Photo dots */}
          {pet.photos.length > 1 && (
            <div className="absolute left-0 right-0 top-3 flex justify-center gap-1.5">
              {pet.photos.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setPhotoIdx(i); }}
                  className={`h-1.5 rounded-full transition-all ${
                    i === photoIdx ? "w-4 bg-white" : "w-1.5 bg-white/60"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info strip — below the photo, not overlaid on it */}
        <div className="flex shrink-0 flex-col px-4 py-3.5">
          <div className="flex items-baseline gap-1.5">
            <h2 className="text-xl font-bold text-brown">{pet.name}</h2>
            <span className="text-base font-medium text-brown-muted">· {age}</span>
          </div>
          <p className="mt-0.5 text-sm text-brown-muted">
            {pet.breed}{location && ` · ${location}`}
          </p>

          {/* Trust badges */}
          {(showVaccinated || showNeutered || showVaccineWarning) && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {showVaccinated && (
                <span className="flex items-center gap-1 rounded-full border border-teal/30 bg-teal/10 px-2.5 py-1 text-xs font-bold text-teal-dark">
                  <ShieldCheck size={12} /> ฉีดวัคซีนแล้ว
                </span>
              )}
              {showNeutered && (
                <span className="flex items-center gap-1 rounded-full border border-[#D5D1CC] bg-[#F0EEEB] px-2.5 py-1 text-xs font-bold text-[#5A5650]">
                  <Scissors size={12} /> ทำหมันแล้ว
                </span>
              )}
              {showVaccineWarning && (
                <span className="flex items-center gap-1 rounded-full border border-amber/40 bg-amber/10 px-2.5 py-1 text-xs font-bold text-amber-dark">
                  <AlertTriangle size={12} /> ยังไม่ยืนยันวัคซีน
                </span>
              )}
            </div>
          )}

          {/* Personality chips */}
          {pet.personality_tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {pet.personality_tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-cream px-2.5 py-1 text-xs font-bold text-brown-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* ดูข้อมูลเพิ่ม */}
          <button
            type="button"
            onClick={() => setDetailOpen(true)}
            className="mt-3 flex items-center justify-center gap-1.5 border-t border-black/5 pt-2.5 text-brown-muted"
          >
            <Info size={13} />
            <span className="text-xs font-medium">ดูข้อมูลเพิ่ม</span>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Detail sheet */}
      {detailOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black/50">
          <div
            className="flex-1"
            onClick={() => setDetailOpen(false)}
          />
          <div
            className="mx-auto w-full max-w-[480px] max-h-[85vh] overflow-y-auto rounded-t-[28px] bg-white transition-transform duration-150"
            style={
              dragY > 0
                ? { transform: `translateY(${dragY}px)` }
                : { WebkitOverflowScrolling: "touch" }
            }
          >
            {/* Drag handle + close button (sticky so always visible on desktop) */}
            <div
              className="sticky top-0 z-10 relative flex h-11 items-center justify-center bg-white rounded-t-[28px]"
            >
              <div
                className="flex flex-1 justify-center cursor-grab active:cursor-grabbing touch-none"
                onTouchStart={onHandleTouchStart}
                onTouchMove={onHandleTouchMove}
                onTouchEnd={onHandleTouchEnd}
              >
                <div className="h-1.5 w-12 rounded-full bg-black/15" />
              </div>
              <button
                type="button"
                onClick={() => setDetailOpen(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-brown-muted transition-colors hover:bg-black/10"
              >
                <X size={16} />
              </button>
            </div>

            {/* Photos strip */}
            <div className="mt-3 flex gap-2 overflow-x-auto px-4 pb-2">
              {pet.photos.map((url, i) => (
                <div
                  key={i}
                  className="group relative h-32 w-32 shrink-0 cursor-pointer overflow-hidden rounded-2xl"
                  onClick={() => setLightboxIdx(i)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/25">
                    <ZoomIn size={22} className="text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 pb-8 pt-3">
              <h2 className="text-2xl font-bold">{pet.name}</h2>
              <p className="text-brown-muted">
                {pet.breed} · {age} · {pet.sex === "male" ? "เพศผู้" : "เพศเมีย"}
              </p>
              <div className="mt-1 flex items-center gap-1 text-brown-muted">
                <MapPin size={13} />
                <span className="text-sm">{location}</span>
              </div>

              {/* Ratings — loads on demand while the sheet is open */}
              <div className="mt-3">
                <RatingSummary petId={pet.id} />
              </div>

              {/* Trust badges */}
              {(showVaccinated || showNeutered) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {showVaccinated && (
                    <span className="flex items-center gap-1 rounded-full border-[1.5px] border-teal/35 bg-teal/[0.09] px-3 py-1 text-sm font-bold text-teal-dark">
                      <ShieldCheck size={14} /> ฉีดวัคซีนแล้ว
                    </span>
                  )}
                  {showNeutered && (
                    <span className="flex items-center gap-1 rounded-full border-[1.5px] border-[#D5D1CC] bg-[#F0EEEB] px-3 py-1 text-sm font-bold text-[#5A5650]">
                      <Scissors size={14} /> ทำหมันแล้ว
                    </span>
                  )}
                </div>
              )}

              {/* Report / Block */}
              <div className="mt-3 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setReportOpen(true)}
                  className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-[#EDEAE6] text-[13px] font-medium text-[#8A8580]"
                >
                  <Megaphone size={14} /> รายงาน
                </button>
                <button
                  type="button"
                  onClick={() => setBlockOpen(true)}
                  className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-rose/30 bg-rose/[0.04] text-[13px] font-medium text-rose"
                >
                  <Ban size={14} /> บล็อก
                </button>
              </div>

              {/* All tags */}
              {pet.personality_tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {pet.personality_tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-coral/10 px-3 py-1 text-sm font-bold text-coral"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Bio */}
              {pet.bio && (
                <p className="mt-4 text-sm leading-relaxed text-brown">
                  {pet.bio}
                </p>
              )}

              {/* Breeding info */}
              {mode === "breeding" && (
                <div className="mt-4 rounded-card bg-amber/10 p-4">
                  <p className="mb-2 text-sm font-bold text-amber-dark">
                    ข้อมูลสำหรับผสมพันธุ์
                  </p>
                  <div className="flex gap-4 text-sm">
                    <span>
                      วัคซีน:{" "}
                      <strong>
                        {pet.vaccinated === true
                          ? "ฉีดครบ"
                          : pet.vaccinated === false
                          ? "ยังไม่ได้ฉีด"
                          : "ไม่ระบุ"}
                      </strong>
                    </span>
                    <span>
                      ทำหมัน:{" "}
                      <strong>
                        {pet.neutered === true
                          ? "แล้ว"
                          : pet.neutered === false
                          ? "ยังไม่ได้"
                          : "ไม่ระบุ"}
                      </strong>
                    </span>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Report sheet */}
      {reportOpen && (
        <ReportSheet
          reporterPetId={myPetId}
          reportedPetId={pet.id}
          onClose={() => setReportOpen(false)}
          onSubmitted={() => {
            setReportOpen(false);
            setToast("ส่งรายงานแล้ว");
          }}
        />
      )}

      {toast && (
        <Toast
          title={toast}
          subtitle="ทีมงานจะตรวจสอบภายใน 24 ชม."
          icon={<Check size={15} className="text-teal" />}
          onDone={() => setToast(null)}
        />
      )}

      {/* Lightbox — square popup */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/70"
          onClick={() => setLightboxIdx(null)}
        >
          {/* Square card */}
          <div
            className="relative aspect-square w-[85vw] max-w-[400px] overflow-hidden rounded-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pet.photos[lightboxIdx]}
              alt=""
              className="h-full w-full object-cover"
            />
            {/* Close */}
            <button
              type="button"
              onClick={() => setLightboxIdx(null)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
            >
              <X size={16} />
            </button>
            {/* Prev */}
            {lightboxIdx > 0 && (
              <button
                type="button"
                onClick={() => setLightboxIdx(lightboxIdx - 1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            {/* Next */}
            {lightboxIdx < pet.photos.length - 1 && (
              <button
                type="button"
                onClick={() => setLightboxIdx(lightboxIdx + 1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
              >
                <ChevronRight size={20} />
              </button>
            )}
          </div>
          {/* Dot indicators below card */}
          {pet.photos.length > 1 && (
            <div className="mt-4 flex gap-1.5">
              {pet.photos.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${i === lightboxIdx ? "w-5 bg-white" : "w-1.5 bg-white/40"}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Block confirm */}
      {blockOpen && (
        <BlockConfirm
          blockerPetId={myPetId}
          blockedPetId={pet.id}
          onClose={() => setBlockOpen(false)}
          onBlocked={() => {
            setBlockOpen(false);
            setDetailOpen(false);
            onBlock();
          }}
        />
      )}
    </>
  );
}
