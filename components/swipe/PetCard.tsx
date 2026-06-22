"use client";

import { useState, useRef, useEffect } from "react";
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
  /** Called when the top card is swiped away (by gesture or by the action
      buttons). Only the top card supplies this. */
  onSwipe?: (dir: "like" | "skip") => void;
  /** Programmatic swipe trigger from the action buttons below the deck — when
      set, the top card runs the same fly-off animation before calling onSwipe. */
  triggerSwipe?: "like" | "skip" | null;
}

// Horizontal drag past this many px commits the swipe; below it snaps back.
const SWIPE_THRESHOLD = 110;

export default function PetCard({ pet, mode, myPetId, onBlock, isTop, onSwipe, triggerSwipe }: Props) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [dragY, setDragY] = useState(0);
  const dragStartY = useRef(0);
  const dragging = useRef(false);

  // --- Horizontal swipe gesture (top card only) ---
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [phase, setPhase] = useState<"idle" | "drag" | "exit">("idle");
  const exitDir = useRef<1 | -1>(1);
  const posRef = useRef({ x: 0, y: 0 });
  const cardStart = useRef({ x: 0, y: 0 });
  const cardDragging = useRef(false);
  const didDrag = useRef(false);

  function runExit(dir: 1 | -1) {
    exitDir.current = dir;
    setPhase("exit");
    window.setTimeout(() => onSwipe?.(dir === 1 ? "like" : "skip"), 280);
  }

  // Action-button presses route through the same fly-off animation.
  useEffect(() => {
    if (isTop && onSwipe && triggerSwipe && phase !== "exit") {
      runExit(triggerSwipe === "like" ? 1 : -1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerSwipe]);

  function onCardPointerDown(e: React.PointerEvent) {
    if (!isTop || !onSwipe || phase === "exit") return;
    // Don't start a drag when the press lands on an interactive control
    // (the "ดูข้อมูลเพิ่ม" button, photo dots) — otherwise pointer capture +
    // the drag's click-suppression swallow the control's own click.
    if ((e.target as HTMLElement).closest("button")) return;
    cardDragging.current = true;
    didDrag.current = false;
    cardStart.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setPhase("drag");
  }
  function onCardPointerMove(e: React.PointerEvent) {
    if (!cardDragging.current) return;
    const x = e.clientX - cardStart.current.x;
    const y = e.clientY - cardStart.current.y;
    if (Math.abs(x) > 6 || Math.abs(y) > 6) didDrag.current = true;
    posRef.current = { x, y };
    setPos({ x, y });
  }
  function onCardPointerUp() {
    if (!cardDragging.current) return;
    cardDragging.current = false;
    if (Math.abs(posRef.current.x) > SWIPE_THRESHOLD) {
      runExit(posRef.current.x > 0 ? 1 : -1);
    } else {
      setPhase("idle");
      posRef.current = { x: 0, y: 0 };
      setPos({ x: 0, y: 0 });
    }
  }
  // Suppress the photo/info tap that would open the detail sheet after a drag.
  function onCardClickCapture(e: React.MouseEvent) {
    if (didDrag.current) {
      e.stopPropagation();
      e.preventDefault();
      didDrag.current = false;
    }
  }

  const faceStyle: React.CSSProperties =
    phase === "drag"
      ? {
          transform: `translate(${pos.x}px, ${pos.y}px) rotate(${pos.x * 0.04}deg)`,
          transition: "none",
        }
      : phase === "exit"
      ? {
          transform: `translate(${exitDir.current * 1000}px, ${pos.y}px) rotate(${exitDir.current * 22}deg)`,
          transition: "transform 0.3s ease-out",
          opacity: 0,
        }
      : {
          transform: "translate(0px, 0px) rotate(0deg)",
          transition: "transform 0.25s cubic-bezier(0.22,0.61,0.36,1)",
        };

  const likeOpacity = Math.max(0, Math.min(pos.x / SWIPE_THRESHOLD, 1));
  const nopeOpacity = Math.max(0, Math.min(-pos.x / SWIPE_THRESHOLD, 1));

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
      <div className="absolute inset-x-0 top-3 bottom-0 mx-auto max-w-[420px] scale-[0.94] rounded-[28px] bg-white shadow-[0_12px_30px_-16px_rgba(120,72,60,.4)]" />
    );
  }

  return (
    <>
      {/* Main card — full-bleed photo filling the height given by its flex-1
          parent (bounded by the page's fixed viewport height). All content is
          overlaid on the photo with a bottom gradient scrim, so the page can't
          scroll. The drag handlers + faceStyle transform live on this same
          outer div; the detail sheet renders OUTSIDE it (a fixed sibling) so a
          transform here never reparents the sheet. */}
      <div
        className={`relative mx-auto h-full max-w-[420px] overflow-hidden rounded-[28px] bg-cream shadow-[0_18px_44px_-18px_rgba(120,72,60,.5),0_4px_12px_-6px_rgba(120,72,60,.2)] ${
          isTop && onSwipe ? "touch-none select-none will-change-transform" : ""
        }`}
        style={isTop && onSwipe ? faceStyle : undefined}
        onPointerDown={onCardPointerDown}
        onPointerMove={onCardPointerMove}
        onPointerUp={onCardPointerUp}
        onPointerCancel={onCardPointerUp}
        onClickCapture={onCardClickCapture}
      >
        {/* Photo (tap to open detail) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo}
          alt={pet.name}
          className="absolute inset-0 h-full w-full cursor-pointer object-cover"
          onClick={() => setDetailOpen(true)}
        />

        {/* Bottom gradient scrim */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Swipe direction labels — fade in with the drag distance */}
        {isTop && onSwipe && (
          <>
            <div
              className="pointer-events-none absolute left-5 top-6 z-10 -rotate-12 rounded-2xl border-[3px] border-coral px-3 py-0.5 text-2xl font-extrabold uppercase text-coral"
              style={{ opacity: likeOpacity }}
            >
              ถูกใจ
            </div>
            <div
              className="pointer-events-none absolute right-5 top-6 z-10 rotate-12 rounded-2xl border-[3px] border-white px-3 py-0.5 text-2xl font-extrabold uppercase text-white"
              style={{ opacity: nopeOpacity }}
            >
              ผ่าน
            </div>
          </>
        )}

        {/* Photo dots */}
        {pet.photos.length > 1 && (
          <div className="absolute left-0 right-0 top-3 z-10 flex justify-center gap-1.5">
            {pet.photos.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setPhotoIdx(i); }}
                className={`h-1.5 rounded-full transition-all ${
                  i === photoIdx ? "w-5 bg-white" : "w-1.5 bg-white/60"
                }`}
              />
            ))}
          </div>
        )}

        {/* Trust badges — frosted-glass pills, top-left */}
        {(showVaccinated || showNeutered || showVaccineWarning) && (
          <div className="absolute left-3.5 top-7 z-10 flex flex-col items-start gap-1.5">
            {showVaccinated && (
              <span className="flex items-center gap-1 rounded-xl border border-white/30 bg-teal/50 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-md">
                <ShieldCheck size={12} /> ฉีดวัคซีนแล้ว
              </span>
            )}
            {showNeutered && (
              <span className="flex items-center gap-1 rounded-xl border border-white/25 bg-black/35 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-md">
                <Scissors size={12} /> ทำหมันแล้ว
              </span>
            )}
            {showVaccineWarning && (
              <span className="flex items-center gap-1 rounded-xl border border-white/30 bg-amber/60 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-md">
                <AlertTriangle size={12} /> ยังไม่ยืนยันวัคซีน
              </span>
            )}
          </div>
        )}

        {/* Info overlay — over the bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col px-4 pb-4 pt-3 text-white">
          <div className="flex items-baseline gap-1.5">
            <h2 className="text-[27px] font-bold tracking-title [text-shadow:0_2px_8px_rgba(0,0,0,.4)]">{pet.name}</h2>
            <span className="text-lg font-medium [text-shadow:0_2px_8px_rgba(0,0,0,.4)]">· {age}</span>
          </div>
          <p className="mt-0.5 text-sm text-white/90 [text-shadow:0_2px_8px_rgba(0,0,0,.4)]">
            {pet.breed}{location && ` · ${location}`}
          </p>

          {/* Personality chips */}
          {pet.personality_tags.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {pet.personality_tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg border border-white/25 bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md"
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
            className="mt-3 flex items-center justify-center gap-1.5 self-center rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-semibold backdrop-blur-md transition-transform active:scale-95"
          >
            <Info size={13} />
            ดูข้อมูลเพิ่ม
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
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-ink-2 transition-colors hover:bg-black/10"
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
              <p className="text-ink-2">
                {pet.breed} · {age} · {pet.sex === "male" ? "เพศผู้" : "เพศเมีย"}
              </p>
              <div className="mt-1 flex items-center gap-1 text-ink-2">
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
                  className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl border-[1.5px] border-line bg-fill-1 text-[13px] font-semibold text-ink-2 transition-transform active:scale-95"
                >
                  <Megaphone size={14} /> รายงาน
                </button>
                <button
                  type="button"
                  onClick={() => setBlockOpen(true)}
                  className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-rose-soft text-[13px] font-semibold text-rose transition-transform active:scale-95"
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
                <p className="mt-4 text-sm leading-relaxed text-ink">
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
