"use client";
import { Share2 } from "lucide-react";

interface Props {
  petName: string;
  variant?: "lost" | "found";
}

export function PublicShareButton({ petName, variant = "lost" }: Props) {
  async function handleShare() {
    const url = window.location.href;
    const title =
      variant === "found"
        ? `${petName} กลับบ้านแล้ว!`
        : `ช่วยตามหา ${petName}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled or API not supported
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  if (variant === "found") {
    return (
      <button
        onClick={handleShare}
        className="flex h-[54px] w-full items-center justify-center gap-2 rounded-[16px] bg-teal font-bold text-white shadow-[0_12px_24px_-10px_rgba(46,196,182,.55)] transition-transform active:scale-[.98]"
      >
        <Share2 size={16} />
        แชร์ข่าวดีนี้
      </button>
    );
  }

  return (
    <button
      onClick={handleShare}
      className="flex h-[54px] w-full items-center justify-center gap-2 rounded-[16px] border-[1.5px] border-line bg-white font-bold text-ink-2 shadow-[0_6px_16px_-10px_rgba(120,72,60,.25)] transition-transform active:scale-[.98]"
    >
      <Share2 size={16} />
      แชร์ประกาศนี้
    </button>
  );
}
