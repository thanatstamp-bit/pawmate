"use client";

import { useEffect, type ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  onDone: () => void;
  duration?: number;
}

// Auto-dismissing toast, fixed near the bottom of the screen. Supports an
// optional icon + subtitle for richer confirmations (e.g. report submitted).
export default function Toast({ title, subtitle, icon, onDone, duration = 4000 }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [onDone, duration]);

  return (
    <div className="pointer-events-none fixed bottom-20 left-4 right-4 z-[80] flex">
      <div className="flex items-center gap-3 rounded-[14px] bg-brown px-4 py-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.28)]">
        {icon && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal/15">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">{title}</p>
          {subtitle && (
            <p className="mt-0.5 text-xs leading-[1.35] text-white/55">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
