"use client";

import { useState } from "react";
import { MapPin, ChevronUp, X } from "lucide-react";

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
  onLike: () => void;
  onSkip: () => void;
  isTop: boolean;
}

export default function PetCard({ pet, mode, onLike, onSkip, isTop }: Props) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);

  const photo = pet.photos[photoIdx] ?? pet.photos[0];
  const age = calcAge(pet.birth_month);
  const location = [pet.district, pet.province].filter(Boolean).join(", ");

  if (!isTop) {
    // Peeking card behind — static, no interactions
    return (
      <div className="absolute inset-x-0 top-3 mx-auto max-w-[420px] scale-[0.96] rounded-card bg-white shadow-card">
        <div className="aspect-[3/4] rounded-card" />
      </div>
    );
  }

  return (
    <>
      {/* Main card */}
      <div className="relative mx-auto max-w-[420px] overflow-hidden rounded-card bg-white shadow-card">
        {/* Photo */}
        <div
          className="relative aspect-[3/4] cursor-pointer"
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

          {/* Gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 to-transparent" />

          {/* Pet info */}
          <div className="absolute inset-x-0 bottom-0 p-4">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {pet.name}, {age}
                </h2>
                <p className="text-sm text-white/80">{pet.breed}</p>
                <div className="mt-1 flex items-center gap-1 text-white/70">
                  <MapPin size={12} />
                  <span className="text-xs">{location}</span>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setDetailOpen(true); }}
                className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs text-white backdrop-blur-sm"
              >
                <ChevronUp size={14} />
                ดูเพิ่ม
              </button>
            </div>

            {/* Personality chips */}
            {pet.personality_tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {pet.personality_tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold text-white backdrop-blur-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-6 py-5">
          <button
            type="button"
            onClick={onSkip}
            className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-black/10 bg-white shadow-card transition-transform active:scale-95"
          >
            <X size={28} className="text-brown-muted" />
          </button>
          <button
            type="button"
            onClick={onLike}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-coral shadow-card transition-transform active:scale-95"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-7 w-7 text-white"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Detail sheet */}
      {detailOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/50">
          <div
            className="flex-1"
            onClick={() => setDetailOpen(false)}
          />
          <div className="mx-auto w-full max-w-[480px] overflow-y-auto rounded-t-[28px] bg-white">
            {/* Drag handle */}
            <div className="flex justify-center pt-3">
              <div className="h-1 w-10 rounded-full bg-black/10" />
            </div>

            {/* Photos strip */}
            <div className="mt-3 flex gap-2 overflow-x-auto px-4 pb-2">
              {pet.photos.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="h-32 w-32 shrink-0 rounded-2xl object-cover"
                />
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

              <button
                type="button"
                onClick={() => setDetailOpen(false)}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border-2 border-black/10 py-3 font-bold text-brown-muted"
              >
                <X size={16} />
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
