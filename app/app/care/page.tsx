import Link from "next/link";
import { ChevronLeft, Hospital, Megaphone, Droplet, BookOpenText } from "lucide-react";

const CARE_CARDS = [
  {
    label: "โรงพยาบาลสัตว์\nใกล้ฉัน",
    subtitle: "ค้นหา รพ.สัตว์และคลินิก",
    href: "/app/care/hospitals",
    icon: Hospital,
    comingSoon: false,
  },
  {
    label: "ประกาศสัตว์หาย",
    subtitle: "ลงประกาศ / ตามหาน้อง",
    href: "/app/care/lost",
    icon: Megaphone,
    comingSoon: false,
  },
  {
    label: "ศูนย์บริจาคเลือด",
    subtitle: "หาผู้บริจาคเลือดสัตว์",
    href: "/app/care/blood",
    icon: Droplet,
    comingSoon: false,
  },
  {
    label: "สมุดสุขภาพ",
    subtitle: "วัคซีน นัดหมอ บันทึกสุขภาพ",
    href: "#",
    icon: BookOpenText,
    comingSoon: true,
  },
];

export default function CareHubPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header — back arrow + logo, no bell (no notification feature yet) */}
      <div className="flex h-14 shrink-0 items-center gap-1 border-b border-black/5 px-1">
        <Link
          href="/app/home"
          className="flex h-11 w-11 shrink-0 items-center justify-center text-brown"
        >
          <ChevronLeft size={20} />
        </Link>
        <Link href="/app/home" className="flex flex-1 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="PawMate" className="h-9 w-9 object-contain drop-shadow-sm" />
          <span className="text-xl font-medium text-brown">PawMate</span>
        </Link>
      </div>

      <div className="px-5 pb-8 pt-6">
        <h1 className="mb-5 text-2xl font-bold text-brown">ดูแลน้อง</h1>

        <div className="grid grid-cols-2 gap-3.5">
          {CARE_CARDS.map((card) => {
            const Icon = card.icon;
            const inner = (
              <div
                className={`relative flex min-h-[140px] flex-col gap-3 rounded-card bg-white p-4 shadow-card ${
                  card.comingSoon ? "opacity-60" : ""
                }`}
              >
                {card.comingSoon && (
                  <span className="absolute right-3 top-3 rounded-md bg-amber px-1.5 py-0.5 text-[10px] font-bold text-white">
                    เร็วๆ นี้
                  </span>
                )}
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cream">
                  <Icon size={22} className="text-brown-muted" />
                </div>
                <div>
                  <p className="whitespace-pre-line text-sm font-bold leading-tight text-brown">
                    {card.label}
                  </p>
                  <p className="mt-1 text-[11px] leading-tight text-brown-muted">
                    {card.subtitle}
                  </p>
                </div>
              </div>
            );
            return card.comingSoon ? (
              <div key={card.label}>{inner}</div>
            ) : (
              <Link key={card.label} href={card.href}>
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
