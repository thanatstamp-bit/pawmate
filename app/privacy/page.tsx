import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "นโยบายความเป็นส่วนตัว — PawMate",
  description: "นโยบายความเป็นส่วนตัวของ PawMate — ข้อมูลที่เราเก็บ วิธีใช้งาน และสิทธิ์ของคุณ",
};

// Public privacy policy page (no auth). Required by Google/Meta when an OAuth
// app is published, and linked from the landing footer + provider consent
// screens (set this URL in the Meta app + Google consent screen settings).
export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-cream">
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-black/5 bg-cream/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="PawMate" width={36} height={36} className="drop-shadow-sm" />
            <span className="text-base font-bold text-brown">PawMate</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-full border border-brown/20 bg-white px-4 py-1.5 text-sm font-bold text-brown transition-colors hover:border-coral/40"
          >
            <ArrowLeft size={15} />
            กลับหน้าแรก
          </Link>
        </div>
      </nav>

      <article className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-3xl font-bold text-brown">นโยบายความเป็นส่วนตัว</h1>
        <p className="mt-2 text-sm text-brown-muted">อัปเดตล่าสุด: 19 มิถุนายน 2026</p>

        <div className="mt-4 rounded-card bg-amber/10 p-4 text-sm leading-relaxed text-brown">
          PawMate เป็น <strong>โปรเจกต์สาธิต (portfolio project)</strong> สำหรับแสดงผลงาน
          ไม่ใช่บริการเชิงพาณิชย์ นโยบายนี้อธิบายว่าเราเก็บและใช้ข้อมูลอะไรบ้างเมื่อคุณใช้งานแอป
        </div>

        {/* Reusable section blocks */}
        <Section title="1. ข้อมูลที่เราเก็บ">
          <ul className="list-disc space-y-1.5 pl-5">
            <li><strong>ข้อมูลบัญชี:</strong> อีเมล และชื่อที่ใช้แสดง</li>
            <li><strong>ข้อมูลสัตว์เลี้ยง:</strong> ชื่อ สายพันธุ์ เพศ อายุ รูปภาพ จังหวัด/อำเภอ นิสัย และข้อมูลสุขภาพที่คุณกรอกเอง (เช่น วัคซีน การทำหมัน)</li>
            <li><strong>ข้อความแชท:</strong> ข้อความที่คุณส่งถึงผู้ใช้ที่แมตช์กัน</li>
            <li><strong>ตำแหน่งโดยประมาณ:</strong> ใช้เฉพาะตอนคุณกด &quot;ใกล้ฉัน&quot; ในหน้าค้นหาโรงพยาบาลสัตว์ เพื่อเรียงลำดับตามระยะทาง — เราไม่ได้บันทึกพิกัดของคุณไว้</li>
          </ul>
        </Section>

        <Section title="2. การเข้าสู่ระบบด้วย Google / Facebook">
          <p>
            หากคุณเลือกเข้าสู่ระบบด้วย Google หรือ Facebook เราจะรับเฉพาะ
            <strong> อีเมล ชื่อ และรูปโปรไฟล์</strong> จากผู้ให้บริการนั้น เพื่อสร้างบัญชีให้คุณเท่านั้น
            เรา <strong>ไม่</strong> เข้าถึงรายชื่อเพื่อน ไม่โพสต์อะไรลงบัญชีโซเชียลของคุณ
            และไม่เก็บรหัสผ่านของบัญชีโซเชียลใดๆ
          </p>
        </Section>

        <Section title="3. เราใช้ข้อมูลเพื่ออะไร">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>แสดงโปรไฟล์สัตว์เลี้ยงของคุณให้ผู้ใช้คนอื่นเพื่อจับคู่ (หาเพื่อนเล่น / หาคู่ผสมพันธุ์)</li>
            <li>ให้บริการแชท การนัดหมาย และฟีเจอร์ดูแล (โรงพยาบาลสัตว์ สัตว์หาย บริจาคเลือด สมุดสุขภาพ)</li>
            <li>รักษาความปลอดภัยของบัญชีและป้องกันการใช้งานที่ไม่เหมาะสม</li>
          </ul>
        </Section>

        <Section title="4. การเปิดเผยข้อมูล">
          <ul className="list-disc space-y-1.5 pl-5">
            <li><strong>ผู้ใช้คนอื่น:</strong> โปรไฟล์สัตว์เลี้ยงของคุณจะแสดงให้ผู้ใช้คนอื่นเห็นเพื่อการจับคู่</li>
            <li><strong>หน้าประกาศสัตว์หาย:</strong> หากคุณสร้างประกาศสัตว์หาย หน้าดังกล่าวจะเป็นแบบ <strong>สาธารณะ</strong> (เปิดดูได้โดยไม่ต้องล็อกอิน) เพื่อให้แชร์ช่วยตามหาได้ — ข้อมูลที่แสดงเป็นข้อมูลที่คุณกรอกเองในประกาศ</li>
            <li>เราไม่ขายข้อมูลส่วนบุคคลของคุณให้บุคคลที่สาม</li>
          </ul>
        </Section>

        <Section title="5. การจัดเก็บและความปลอดภัย">
          <p>
            ข้อมูลถูกจัดเก็บบน <strong>Supabase</strong> (ฐานข้อมูล Postgres และพื้นที่เก็บรูปภาพ)
            โดยมีการควบคุมสิทธิ์การเข้าถึงระดับแถว (Row Level Security) เพื่อให้ผู้ใช้เข้าถึงได้เฉพาะข้อมูลที่ตนมีสิทธิ์
          </p>
        </Section>

        <Section title="6. สิทธิ์ของคุณ">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>แก้ไขข้อมูลโปรไฟล์และสัตว์เลี้ยงได้ตลอดเวลาในหน้าโปรไฟล์</li>
            <li>ลบประกาศ ข้อมูลสุขภาพ หรือเนื้อหาที่คุณสร้างได้</li>
            <li>ขอลบบัญชีและข้อมูลที่เกี่ยวข้องได้ โดยติดต่อตามช่องทางด้านล่าง</li>
          </ul>
        </Section>

        <Section title="7. เด็กและเยาวชน">
          <p>แอปนี้มีไว้สำหรับผู้ใช้ทั่วไป ไม่ได้ออกแบบมาเพื่อเก็บข้อมูลจากเด็กอายุต่ำกว่า 13 ปีโดยเฉพาะ</p>
        </Section>

        <Section title="8. การเปลี่ยนแปลงนโยบาย">
          <p>เราอาจปรับปรุงนโยบายนี้เป็นครั้งคราว การเปลี่ยนแปลงจะแสดงในหน้านี้พร้อมวันที่อัปเดตล่าสุด</p>
        </Section>

        <Section title="9. ติดต่อเรา">
          <p>
            หากมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัว หรือต้องการขอลบบัญชี/ข้อมูล ติดต่อได้ที่{" "}
            <a href="mailto:thanat.stamp@gmail.com" className="font-bold text-coral underline">
              thanat.stamp@gmail.com
            </a>
          </p>
        </Section>
      </article>

      <footer className="bg-brown px-6 py-8 text-center text-white/60">
        <p className="text-sm">
          Portfolio project by{" "}
          <span className="font-bold text-white">Thanat Tam Kongchasingha</span>
        </p>
      </footer>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="text-lg font-bold text-brown">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-brown-muted">{children}</div>
    </section>
  );
}
