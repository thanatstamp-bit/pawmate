import Link from "next/link";
import {
  PawPrint,
  Heart,
  Hand,
  CalendarDays,
  HeartPulse,
  CheckCircle2,
  MapPin,
  X,
} from "lucide-react";

const CONTACT_EMAIL = "thanat.stamp@gmail.com";

const FEATURES = [
  {
    icon: Hand,
    tint: "from-coral-soft to-white",
    color: "text-coral-deep",
    rotate: "-rotate-6",
    cardTint: "from-white to-coral-soft/20",
    offset: "md:mt-0",
    title: "ปัดหาคู่",
    desc: "ปัดขวาเพื่อแสดงความสนใจ ระบบจะจับคู่สัตว์เลี้ยงที่มีความชอบคล้ายกัน ให้คุณและน้องๆ ได้เจอเพื่อนที่ใช่",
  },
  {
    icon: CalendarDays,
    tint: "from-teal-soft to-white",
    color: "text-teal-ink",
    rotate: "rotate-6",
    cardTint: "from-white to-teal-soft/20",
    offset: "md:mt-8",
    title: "นัดวันเล่น",
    desc: "จัดตารางและนัดหมายสถานที่สำหรับ Playdate ได้ง่ายๆ ภายในแอป พร้อมระบบแจ้งเตือนเมื่อใกล้ถึงวัน",
  },
  {
    icon: HeartPulse,
    tint: "from-blue-soft to-white",
    color: "text-blue-ink",
    rotate: "-rotate-3",
    cardTint: "from-white to-blue-soft/20",
    offset: "md:mt-16",
    title: "ดูแลครบวงจร",
    desc: "บันทึกประวัติสุขภาพ ตารางวัคซีน และน้ำหนักของน้องๆ เพื่อการดูแลที่สมบูรณ์แบบในที่เดียว",
  },
];

const PREVIEW_POINTS = [
  { text: "ดูรูปภาพแบบเต็มจอ", indent: "" },
  { text: "ดูระยะห่างและสถานที่นัดพบประจำ", indent: "md:ml-4" },
  { text: "ส่งข้อความทักทายได้ทันทีเมื่อ Match", indent: "md:ml-8" },
];

