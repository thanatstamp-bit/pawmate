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
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/60 p-6">
      <div
        className="w-full max-w-[360px] animate-[popIn_0.4s_cubic-bezier(0.34,1.56,0.64,1)] rounded-[28px] bg-white p-7 text-center shadow-2xl"
        style={{
          ["--tw-shadow" as string]:
            "0 25px 50px -12px rgba(0,0,0,0.25)",
        }}
      >
        {/* Pet photos */}
        <div className="mb-5 flex items-center justify-center gap-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={myPhoto}
            alt="my pet"
            className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-card"
          />
          <div className="-mx-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-coral text-xl shadow-card">
            {emoji}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={theirPhoto}
            alt="their pet"
            className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-card"
          />
        </div>

        <h2 className="text-2xl font-bold text-brown">{headline}</h2>
        <p className="mt-1 text-brown-muted">
          น้องกับ <strong>{theirName}</strong> ชอบกันแล้ว
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={goToChat}
            className="rounded-full bg-coral py-3 font-bold text-white hover:bg-coral-dark"
          >
            ทักเลย
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border-2 border-black/10 py-3 font-bold text-brown-muted hover:border-coral/40"
          >
            ปัดต่อ
          </button>
        </div>
      </div>

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
