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
        className="mb-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-teal font-bold text-white"
      >
        <Share2 size={16} />
        แชร์ข่าวดีนี้
      </button>
    );
  }

  return (
    <button
      onClick={handleShare}
      className="mb-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#D0CFCB] bg-white font-bold text-[#555]"
    >
      <Share2 size={16} />
      แชร์โพสต์นี้
    </button>
  );
}
