"use client";

import { useEffect } from "react";
import { cn } from "./cn";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  /** z-layer per project convention: 60 = sheet/detail, 70 = modal/popup */
  z?: 60 | 70;
  /** Center the panel as a modal instead of docking to the bottom */
  center?: boolean;
  title?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

// Bottom sheet / modal scaffold: scrim + drag handle + safe-area padding.
// Encodes the project z-index convention (z-[60] sheets, z-[70] modals) and
// the slide-up / pop entrance.
export default function Sheet({
  open,
  onClose,
  z = 60,
  center = false,
  title,
  className,
  children,
}: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 flex bg-[rgba(35,24,20,.45)] backdrop-blur-[2px]",
        center ? "items-center justify-center p-5" : "items-end",
        z === 70 ? "z-[70]" : "z-[60]",
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full bg-white",
          center
            ? "mx-auto max-w-sm animate-pop rounded-card p-6 shadow-popup"
            : "mx-auto max-w-[480px] rounded-t-card px-6 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-3 shadow-sheet animate-fade-up",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {!center && (
          <div className="mx-auto mb-3 h-[5px] w-10 rounded-full bg-fill-3" />
        )}
        {title && (
          <h3 className="mb-3 text-lg font-bold tracking-tight2 text-ink">{title}</h3>
        )}
        {children}
      </div>
    </div>
  );
}
