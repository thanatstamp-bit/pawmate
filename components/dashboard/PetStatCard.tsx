"use client";

import { Heart, Users, Send, CheckCircle, Edit2 } from "lucide-react";

type PetStats = {
  likesReceived: number;
  matches: number;
  likesSent: number;
};

export type DashboardPet = {
  id: string;
  name: string;
  species: string;
  breed: string;
  sex: string;
  birth_month: string;
  photos: string[];
  modes: string[];
  province: string;
};

type Props = {
  pet: DashboardPet;
  stats: PetStats;
  isActive: boolean;
  onSwitch: () => void;
  onEdit: () => void;
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

export default function PetStatCard({ pet, stats, isActive, onSwitch, onEdit }: Props) {
  const age = calcAge(pet.birth_month);

  return (
    <div
      className={`overflow-hidden rounded-card bg-white shadow-card transition-all ${
        isActive ? "ring-2 ring-coral" : ""
      }`}
    >
      {/* Pet info row */}
      <div className="flex items-center gap-3 p-4">
        <div className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pet.photos[0]}
            alt={pet.name}
            className="h-16 w-16 rounded-2xl object-cover"
          />
          {isActive && (
            <div className="absolute -right-1.5 -top-1.5 rounded-full bg-white p-0.5 shadow-sm">
              <CheckCircle size={18} className="fill-coral text-white" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-brown">{pet.name}</p>
            {isActive && (
              <span className="shrink-0 rounded-full bg-coral/10 px-2 py-0.5 text-[10px] font-bold text-coral">
                กำลังใช้อยู่
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-brown-muted">
            {pet.breed} · {age} · {pet.sex === "male" ? "เพศผู้" : "เพศเมีย"}
          </p>
          <p className="text-xs text-brown-muted">{pet.province}</p>
          <div className="mt-1.5 flex gap-1">
            {pet.modes.includes("playdate") && (
              <span className="rounded-full bg-teal/15 px-2 py-0.5 text-[10px] font-bold text-teal-dark">
                หาเพื่อน
              </span>
            )}
            {pet.modes.includes("breeding") && (
              <span className="rounded-full bg-amber/20 px-2 py-0.5 text-[10px] font-bold text-amber-dark">
                หาคู่
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-black/5 border-t border-black/5 bg-cream/60">
        <div className="flex flex-col items-center gap-0.5 py-3">
          <Heart size={15} className="text-coral" fill="currentColor" />
          <p className="text-base font-bold leading-none text-brown">
            {stats.likesReceived}
          </p>
          <p className="text-[10px] text-brown-muted">ถูกไลก์</p>
        </div>
        <div className="flex flex-col items-center gap-0.5 py-3">
          <Users size={15} className="text-teal" />
          <p className="text-base font-bold leading-none text-brown">
            {stats.matches}
          </p>
          <p className="text-[10px] text-brown-muted">แมตช์</p>
        </div>
        <div className="flex flex-col items-center gap-0.5 py-3">
          <Send size={15} className="text-brown-muted" />
          <p className="text-base font-bold leading-none text-brown">
            {stats.likesSent}
          </p>
          <p className="text-[10px] text-brown-muted">ส่งไลก์</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 border-t border-black/5 p-3">
        {!isActive && (
          <button
            type="button"
            onClick={onSwitch}
            className="flex-1 rounded-full bg-coral py-2 text-sm font-bold text-white transition-colors hover:bg-coral-dark"
          >
            ใช้ตัวนี้
          </button>
        )}
        <button
          type="button"
          onClick={onEdit}
          className={`flex items-center justify-center gap-1.5 rounded-full border-2 border-black/10 px-4 py-2 text-sm font-bold text-brown-muted transition-colors hover:border-coral/40 ${
            isActive ? "flex-1" : ""
          }`}
        >
          <Edit2 size={14} />
          แก้ไข
        </button>
      </div>
    </div>
  );
}
