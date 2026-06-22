import Link from "next/link";
import {
  PawPrint,
  Users,
  Heart,
  ArrowRight,
  CheckCircle2,
  Camera,
  Hand,
  PartyPopper,
  Star,
  Stethoscope,
  Github,
  Mail,
} from "lucide-react";

const GITHUB_URL = "https://github.com/thanatstamp-bit/pawmate";
const CONTACT_EMAIL = "thanat.stamp@gmail.com";

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-bold text-white">{title}</p>
      <ul className="mt-3 flex flex-col gap-2.5 text-sm text-white/60">{children}</ul>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-app">
      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 border-b border-line bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-logo shadow-[0_6px_14px_-6px_rgba(239,78,60,.6)]">
              <PawPrint size={18} className="text-white" fill="currentColor" />
            </span>
            <span className="text-base font-bold tracking-tight2 text-ink">PawMate</span>
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
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-6 pb-16 pt-12 text-center">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-coral/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-32 h-60 w-60 rounded-full bg-teal/10 blur-3xl" />
        <div className="relative mx-auto max-w-lg">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-coral-soft px-3.5 py-1.5 text-xs font-bold text-coral-ink">
            <PawPrint size={13} fill="currentColor" />
            แอปหาคู่หมาแมว #1 ของคนไทย
          </span>
          <h1 className="mt-5 text-[44px] font-bold leading-[1.08] tracking-title text-ink">
            หาเพื่อน หาคู่
            <br />
            <span className="text-coral">ให้เจ้าตัวน้อยของคุณ</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-lg text-ink-2">
            แอปจับคู่สำหรับหมาและแมวในไทย — หาเพื่อนเล่นใกล้บ้าน
            หรือหาคู่ผสมพันธุ์สายพันธุ์เดียวกัน
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="cta-sheen flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-cta px-8 py-3.5 font-bold tracking-tight2 text-white shadow-cta transition-transform active:scale-[.97] sm:w-auto"
            >
              <PawPrint size={18} fill="currentColor" />
              ลองเดโม · ไม่ต้องสมัคร
            </Link>
            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-black/10 bg-white px-8 py-3.5 font-bold text-ink transition-colors hover:border-coral/40 sm:w-auto"
            >
              สมัครฟรี
              <ArrowRight size={18} />
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-7 flex items-center justify-center gap-3 text-sm text-ink-2">
            <div className="flex -space-x-2.5">
              {[
                "bg-gradient-avatar",
                "bg-gradient-to-br from-teal to-blue",
                "bg-gradient-to-br from-amber to-coral",
                "bg-gradient-to-br from-blue to-teal",
              ].map((g, i) => (
                <span key={i} className={`h-7 w-7 rounded-full border-2 border-bg-bot ${g}`} />
              ))}
              <span className="flex h-7 items-center justify-center rounded-full border-2 border-bg-bot bg-line px-2 text-[11px] font-bold text-ink-2">
                +9k
              </span>
            </div>
            <span className="flex items-center gap-1 font-semibold">
              <Star size={15} className="text-amber" fill="currentColor" />
              4.9
            </span>
          </div>
        </div>

        {/* Phone mockup */}
        <div className="mx-auto mt-12 max-w-[240px]">
          <div className="rounded-[2.5rem] border-4 border-black/[.06] bg-white p-3 shadow-popup">
            <div className="overflow-hidden rounded-[2rem]">
              <div className="relative flex aspect-[3/4] flex-col items-center justify-center gap-2 bg-gradient-to-b from-amber-soft to-teal-soft">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-avatar text-3xl font-bold text-white shadow-card">
                  🐕
                </div>
                <p className="font-bold tracking-tight2 text-ink">น้องถุงเงิน, 2 ปี</p>
                <p className="text-xs text-ink-2">ชิวาวา · กรุงเทพฯ</p>
                <div className="absolute inset-x-0 bottom-0 flex justify-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white text-ink-3 shadow-card">
                    ✕
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-cta shadow-cta">
                    <Heart size={20} className="text-white" fill="white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="scroll-mt-16 bg-white px-6 py-16">
        <div className="mx-auto max-w-lg text-center">
          <h2 className="text-2xl font-bold tracking-title text-ink">ใช้งานยังไง?</h2>
          <p className="mt-2 text-ink-2">ง่ายแค่ 3 ขั้นตอน</p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            {[
              { icon: Camera, tone: "coral", title: "สร้างโปรไฟล์", desc: "อัปโหลดรูปน้อง เพิ่มข้อมูลและนิสัย ใช้เวลาไม่ถึง 2 นาที" },
              { icon: Hand, tone: "teal", title: "ปัดเลือก", desc: "ดูโปรไฟล์น้องหมาแมวใกล้บ้าน ชอบใครกด ❤️ ไม่ชอบปัดผ่าน" },
              { icon: PartyPopper, tone: "amber", title: "แมตช์แล้วนัดเจอ", desc: "ถ้าชอบกันทั้งสองฝั่ง แมตช์เด้ง! คุยแชทแล้วนัดพาน้องมาเจอกัน" },
            ].map(({ icon: Icon, tone, title, desc }) => (
              <div key={title} className="flex flex-1 flex-col items-center gap-3 rounded-card bg-gradient-app p-5 shadow-card">
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-chip ${
                    tone === "coral" ? "bg-coral-soft text-coral" : tone === "teal" ? "bg-teal-soft text-teal-ink" : "bg-amber-soft text-amber-deep"
                  }`}
                >
                  <Icon size={24} />
                </span>
                <p className="font-bold tracking-tight2 text-ink">{title}</p>
                <p className="text-center text-sm text-ink-2">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TWO MODES ── */}
      <section id="modes" className="scroll-mt-16 px-6 py-16">
        <div className="mx-auto max-w-lg text-center">
          <h2 className="text-2xl font-bold tracking-title text-ink">เลือกโหมดที่ใช่</h2>
          <p className="mt-2 text-ink-2">เปิดได้ทั้ง 2 โหมดพร้อมกัน</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-card border border-teal/20 bg-white p-6 text-left shadow-card">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-chip bg-teal text-white">
                <Users size={24} />
              </div>
              <h3 className="text-lg font-bold tracking-tight2 text-ink">หาเพื่อนเล่น</h3>
              <p className="mt-2 text-sm text-ink-2">จับคู่กับน้องหมา/แมวแถวบ้าน นัดเดินเล่น ออกกำลังกายด้วยกัน</p>
              {["กรองตามสายพันธุ์และจังหวัด", "แชทก่อนนัดเจอ", "เพศไหนก็ได้"].map((f) => (
                <div key={f} className="mt-2 flex items-center gap-2 text-xs text-ink-2">
                  <CheckCircle2 size={14} className="text-teal" />
                  {f}
                </div>
              ))}
            </div>
            <div className="rounded-card border border-amber/30 bg-white p-6 text-left shadow-card">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-chip bg-amber text-white">
                <Heart size={24} />
              </div>
              <h3 className="text-lg font-bold tracking-tight2 text-ink">หาคู่ผสมพันธุ์</h3>
              <p className="mt-2 text-sm text-ink-2">หาคู่สายพันธุ์เดียวกัน เพศตรงข้าม เพื่อให้ได้ลูกสุขภาพดี</p>
              {["กรองเฉพาะสายพันธุ์เดียวกัน", "ดูข้อมูลวัคซีนและทำหมัน", "แชทพูดคุยกับเจ้าของ"].map((f) => (
                <div key={f} className="mt-2 flex items-center gap-2 text-xs text-ink-2">
                  <CheckCircle2 size={14} className="text-amber-deep" />
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Care teaser */}
          <div className="mt-4 flex items-center gap-3 rounded-card border border-blue/20 bg-white p-5 text-left shadow-card">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-chip bg-blue-soft text-blue-ink">
              <Stethoscope size={24} />
            </span>
            <div>
              <h3 className="font-bold tracking-tight2 text-ink">ดูแลน้องครบจบในแอปเดียว</h3>
              <p className="mt-1 text-sm text-ink-2">หาโรงพยาบาล ประกาศสัตว์หาย บริจาคเลือด และสมุดสุขภาพ</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-md overflow-hidden rounded-card bg-gradient-cta px-6 py-12 text-center text-white shadow-cta">
          <PawPrint size={40} className="mx-auto mb-4 opacity-90" fill="currentColor" />
          <h2 className="text-2xl font-bold tracking-title">พร้อมหาเพื่อนให้น้องแล้วใช่ไหม?</h2>
          <p className="mt-2 opacity-90">สมัครฟรี ไม่มีค่าใช้จ่าย — ลองใช้งานได้เลยตอนนี้</p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 font-bold text-coral shadow-card transition-transform active:scale-95"
          >
            <PawPrint size={18} fill="currentColor" />
            เริ่มต้นเลย — ฟรี!
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-ink text-white/70">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="flex flex-col gap-10 md:flex-row md:justify-between">
            {/* Brand */}
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-logo shadow-[0_6px_14px_-6px_rgba(239,78,60,.6)]">
                  <PawPrint size={18} className="text-white" fill="currentColor" />
                </span>
                <span className="text-lg font-bold tracking-tight2 text-white">PawMate</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/55">
                หาเพื่อน หาคู่ ให้เจ้าตัวน้อยของคุณ — แอปจับคู่หมาและแมวในไทย พร้อมบริการดูแลน้องครบในที่เดียว
              </p>
              <div className="mt-4 flex gap-2.5">
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                >
                  <Github size={17} />
                </a>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  aria-label="อีเมล"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                >
                  <Mail size={17} />
                </a>
              </div>
            </div>

            {/* Link columns */}
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              <FooterCol title="ฟีเจอร์">
                <li><a href="#how" className="transition-colors hover:text-white">วิธีใช้งาน</a></li>
                <li><a href="#modes" className="transition-colors hover:text-white">หาเพื่อนเล่น / หาคู่</a></li>
                <li><a href="#modes" className="transition-colors hover:text-white">ดูแลน้อง</a></li>
              </FooterCol>
              <FooterCol title="เริ่มต้น">
                <li><Link href="/login" className="transition-colors hover:text-white">ลองเดโม</Link></li>
                <li><Link href="/login" className="transition-colors hover:text-white">เข้าสู่ระบบ</Link></li>
                <li><Link href="/login" className="transition-colors hover:text-white">สมัครฟรี</Link></li>
              </FooterCol>
              <FooterCol title="ข้อมูล">
                <li><Link href="/privacy" className="transition-colors hover:text-white">นโยบายความเป็นส่วนตัว</Link></li>
                <li><a href={`mailto:${CONTACT_EMAIL}`} className="transition-colors hover:text-white">ติดต่อเรา</a></li>
                <li>
                  <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
                    ซอร์สโค้ด (GitHub)
                  </a>
                </li>
              </FooterCol>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} PawMate · โปรเจกต์พอร์ตโฟลิโอโดย{" "}
              <span className="font-semibold text-white/70">Thanat Tam Kongchasingha</span>
            </p>
            <p>Built with Next.js · Supabase · Tailwind CSS</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
