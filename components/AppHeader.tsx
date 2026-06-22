import Link from "next/link";
import { PawPrint } from "lucide-react";

export default function AppHeader() {
  return (
    <div className="flex items-center gap-2 px-5 py-3">
      <Link href="/app/home" className="flex items-center gap-2.5">
        <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[11px] bg-gradient-logo shadow-[0_6px_14px_-6px_rgba(239,78,60,.6)]">
          <PawPrint size={20} className="text-white" fill="currentColor" />
        </span>
        <span className="text-lg font-bold tracking-tight2 text-ink">PawMate</span>
      </Link>
    </div>
  );
}
