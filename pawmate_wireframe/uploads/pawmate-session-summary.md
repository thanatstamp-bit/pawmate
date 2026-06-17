# 📋 PawMate — Session Summary (สำหรับ context ต่อใน chat ใหม่)

> วิธีใช้: แนบไฟล์นี้หรือ paste เนื้อหาตอนเปิด chat ใหม่ แล้วถามต่อได้เลย

## 1. โปรเจกต์คืออะไร

**PawMate** — web app หาคู่ให้สัตว์เลี้ยง เน้นหมาและแมว สไตล์ "Tinder for pets" มี **2 โหมดในแอปเดียว**:

- **โหมดหาเพื่อนเล่น (Playdate)** — หาเพื่อนให้สัตว์เลี้ยง นัดเจอกัน เน้นนิสัย/พื้นที่
- **โหมดหาคู่ผสมพันธุ์ (Breeding)** — จับคู่ตามสายพันธุ์ เพศตรงข้าม มีข้อมูลวัคซีน/ทำหมันประกอบ

**Portfolio project ที่ใช้งานได้จริง** — เป้าหมายคือ live demo, case study, ไม่ใช่รายได้

## 2. Tech Stack

- **Next.js 14 App Router + TypeScript + Tailwind CSS**
- **Supabase**: Auth (email/password), Postgres, Storage (รูปสัตว์), Realtime (แชท)
- **Deploy**: Vercel (free tier)
- ไม่มี test suite — ใช้ `npx tsc --noEmit` เป็น correctness check หลัก

## 3. Design System

| Token | ค่า | ใช้กับ |
|---|---|---|
| `bg-cream` | `#FFF8F0` | พื้นหลังทุกหน้า |
| `coral` | `#FF6B5B` | ปุ่มหลัก, ไลก์ |
| `teal` | `#2EC4B6` | โหมด playdate |
| `amber` | `#FFB84C` | โหมด breeding |
| `brown` | `#2D2A26` | ตัวอักษรหลัก |
| `rounded-card` | 20px | การ์ดทุกใบ |
| `shadow-card` | 0 4px 16px rgba(0,0,0,0.06) | elevation |

Font: **Prompt** (ครอบคลุมทั้งไทยและอังกฤษ) / Icons: lucide-react เท่านั้น / UI ภาษาไทย, โค้ด/คอมเมนต์ภาษาอังกฤษ

## 4. โครงสร้างหน้า (Routes)

| Path | หน้า |
|---|---|
| `/` | Landing page (สาธารณะ) |
| `/login` | Login/Signup + ปุ่ม Demo |
| `/onboarding` | Wizard 4 ขั้นสร้างโปรไฟล์น้อง |
| `/app/home` | **หน้าแรก** — รูปน้อง + stats + quick actions |
| `/app/swipe` | ปัดการ์ด (หน้าหลัก) |
| `/app/matches` | รายชื่อแมตช์ (แชท + นัดหมาย) |
| `/app/chat/[matchId]` | แชทแบบ realtime + จัดการ trust |
| `/app/dashboard` | จัดการน้อง + สถิติ + ตั้งค่าบัญชี |
| `/app/profile` | ดูและแก้โปรไฟล์น้อง |

## 5. Database Schema

5 ตารางหลัก + trust layer + playdates:

```
profiles        → เจ้าของ (id = auth.users.id)
pets            → สัตว์เลี้ยง (owner_id, species, breed, sex, birth_month, photos[], modes[], ...)
likes           → ทิศทางเดียว unique(from_pet_id, to_pet_id, mode)
matches         → เกิดเมื่อ like ตรงกัน (pet_a_id < pet_b_id เสมอ)
messages        → แชทในแต่ละ match
playdate_spots  → สถานที่ผ่านการ seed
playdate_proposals → นัดหมายระหว่าง match
reviews         → ดาว 1-5 + tags + comment (unique per match per reviewer)
reports         → รายงานผู้ใช้
blocks          → บล็อก (bidirectional, ไม่ลบข้อมูล)
```