export default function LandingPage() {
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-app text-ink">
      {/* ── Header ── */}
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between bg-cream/80 px-7 shadow-sm backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
          <PawPrint size={24} className="text-coral" fill="currentColor" />
          <span className="text-xl font-bold tracking-tight text-coral-deep">PawMate</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full border border-black/10 bg-white px-4 py-1.5 text-sm font-bold text-ink transition-colors hover:border-coral/40"
          >
            เข้าสู่ระบบ
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-gradient-cta px-4 py-1.5 text-sm font-bold text-white shadow-cta transition-transform active:scale-95"
          >
            สมัครฟรี
          </Link>
        </div>
      </header>

      <main className="relative mx-auto max-w-[1140px] overflow-hidden pt-16">
        {/* Background blobs */}
        <div className="pointer-events-none absolute left-0 top-20 h-72 w-72 animate-blob rounded-full bg-teal-soft/60 opacity-70 mix-blend-multiply blur-2xl" />
        <div className="pointer-events-none absolute right-0 top-40 h-72 w-72 animate-blob rounded-full bg-coral-soft/60 opacity-70 mix-blend-multiply blur-2xl" style={{ animationDelay: "2s" }} />
        <div className="pointer-events-none absolute -bottom-8 left-20 h-72 w-72 animate-blob rounded-full bg-blue-soft/60 opacity-70 mix-blend-multiply blur-2xl" style={{ animationDelay: "4s" }} />

        {/* ── Hero ── */}
        <section className="relative px-7 pb-16 pt-12 md:py-24">
          <div className="absolute inset-0 -z-10 mx-4 mt-8 scale-110 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] bg-gradient-to-br from-coral-soft to-bg-top opacity-60" />
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="mb-6 -rotate-2 rounded-full border border-white bg-white/80 px-5 py-2 shadow-sm backdrop-blur-md">
              <span className="text-sm font-semibold text-coral-deep">🐶🐱 คอมมูนิตี้สำหรับคนรักสัตว์</span>
            </div>
            <h1 className="mb-6 max-w-2xl text-4xl font-bold leading-[1.2] tracking-tight text-ink md:text-5xl">
              หาเพื่อนเล่น &amp; คู่ให้
              <br />
              <span className="text-coral-deep">น้องหมาน้องแมว</span>ของคุณ
            </h1>
            <p className="mb-8 max-w-md text-[17px] leading-relaxed text-ink-2">
              แอปเดียวที่รวมคนรักสัตว์ ให้คุณพาน้องๆ ไปเจอเพื่อนใหม่ นัดเดินเล่น หรือหาคู่ได้อย่างปลอดภัย
            </p>
            <Link
              href="/login"
              className="w-full min-w-[200px] rounded-[28px] bg-gradient-cta px-8 py-4 text-center text-lg font-semibold text-white shadow-cta transition-all hover:-translate-y-1 hover:opacity-90 active:scale-95 md:w-auto"
            >
              ลองใช้ฟรี
            </Link>
          </div>

          {/* Hero image + floating cards */}
          <div className="relative mx-auto mt-16 h-[350px] w-full max-w-sm">
            <div className="absolute inset-0 -z-10 translate-y-4 scale-105 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] bg-teal-soft/30" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/landing/hero.jpg"
              alt="น้องหมาน้องแมวเล่นด้วยกัน"
              className="pm-float absolute inset-0 z-10 h-full w-full rounded-[30%_70%_70%_30%/30%_30%_70%_70%] object-cover shadow-[0_20px_40px_rgba(255,138,91,0.25)]"
            />
            <div
              className="pm-float absolute -right-4 -top-4 z-20 flex rotate-[5deg] items-center gap-2 rounded-3xl bg-white/90 p-3 shadow-card backdrop-blur-sm"
              style={{ animationDelay: "1s" }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-soft to-white shadow-sm">
                <Heart size={16} className="text-teal-ink" fill="currentColor" />
              </div>
              <span className="pr-1 text-sm font-semibold text-ink">Match!</span>
            </div>
            <div
              className="pm-float absolute -left-6 bottom-10 z-20 flex -rotate-3 items-center gap-3 rounded-3xl bg-white/90 p-3 shadow-card backdrop-blur-sm"
              style={{ animationDelay: "2s" }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-coral-soft to-white shadow-sm">
                <CalendarDays size={16} className="text-coral-deep" />
              </div>
              <div className="flex flex-col pr-2">
                <span className="text-sm font-bold text-ink">Playdate</span>
                <span className="text-[11px] text-ink-2">พรุ่งนี้ 16:00 น.</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="relative z-10 px-7 py-14">
          <h2 className="mb-12 text-center text-3xl font-bold text-ink">ฟีเจอร์หลักของ PawMate</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, tint, color, rotate, cardTint, offset, title, desc }) => (
              <div
                key={title}
                className={`rounded-[40px] border border-white bg-gradient-to-b ${cardTint} p-8 shadow-card transition-all duration-300 hover:-translate-y-2 ${offset}`}
              >
                <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-[24px] bg-gradient-to-br ${tint} shadow-sm ${rotate}`}>
                  <Icon size={32} className={color} />
                </div>
                <h3 className="mb-3 text-xl font-bold text-ink">{title}</h3>
                <p className="text-base leading-relaxed text-ink-2">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Social Proof ── */}
        <section className="relative mx-4 mb-14 overflow-hidden rounded-[48px] border border-white bg-gradient-to-r from-cream to-coral-soft/20 px-7 py-10 shadow-sm md:mx-7">
          <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-blue-soft/30 mix-blend-multiply blur-xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-teal-soft/30 mix-blend-multiply blur-xl" />
          <div className="relative z-10 flex flex-col items-center justify-between gap-8 p-4 md:flex-row">
            <div className="text-center md:text-left">
              <h2 className="mb-4 text-3xl font-bold text-ink">เข้าร่วมคอมมูนิตี้ของเรา</h2>
              <p className="text-[15px] text-ink-2">
                มี{" "}
                <span className="mx-1 rounded-lg bg-white px-2 py-1 font-bold text-coral-deep shadow-sm">12,000+ ครอบครัว</span>{" "}
                ที่กำลังใช้งานอยู่ทั่วประเทศ มาร่วมสร้างความสุขให้น้องๆ ไปด้วยกัน
              </p>
            </div>
            <div className="flex -rotate-2 items-center">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map((n) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={n}
                    src={`/landing/avatar${n}.jpg`}
                    alt=""
                    className="h-14 w-14 rounded-full border-4 border-white object-cover shadow-sm"
                  />
                ))}
              </div>
              <div className="ml-4 rounded-full border border-white bg-white/90 px-5 py-3 text-sm font-bold text-ink shadow-sm backdrop-blur-sm">
                +12K
              </div>
            </div>
          </div>
        </section>

        {/* ── App Preview ── */}
        <section className="relative overflow-hidden px-7 py-14">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-12 md:flex-row">
            <div className="w-full md:w-1/2">
              <h2 className="mb-6 text-4xl font-bold text-ink">
                ใช้งานง่าย <br />
                <span className="text-teal-ink">เหมือนเล่นเกม</span>
              </h2>
              <p className="mb-8 rounded-[32px] border border-white bg-white/50 p-6 text-[17px] leading-relaxed text-ink-2 shadow-sm backdrop-blur-sm">
                อินเทอร์เฟซแบบการ์ดที่ออกแบบมาให้ปัดหาเพื่อนได้สนุกและรวดเร็ว ดูข้อมูลสำคัญของน้องๆ ได้ครบในหน้าเดียว
              </p>
              <ul className="space-y-5">
                {PREVIEW_POINTS.map(({ text, indent }) => (
                  <li
                    key={text}
                    className={`flex w-fit items-center gap-4 rounded-full border border-white bg-white/60 p-3 shadow-sm backdrop-blur-md ${indent}`}
                  >
                    <span className="rounded-full bg-teal/10 p-1.5">
                      <CheckCircle2 size={20} className="text-teal-ink" />
                    </span>
                    <span className="pr-4 font-medium text-ink">{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Phone mockup */}
            <div className="mt-4 flex w-full justify-center md:mt-0 md:w-1/2">
              <div className="relative h-[540px] w-[300px] overflow-hidden rounded-[48px] border-[10px] border-white bg-white shadow-popup">
                <div className="absolute inset-0 bg-gradient-app">
                  <div className="mt-4 flex h-16 items-center justify-center px-6">
                    <span className="text-xl font-bold tracking-wide text-coral-deep">PawMate</span>
                  </div>
                  <div className="relative h-[calc(100%-140px)] p-5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/landing/app-preview.jpg"
                      alt="ตัวอย่างการ์ดในแอป"
                      className="h-full w-full rounded-[32px] object-cover"
                    />
                    <div className="absolute bottom-5 left-5 right-5 rounded-b-[32px] bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 text-white">
                      <h3 className="mb-1 text-3xl font-bold tracking-title">Milo, 2</h3>
                      <p className="flex items-center gap-1.5 text-sm font-medium opacity-90">
                        <MapPin size={16} />
                        ห่างออกไป 2 กม.
                      </p>
                    </div>
                  </div>
                  <div className="absolute bottom-6 left-0 flex w-full justify-center gap-8">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-ink-2 shadow-card">
                      <X size={32} />
                    </div>
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-coral-soft to-white text-coral-deep shadow-card">
                      <Heart size={32} fill="currentColor" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-14 flex w-full flex-col items-center gap-6 rounded-t-[40px] border-t border-white bg-gradient-to-b from-cream to-bg-bot px-7 py-12">
        <div className="mb-2 flex items-center gap-2 rounded-full bg-white px-6 py-2 shadow-sm">
          <PawPrint size={22} className="text-coral" fill="currentColor" />
          <span className="font-bold text-coral-deep">PawMate</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          <Link href="/privacy" className="text-[15px] text-ink-2 transition-colors hover:text-coral-deep">
            นโยบายความเป็นส่วนตัว
          </Link>
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-[15px] text-ink-2 transition-colors hover:text-coral-deep">
            ติดต่อเรา
          </a>
          {/* "ซอร์สโค้ด" link hidden for now (repo kept private from visitors) */}
        </div>
        <p className="mt-2 text-sm text-ink-3">© {year} PawMate · Built with Next.js · Supabase · Tailwind CSS</p>
      </footer>
    </div>
  );
}
