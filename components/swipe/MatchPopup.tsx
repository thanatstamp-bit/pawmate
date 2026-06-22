"use client";

import { useRouter } from "next/navigation";

interface Props {
  myPhoto: string;
  theirPhoto: string;
  theirName: string;
  matchId: string;
  mode: "playdate" | "breeding";
  onClose: () => void;
}

export default function MatchPopup({
  myPhoto, theirPhoto, theirName, matchId, mode, onClose,
}: Props) {
  const router = useRouter();

  const headline =
    mode === "playdate"
      ? "เป็นเพื่อนกันแล้ว!"
      : "แมตช์กันแล้ว!";
  const emoji = mode === "playdate" ? "🎉" : "💕";

  function goToChat() {
    router.push(`/app/chat/${matchId}`);
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-[rgba(35,24,20,.55)] p-6 backdrop-blur-sm">
      <div className="relative w-full max-w-[360px] animate-pop overflow-hidden rounded-[30px] bg-white p-7 text-center shadow-popup">
        {/* Radial coral bloom behind the photos */}
        <div className="pointer-events-none absolute left-1/2 top-12 h-56 w-56 -translate-x-1/2 animate-bloom rounded-full bg-[radial-gradient(circle,rgba(255,107,91,.35)_0%,rgba(255,107,91,0)_70%)]" />

        {/* Pet photos */}
        <div className="relative mb-5 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={myPhoto}
            alt="my pet"
            className="h-24 w-24 -rotate-6 rounded-full border-4 border-white object-cover shadow-card"
          />
          <div className="-mx-4 z-10 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-gradient-cta text-2xl shadow-cta">
            {emoji}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={theirPhoto}
            alt="their pet"
            className="h-24 w-24 rotate-6 rounded-full border-4 border-white object-cover shadow-card"
          />
        </div>

        <h2 className="relative text-[30px] font-bold tracking-title text-coral-deep">{headline}</h2>
        <p className="relative mt-1 text-ink-2">
          น้องกับ <strong className="text-ink">{theirName}</strong> ชอบกันแล้ว
        </p>

        <div className="relative mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={goToChat}
            className="h-12 rounded-2xl bg-gradient-cta font-bold tracking-tight2 text-white shadow-cta transition-transform active:scale-[.98]"
          >
            ทักเลย
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-2xl border-2 border-black/10 font-bold text-ink-2 transition-colors hover:border-coral/40"
          >
            ปัดต่อ
          </button>
        </div>
      </div>
    </div>
  );
}