**RLS helpers ใน 001_init.sql**: `owns_pet(pet_id)` และ `is_in_match(match_id)` — ใช้ใน policy ทุกตาราง

**Migration ที่ต้อง run ใน Supabase SQL Editor ด้วยตัวเอง:**
- `001_init.sql` → `002_storage_policies.sql` → `008_playdates.sql` → `009_demo_match.sql` → `010_trust.sql`
- ห้ามแก้ `001_init.sql` เด็ดขาด — เพิ่มไฟล์ migration ใหม่เท่านั้น

## 6. Patterns สำคัญ

**Active pet pattern** — ทุกหน้าที่ query ข้อมูลต้อง resolve ด้วย 2 ขั้น:
```ts
const storedId = localStorage.getItem("pawmate_active_pet_id");
// 1. validate storedId ว่าเป็นของ user คนนี้จริง
// 2. ถ้าไม่มีหรือ invalid → เอาตัวแรก แล้ว setItem ใหม่
```

**Block semantics** — `getBlockedPetIds()` ใน `lib/blocks.ts` คืน `Set<string>` ทั้ง 2 ทิศทาง ใช้ filter ใน memory ห้ามลบ row

**Match uniqueness** — `pet_a_id` < `pet_b_id` เสมอ (ใช้ LEAST/GREATEST) ป้องกัน (A,B) / (B,A) ซ้ำ

**z-index convention** — bottom sheets/modals เหนือ swipe deck: `z-[60]`, match popup: `z-[70]`

**Supabase client** — browser → `lib/supabase/client.ts`, server action → `lib/supabase/server.ts`, seed script เท่านั้นที่ใช้ service role key

---

## 7. สิ่งที่ทำไปแล้ว (ทุก session รวมกัน)

### Phase 0–5 (Build MVP)
✅ Project setup, Tailwind design system, Supabase client helpers  
✅ Auth (email/password + demo button → `DEMO_EMAIL`/`DEMO_PASSWORD` env vars)  
✅ Onboarding wizard 4 ขั้น  
✅ Swipe feed + match logic + match popup animation  
✅ Matches list + realtime chat  
✅ Landing page + profile page + seed script (~100 pets)

### Phase 6 — Trust Layer
✅ Migration `010_trust.sql` (reviews, reports, blocks + RLS)  
✅ `lib/blocks.ts` — `getBlockedPetIds()` helper  
✅ `components/trust/ReviewModal.tsx` — ให้ดาว + tags + comment, edit ได้ (unique per match)  
✅ `components/trust/ReportSheet.tsx` — bottom sheet รายงาน  
✅ `components/trust/BlockConfirm.tsx` — confirm dialog บล็อก  
✅ `components/trust/RatingSummary.tsx` — แสดงค่าเฉลี่ย + รีวิวล่าสุดใน detail sheet  
✅ `components/trust/Toast.tsx` — แจ้งเตือนหลังรายงาน/รีวิว  
✅ Swipe card + detail sheet — badges วัคซีน/ทำหมัน, chip "ยังไม่ยืนยันวัคซีน", ปุ่มรายงาน/บล็อก  
✅ Chat page — ⋮ menu → รีวิว / รายงาน / บล็อก; block guard redirect  
✅ Matches page — filter blocked pets ออกจากรายการ

### UI Improvements (PetCard Detail Sheet)
✅ ปิด sheet ได้ด้วยการเลื่อนลง (drag-to-dismiss) — ใช้ `useRef` ไม่ใช่ `useState` ป้องกัน re-render ระหว่างลาก  
✅ ปุ่ม X สำหรับ PC บน `sticky` header ทำให้เห็นตลอดเวลาขณะเลื่อน  
✅ ระยะห่าง X button กับขอบบน — ใช้ `absolute right-4 top-3`  
✅ รูปภาพใน strip — อัตราส่วน 1:1 (`aspect-square object-cover`), hover scale + ZoomIn icon  
✅ Lightbox เป็น popup สี่เหลี่ยมจัตุรัส (`aspect-square w-[85vw] max-w-[400px]`, `z-[60]`) พร้อมปุ่มซ้าย/ขวา + dots indicator

