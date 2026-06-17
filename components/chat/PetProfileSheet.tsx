"use client";

import { useState, useRef } from "react";
import { X, MapPin, ShieldCheck, Scissors, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import RatingSummary from "@/components/trust/RatingSummary";
import type { PetCardData } from "@/components/swipe/PetCard";

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
  onClose: () => void;
}

// Read-only profile view opened from the chat overflow menu — mirrors the
// swipe card's detail sheet (RatingSummary, trust badges, tags, bio) but
// omits report/block since those already have their own menu entries.
export default function PetProfileSheet({ pet, mode, onClose }: Props) {
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
      onClose();
    } else {
      setDragY(0);
    }
  };

  const age = calcAge(pet.birth_month);
  const location = [pet.district, pet.province].filter(Boolean).join(", ");
  const showVaccinated = pet.vaccinated === true;
  const showNeutered = pet.neutered === true;

  return (
    <>
      <div className="fixed inset-0 z-[70] flex flex-col bg-black/50">
        <div className="flex-1" onClick={onClose} />

        <div
          className="mx-auto w-full max-w-[480px] overflow-y-auto rounded-t-[28px] bg-white transition-transform duration-150"
          style={
            dragY > 0
              ? { maxHeight: "88vh", transform: `translateY(${dragY}px)` }
              : { maxHeight: "88vh", WebkitOverflowScrolling: "touch" }
          }
        >
          {/* Drag handle + close button (sticky so always visible) */}
          <div className="sticky top-0 z-10 relative flex h-11 items-center justify-center bg-white rounded-t-[28px]">
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
              onClick={onClose}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-brown-muted transition-colors hover:bg-black/10"
            >
              <X size={16} />
            </button>
          </div>

          {/* Photos — large 2-up grid (single photo spans full width) */}
          <div className="grid grid-cols-2 gap-2 px-4 pb-2">
            {pet.photos.map((url, i) => (
              <div
                key={i}
                className={`group relative aspect-square cursor-pointer overflow-hidden rounded-2xl ${
                  pet.photos.length === 1 ? "col-span-2" : ""
                }`}
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
            <h2 className="text-2xl font-bold text-brown">{pet.name}</h2>
            <p className="text-brown-muted">
              {pet.breed} · {age} · {pet.sex === "male" ? "เพศผู้" : "เพศเมีย"}
            </p>
            {location && (
              <div className="mt-1 flex items-center gap-1 text-brown-muted">
                <MapPin size={13} />
                <span className="text-sm">{location}</span>
              </div>
            )}

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

      {/* Lightbox — square popup */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/70"
          onClick={() => setLightboxIdx(null)}
        >
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
            <button
              type="button"
              onClick={() => setLightboxIdx(null)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
            >
              <X size={16} />
            </button>
            {lightboxIdx > 0 && (
              <button
                type="button"
                onClick={() => setLightboxIdx(lightboxIdx - 1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
              >
                <ChevronLeft size={20} />
              </button>
            )}
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
    </>
  );
}
