"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PawPrint, Heart, HeartPulse, User } from "lucide-react";

const tabs = [
  { href: "/app/home", label: "หน้าแรก", icon: Home },
  { href: "/app/swipe", label: "ปัดการ์ด", icon: PawPrint },
  { href: "/app/matches", label: "แมตช์", icon: Heart },
  { href: "/app/care", label: "ดูแล", icon: HeartPulse },
  { href: "/app/profile", label: "โปรไฟล์", icon: User },
];

// Bottom navigation for authenticated app pages. Rendered by the
// /app layout only, so it never appears on landing or login pages.
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-black/5 bg-white">
      <div className="mx-auto flex max-w-[480px] items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-bold transition-colors ${
                active ? "text-coral" : "text-brown-muted hover:text-brown"
              }`}
            >
              <Icon size={24} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