### Bug Fix — Breeding Mode Swipe
✅ **root cause**: `prevLikedIds` ถูก fetch เฉพาะตอน `recycle=false` ทำให้ไลก์แล้ว card กลับมาซ้ำ  
✅ **fix 1**: fetch `prevLikedIds` จาก DB ทุกครั้ง (ลบ `if (!recycle)` guard ออก)  
✅ **fix 2**: recycle mode รวม `prevLikedIds` เข้าไปใน `seen` Set ด้วย  
✅ **fix 3**: auto-recycle ล้างแค่ `skippedIds` ไม่ล้าง `likedIds`

### หน้าแรก + Global Header (Session ล่าสุด)
✅ **`components/AppHeader.tsx`** — logo + "PawMate" text ลิงก์ไป `/app/home`  
✅ **`components/ConditionalAppHeader.tsx`** — client component แสดง AppHeader ทุกหน้า ยกเว้น `/app/chat/*`  
✅ **`app/app/layout.tsx`** — เพิ่ม ConditionalAppHeader ก่อน `{children}` ทำให้ logo อยู่ทุกหน้าอัตโนมัติ  
✅ **`components/BottomNav.tsx`** — เพิ่มแท็บ "หน้าแรก" (Home icon) เป็นตัวซ้ายสุด (5 แท็บ)  
✅ **`app/app/home/page.tsx`** — หน้าแรก: pet hero card (รูป + ชื่อ + mode badges), stats row (ไลก์ที่ได้รับ / แมตช์ทั้งหมด), ปุ่ม "ปัดการ์ดเลย" + "ดูแมตช์และแชท"  
✅ **`app/app/swipe/page.tsx`** — เอา header logo ออก (layout จัดการ), ย้าย filter button ไปแถวเดียวกับ mode toggle

### CLAUDE.md
✅ **เขียนใหม่ทั้งไฟล์** — แทนที่ vibe coding kit เก่าด้วย technical reference สำหรับ Claude Code:
- Commands (dev, build, lint, tsc, seed scripts)
- Route layout + architecture
- Active pet pattern + Supabase client patterns
- Key helpers (lib/match.ts, lib/blocks.ts)
- Swipe feed logic + realtime chat
- Database migration sequence + RLS patterns
- Design system tokens + z-index conventions
- Environment variables

---

## 8. Environment Variables ที่ต้องมีใน `.env.local`

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
DEMO_EMAIL
DEMO_PASSWORD
SUPABASE_SERVICE_ROLE_KEY   # seed scripts เท่านั้น ห้ามใช้ใน frontend
```

## 9. คำสั่งที่ใช้บ่อย

```bash
npm run dev
npx tsc --noEmit                                                    # ตรวจ type หลังแก้โค้ด
npx ts-node --project scripts/tsconfig.json scripts/seed.ts        # seed pets
npx ts-node --project scripts/tsconfig.json scripts/seed-spots.ts  # seed สถานที่
```

## 10. สิ่งที่ยังต้องทำ / ตรวจสอบ

- [ ] **Run `010_trust.sql`** ใน Supabase SQL Editor (ถ้ายังไม่ได้ run)
- [ ] **ทดสอบ 2 บัญชี** — บล็อก → card หายทั้งสองฝั่ง, รีวิว → ค่าเฉลี่ยถูกต้อง, รายงาน → toast ขึ้น
- [ ] **RLS spot-check** — session ที่ไม่ใช่เจ้าของ pet ต้อง INSERT review/block ไม่ได้
- [ ] บันทึกใน `DEVLOG.md` ว่า `010_trust.sql` ต้อง run manual
