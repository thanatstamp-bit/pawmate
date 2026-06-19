import Link from "next/link";
import Image from "next/image";
import { PawPrint, Users, Heart, ArrowRight, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-cream">

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 border-b border-black/5 bg-cream/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-5">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="PawMate" width={36} height={36} className="drop-shadow-sm" />
            <span className="text-base font-bold text-brown">PawMate</span>
          </Link>
          {/* Auth buttons */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-full border border-brown/20 bg-white px-4 py-1.5 text-sm font-bold text-brown transition-colors hover:border-coral/40"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-coral px-4 py-1.5 text-sm font-bold text-white transition-colors hover:bg-coral-dark"
            >
              สมัครฟรี
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-6 pb-16 pt-14 text-center">
        <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-coral/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-32 h-60 w-60 rounded-full bg-teal/10 blur-3xl" />
        <div className="relative mx-auto max-w-lg">
          <div className="mb-5 flex justify-center">
            <Image src="/logo.png" alt="PawMate" width={120} height={120} className="drop-shadow-lg" />
          </div>
          <h1 className="text-4xl font-bold leading-tight text-brown">
            หาเพื่อน หาคู่
            <br />
            <span className="text-coral">ให้เจ้าตัวน้อยของคุณ</span>
          </h1>
          <p className="mt-4 text-lg text-brown-muted">
            แอปจับคู่สำหรับหมาและแมวในไทย — หาเพื่อนเล่นใกล้บ้าน
            หรือหาคู่ผสมพันธุ์สายพันธุ์เดียวกัน
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-coral px-8 py-3.5 font-bold text-white shadow-lg transition-all hover:bg-coral-dark sm:w-auto"
            >
              <PawPrint size={18} />
              ลองเล่นเลย
            </Link>
            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-brown/20 bg-white px-8 py-3.5 font-bold text-brown transition-all hover:border-coral/40 sm:w-auto"
            >
              สมัครฟรี
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        {/* Phone mockup */}
        <div className="mx-auto mt-12 max-w-[240px]">
          <div className="rounded-[2.5rem] border-4 border-brown/10 bg-white p-3 shadow-2xl">
            <div className="overflow-hidden rounded-[2rem] bg-cream">
              <div className="relative flex aspect-[3/4] flex-col items-center justify-center gap-2 bg-gradient-to-b from-amber/20 to-teal/20">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/80 text-4xl shadow-card">
                  🐕
                </div>
                <p className="font-bold text-brown">น้องถุงเงิน, 2 ปี</p>
                <p className="text-xs text-brown-muted">ชิวาวา · กรุงเทพฯ</p>
                <div className="absolute inset-x-0 bottom-0 flex justify-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-black/10 bg-white shadow">✕</div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-coral shadow">
                    <Heart size={20} className="text-white" fill="white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-lg text-center">
          <h2 className="text-2xl font-bold text-brown">ใช้งานยังไง?</h2>
          <p className="mt-2 text-brown-muted">ง่ายแค่ 3 ขั้นตอน</p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            {[
              { icon: "📸", title: "สร้างโปรไฟล์", desc: "อัปโหลดรูปน้อง เพิ่มข้อมูลและนิสัย ใช้เวลาไม่ถึง 2 นาที" },
              { icon: "👆", title: "ปัดเลือก", desc: "ดูโปรไฟล์น้องหมาแมวใกล้บ้าน ชอบใครกด ❤️ ไม่ชอบปัดผ่าน" },
              { icon: "🎉", title: "แมตช์แล้วนัดเจอ", desc: "ถ้าชอบกันทั้งสองฝั่ง แมตช์เด้ง! คุยแชทแล้วนัดพาน้องมาเจอกัน" },
            ].map((s) => (
              <div key={s.title} className="flex flex-1 flex-col items-center gap-3 rounded-card bg-cream p-5">
                <div className="text-3xl">{s.icon}</div>
                <p className="font-bold text-brown">{s.title}</p>
                <p className="text-center text-sm text-brown-muted">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TWO MODES ── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-lg text-center">
          <h2 className="text-2xl font-bold text-brown">เลือกโหมดที่ใช่</h2>
          <p className="mt-2 text-brown-muted">เปิดได้ทั้ง 2 โหมดพร้อมกัน</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-card border-2 border-teal/30 bg-teal/10 p-6 text-left">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal text-white">
                <Users size={24} />
              </div>
              <h3 className="text-lg font-bold text-brown">หาเพื่อนเล่น</h3>
              <p className="mt-2 text-sm text-brown-muted">จับคู่กับน้องหมา/แมวแถวบ้าน นัดเดินเล่น ออกกำลังกายด้วยกัน</p>
              {["กรองตามสายพันธุ์และจังหวัด", "แชทก่อนนัดเจอ", "เพศไหนก็ได้"].map((f) => (
                <div key={f} className="mt-2 flex items-center gap-2 text-xs text-brown-muted">
                  <CheckCircle2 size={14} className="text-teal" />{f}
                </div>
              ))}
            </div>
            <div className="rounded-card border-2 border-amber/30 bg-amber/10 p-6 text-left">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber text-white">
                <Heart size={24} />
              </div>
              <h3 className="text-lg font-bold text-brown">หาคู่ผสมพันธุ์</h3>
              <p className="mt-2 text-sm text-brown-muted">หาคู่สายพันธุ์เดียวกัน เพศตรงข้าม เพื่อให้ได้ลูกสุขภาพดี</p>
              {["กรองเฉพาะสายพันธุ์เดียวกัน", "ดูข้อมูลวัคซีนและทำหมัน", "แชทพูดคุยกับเจ้าของ"].map((f) => (
                <div key={f} className="mt-2 flex items-center gap-2 text-xs text-brown-muted">
                  <CheckCircle2 size={14} className="text-amber" />{f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-coral px-6 py-16 text-center text-white">
        <div className="mx-auto max-w-md">
          <PawPrint size={40} className="mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl font-bold">พร้อมหาเพื่อนให้น้องแล้วใช่ไหม?</h2>
          <p className="mt-2 opacity-80">สมัครฟรี ไม่มีค่าใช้จ่าย — ลองใช้งานได้เลยตอนนี้</p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 font-bold text-coral shadow-lg transition-all hover:bg-cream"
          >
            <PawPrint size={18} />
            เริ่มต้นเลย — ฟรี!
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-brown px-6 py-8 text-center text-white/60">
        <p className="text-sm">
          Portfolio project by{" "}
          <span className="font-bold text-white">Thanat Tam Kongchasingha</span>
        </p>
        <p className="mt-1 text-xs">Built with Next.js · Supabase · Tailwind CSS</p>
        <Link href="/privacy" className="mt-3 inline-block text-xs text-white/70 underline hover:text-white">
          นโยบายความเป็นส่วนตัว
        </Link>
      </footer>
    </main>
  );
}
