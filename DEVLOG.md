# PawMate — Developer Log & Handoff Notes (รวมศูนย์)

> บันทึกสิ่งที่ทำไปในแต่ละ session + roadmap + แผนเฟสถัดไป รวมไว้ในไฟล์เดียว
> อัปเดตล่าสุด: 2026-06-19 (Session 20 — Landing page navbar)
>
> **โครงไฟล์เอกสารโปรเจกต์ตอนนี้มี 2 ไฟล์:**
> - `CLAUDE.md` — instructions ที่ Claude Code โหลดอัตโนมัติทุก session (architecture, rules, design system) — **แก้ที่นั่นเมื่อ architecture เปลี่ยน**
> - `DEVLOG.md` (ไฟล์นี้) — session history + patterns + bugs + roadmap + แผนเฟสถัดไป — ไม่ได้ auto-load อ่านเมื่อต้องการ context เชิงลึก

สารบัญ:
1. [โปรเจกต์คืออะไร](#โปรเจกต์คืออะไร)
2. [สถานะปัจจุบัน + ค้างทำ](#สถานะปัจจุบัน)
3. [Environment & Infrastructure](#environment--infrastructure)
4. [Tech Stack & Design System](#tech-stack)
5. [Database Schema](#database-schema)
6. [File Structure](#file-structure)
7. [Logic สำคัญ](#logic-สำคัญ)
8. [Patterns & Conventions](#patterns--conventions)
9. [Bugs ที่แก้ไปแล้ว](#bugs)
10. [Git & Deploy Status](#git--deploy-status)
11. [QA Checklist](#qa-checklist)
12. [Session History (สรุปย่อ)](#session-history)
13. [ROADMAP — Expansion Kit (Phase 6–11)](#roadmap)
14. [PHASE 10 PLAN — Health Book (เต็ม)](#phase-10-plan)

---

## โปรเจกต์คืออะไร

**PawMate** — web app หาคู่ให้สัตว์เลี้ยง เน้นหมาและแมว สไตล์ "Tinder for pets" มี **2 โหมดในแอปเดียว**:
- **โหมดหาเพื่อนเล่น (Playdate)** — หาเพื่อนให้สัตว์เลี้ยง นัดเจอกัน เน้นนิสัย/พื้นที่
- **โหมดหาคู่ผสมพันธุ์ (Breeding)** — จับคู่ตามสายพันธุ์ เพศตรงข้าม มีข้อมูลวัคซีน/ทำหมันประกอบ

Portfolio project ที่ใช้งานได้จริง — เป้าหมายคือ live demo / case study ไม่ใช่รายได้

---

## สถานะปัจจุบัน

✅ Phase 0 — Project Setup & Database
✅ Phase 1 — Auth + Demo Account
✅ Phase 2 — Onboarding (Create Pet Profile)
✅ Phase 3 — Swipe Page + Match Logic
✅ Phase 4 — Matches List + Realtime Chat
✅ Phase 5 — Landing Page, Profile Page & Seed Data
✅ Phase 6 — Trust Layer (reviews/reports/blocks/badges) — UI ปรับให้ตรง wireframe แล้ว (Session 12)
✅ Deploy ไป Vercel — ผ่านสมบูรณ์ (2026-06-12)
✅ Phase 7 — Care Hub + Vet Hospital Finder (Session 13–14)
✅ Phase 8 — Lost Pet Board / ประกาศสัตว์หาย (Session 15) — public share page ยกระดับให้ตรง wireframe (Session 18)
✅ Phase 9 — Blood Donation Center / ศูนย์บริจาคเลือด (Session 17)
✅ **Phase 10 — สมุดสุขภาพ (Health Book) — เสร็จสมบูรณ์ (Session 19)** — commit `e4fdbfc`
🔲 Phase 11 — Tele-vet demo (optional)

### ⚠️ ค้างทำก่อนใช้งานจริง (blockers)

- [ ] **ยังไม่ได้ทดสอบ UI จริงในเบราว์เซอร์/มือถือ** สำหรับงานหลาย session — โดยเฉพาะ: Trust Layer 6 frame, Phase 9 blood ทั้งหมด, Phase 10 health book
- [x] ~~รัน migration `014_blood.sql`~~ — รันแล้ว (Session 19) ✅
- [x] ~~รัน migration `015_health.sql`~~ — รันแล้ว (Session 19) ✅
- [x] ~~รัน migration 011/012/013~~ — รันแล้ว Session 17 ✅
- [x] ~~รัน seed-hospitals.ts~~ — รันแล้ว Session 17 (30 hospitals) ✅
- [x] ~~tile "แดชบอร์ด" dead link ใน `/app/home`~~ — แก้แล้ว Session 15
- [x] ~~mode toggle หายเมื่อ pet มีแค่ 1 mode~~ — แก้แล้ว Session 15
- [x] ~~greeting "สวัสดี, X" ไม่เปลี่ยนตาม active pet~~ — แก้แล้ว Session 16

---

## Environment & Infrastructure

### Working Directory
- **พัฒนาที่:** `C:\dev\pawmate` (ไม่ใช่ G: drive เพราะ Google Drive ทำให้ npm มีปัญหา EBADF)
- **Sync ไป Google Drive:** ใช้ robocopy หรือ git
- **Git email:** thanat.stamp@gmail.com

### Supabase Project
- **URL:** `https://wbxryllyewprswalbwpg.supabase.co`
- **Project ID:** `wbxryllyewprswalbwpg`

### Environment Variables (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sb_publishable_...>
SUPABASE_SERVICE_ROLE_KEY=<sb_secret_... — ดูใน Supabase dashboard อย่า commit>
DEMO_EMAIL=demo@pawmate.app
DEMO_PASSWORD=<ตั้งเอง>
```
> ⚠️ SUPABASE_SERVICE_ROLE_KEY ใช้เฉพาะ seed script เท่านั้น ห้าม commit และห้ามใช้ใน frontend

### Supabase Settings ที่ต้องตั้ง
- **Auth → Email → Confirm email:** ปิด (disabled) — ไม่งั้น signup ติด email rate limit บน free tier
- **Storage bucket:** `pet-photos` (public) — สร้างใน Supabase dashboard

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS (custom design system) |
| Backend | Supabase (Auth, Postgres, Storage, Realtime) |
| Icons | lucide-react |
| Map | leaflet + react-leaflet (v4) + OpenStreetMap (no API key) |
| Deploy | ✅ Vercel (deployed since 2026-06-12) |

### Design System (Tailwind custom — ตรงกับ `tailwind.config.ts`)
```
cream:       #FFF8F0  (background)
coral:       #FF6B5B  (primary, like button)
coral-dark:  #E85647
teal:        #2EC4B6  (playdate mode / found/positive states)
teal-dark:   #26A89C
amber:       #FFB84C  (breeding mode / due-soon warnings)
amber-dark:  #F0A636
rose:        #E0445A  (Session 12 — destructive/urgent เท่านั้น: block, delete review, lost status, urgent blood — ไม่ใช้แทน primary action)
brown:       #2D2A26  (text)
brown-muted: #8A8580  (muted text)
rounded-card: 20px
shadow-card:  0 4px 16px rgba(0,0,0,0.06)
```

### Fonts
- **Prompt** (ครอบคลุมทั้งไทยและอังกฤษในฟอนต์เดียว) — โหลดผ่าน `next/font/google`, CSS var `--font-prompt`, weights 300–700
- ตั้งใน `app/layout.tsx` (เปลี่ยนจาก Nunito + IBM Plex Sans Thai มาเป็น Prompt เดียวตั้งแต่ Session 4)

---

## Database Schema

### Tables

```sql
profiles
  id           uuid  PRIMARY KEY  (= auth.users.id)
  display_name text
  line_id      text  NULLABLE
  created_at   timestamptz

pets
  id               uuid  PRIMARY KEY
  owner_id         uuid  FK → profiles.id
  name             text
  species          text  ('dog' | 'cat')
  breed            text
  sex              text  ('male' | 'female')
  birth_month      date
  photos           text[]  (Supabase Storage URLs)
  personality_tags text[]
  province         text
  district         text  NULLABLE
  modes            text[]  ('playdate' | 'breeding')
  vaccinated       bool  NULLABLE
  neutered         bool  NULLABLE
  bio              text  NULLABLE
  created_at       timestamptz

likes        — id, from_pet_id FK, to_pet_id FK, mode, created_at · UNIQUE(from_pet_id, to_pet_id, mode)
matches      — id, pet_a_id FK, pet_b_id FK, mode, created_at · pet_a_id < pet_b_id เสมอ (sort ก่อน insert)
messages     — id, match_id FK, sender_pet_id FK, content, created_at

-- 008_playdates.sql --
playdate_spots     — id, name, type ('park'|'cafe'|'beach'|'resort'|'other'), province, district, address, description
playdate_proposals — id, match_id FK, proposer_pet_id FK, proposed_at, spot_id FK NULLABLE,
                     custom_location NULLABLE, note NULLABLE, status ('pending'|'accepted'|'declined'|'cancelled')

-- 010_trust.sql + 011_reviews_delete.sql --
reviews — id, match_id FK, reviewer_pet_id FK, reviewed_pet_id FK, rating int(1-5), tags text[],
          comment NULLABLE, created_at · UNIQUE(match_id, reviewer_pet_id) · DELETE policy เพิ่มใน 011
reports — id, reporter_pet_id FK, reported_pet_id FK, reason, details NULLABLE, created_at
blocks  — id, blocker_pet_id FK, blocked_pet_id FK, created_at · UNIQUE(blocker, blocked) + no-self CHECK

-- 012_hospitals.sql --
hospitals — id, name, province, district, address, phone, lat float8, lng float8,
            open_24h bool, services text[], created_at · public read-only RLS

-- 013_lost_pets.sql --
lost_pets          — id, reporter_id FK, pet_name, species, breed, photos text[], last_seen_province,
                     last_seen_district, last_seen_detail, lost_date date, distinguishing_marks,
                     contact, reward NULLABLE, status ('lost'|'found'), created_at · anon SELECT
lost_pet_sightings — id, lost_pet_id FK, reporter_id FK, detail, seen_at_location, created_at · anon SELECT, immutable

-- 014_blood.sql (ยังไม่ได้รันใน Supabase จริง) --
blood_donors    — id, pet_id FK (UNIQUE), blood_type, weight_kg numeric, eligible bool, available bool,
                  last_donation_date NULLABLE, created_at
                  · blood_type: dogs 'DEA1.1+'|'DEA1.1-'|'unknown'; cats 'A'|'B'|'AB'|'unknown'
blood_requests  — id, requester_id FK, species, blood_type_needed, urgency ('urgent'|'normal'),
                  hospital_name, province, details, contact, status ('open'|'fulfilled'), created_at
blood_responses — id, request_id FK, donor_pet_id FK, message NULLABLE, created_at
                  · UNIQUE(request_id, donor_pet_id) · SELECT เฉพาะ donor owner หรือ request owner
```

### Migration Files (ลำดับจริงไม่ต่อเนื่อง — เลข 003–007 สงวนไว้ตาม roadmap ไม่ได้ใช้จริง)
- `001_init.sql` — ทุก table หลัก + RLS + helper functions (**ห้ามแก้ไฟล์นี้เด็ดขาด**)
- `002_storage_policies.sql` — Storage policies สำหรับ pet-photos bucket
- `008_playdates.sql` — playdate_spots + playdate_proposals
- `009_demo_match.sql` — `create_demo_match()` SECURITY DEFINER RPC (การันตี match ตอน demo)
- `010_trust.sql` — reviews + reports + blocks (Phase 6) — ✅ รันแล้ว
- `011_reviews_delete.sql` — RLS DELETE policy ให้ลบรีวิวตัวเองได้ — ✅ รันแล้ว Session 17
- `012_hospitals.sql` — hospitals (Phase 7) — ✅ รันแล้ว Session 17
- `013_lost_pets.sql` — lost_pets + lost_pet_sightings (Phase 8), anon SELECT — ✅ รันแล้ว Session 17
- `014_blood.sql` — blood_donors + blood_requests + blood_responses (Phase 9) — ⚠️ **ยังไม่ได้รัน**
- **migration ใหม่ถัดไปควรเป็น `015_health.sql`** (Phase 10)

### RLS Rules
- ทุก table เปิด RLS
- `profiles`, `pets`: SELECT ทุกคน, INSERT/UPDATE เฉพาะเจ้าของ
- `likes`: INSERT เฉพาะเจ้าของ from_pet_id
- `matches`: SELECT เฉพาะคู่ที่ user เป็นเจ้าของ pet_a หรือ pet_b
- `messages`: SELECT/INSERT เฉพาะคนใน match
- `reviews`: SELECT ทุกคน, INSERT/UPDATE/DELETE เฉพาะ reviewer ใน match นั้น
- `reports`: INSERT/SELECT เฉพาะเจ้าของ report
- `blocks`: SELECT ทั้ง 2 ฝั่ง, INSERT/DELETE เฉพาะ blocker
- `hospitals`: SELECT only (reference data)
- `lost_pets` + `lost_pet_sightings`: SELECT ให้ anon ด้วย (public share page)
- `blood_responses`: visible เฉพาะ donor owner + request owner (กัน contact รั่ว)

### Helper Functions (SQL — SECURITY DEFINER)
```sql
owns_pet(pet_id uuid) → bool      -- auth.uid() เป็น owner ของ pet_id ไหม
is_in_match(match_id uuid) → bool -- user เป็นเจ้าของ pet ฝั่งใดฝั่งหนึ่งใน match ไหม
```

### Realtime
- เปิด realtime publication สำหรับ `messages` — subscribe ใน `chat/[matchId]/page.tsx` filter `match_id=eq.{matchId}`

---

## File Structure (สำคัญ)

```
app/
  layout.tsx                       — Root layout, Prompt font, cream background
  icon.svg                         — Favicon (paw print บนพื้น coral, auto-injected by Next 14)
  page.tsx                         — Landing page (public)
  login/page.tsx + actions.ts      — Login/signup form + server actions (login/signup/demoLogin)
  onboarding/page.tsx              — 4-step wizard
  lost/[id]/page.tsx               — PUBLIC share page (server component, OG meta, anon RLS, no auth)
  app/
    layout.tsx                     — App shell: ConditionalAppHeader + {children} + BottomNav
    home/page.tsx                  — หน้าแรก: pet hero + quick stats + CARE_MENU
    swipe/page.tsx                 — Swipe cards + match logic + mode toggle + filters
    matches/page.tsx               — Matches list (2 tabs: แชท / นัดหมาย)
    chat/[matchId]/page.tsx        — Realtime chat + scheduling + trust actions
    profile/page.tsx               — Active-pet hero + stats + multi-pet switcher + account (dashboard ยุบเข้ามาแล้ว)
    care/
      page.tsx                     — Care Hub 2×2 grid (Phase 7) [Phase 10 จะเติม reminder banner]
      hospitals/page.tsx           — Hospital finder: list/map toggle, geolocation sort
      lost/page.tsx, new/page.tsx, [id]/page.tsx   — Lost pet feed / create / detail (Phase 8)
      blood/page.tsx, [id]/page.tsx                — Blood center: feed+donor reg / request detail (Phase 9)

components/
  AuthForm.tsx                     — Login/signup tabs + Demo button (อ่าน ?redirect= param)
  AppHeader.tsx / ConditionalAppHeader.tsx — Logo header; ซ่อนบน /app/chat/*, /app/swipe, /app/care/*
  BottomNav.tsx                    — 5 tabs: หน้าแรก/ปัดการ์ด/แมตช์/ดูแล(HeartPulse)/โปรไฟล์
  LogoutButton.tsx
  onboarding/  Step1Photos · Step2Basic · Step3Personality · Step4Modes
  swipe/       PetCard (card + detail sheet + trust actions) · MatchPopup · FilterSheet
  dashboard/   PetStatCard — ใช้ใน profile "other pets" switcher
  playdates/   ScheduleSheet · ProposalBanner
  trust/       ReviewModal · ReportSheet · BlockConfirm · RatingSummary · Toast
  care/        HospitalCard · HospitalDetailSheet (stops at bottom-[60px]) · HospitalMap (leaflet, ssr:false)
  lost/        LostPetCard · SightingModal · PublicShareButton (client island สำหรับ public page)

lib/
  supabase/    client.ts (browser) · server.ts (cookies) · middleware.ts (updateSession)
  match.ts            — checkAndCreateMatch()
  blocks.ts           — getBlockedPetIds() — กรอง pet ที่ถูกบล็อก 2 ทิศทาง
  geo.ts              — haversineKm() great-circle distance (Phase 7)
  blood-matching.ts   — matchDonors() · evaluateEligibility() · monthsSinceLastDonation() (Phase 9)
  data/  breeds.ts (DOG/CAT_BREEDS, BREED_SIZE_MAP) · provinces.ts (77 จังหวัด) · tags.ts

middleware.ts                      — Route protection: /app/*, /onboarding/*, /login
LINK_PATH.md                       — รายการ route ทั้งหมด (Public/Onboarding/App)

scripts/
  seed.ts            — 45 dogs + 40 cats + breeding-compatible cohort ต่อ pet จริง + pre-likes
  seed-spots.ts      — 24 playdate spots
  seed-hospitals.ts  — ~30 vet hospitals (รันหลัง 012_hospitals.sql)
  tsconfig.json      — แยก tsconfig (commonjs) สำหรับ scripts

supabase/migrations/  001, 002, 008, 009, 010, 011, 012, 013, 014 (ดู migration table ด้านบน)
```

---

## Logic สำคัญ

### Match Creation (`lib/match.ts`)
`checkAndCreateMatch(supabase, fromPetId, toPetId, mode)` — (1) เช็คว่า toPet ได้ like fromPet ในโหมดเดียวกันไหม (2) ถ้าใช่ sort pet IDs (a<b) แล้ว insert matches (3) handle error 23505 (duplicate) แบบ silent → null (4) return matchId ถ้า match ใหม่

### Swipe Feed Filters
| Mode | Filter |
|---|---|
| playdate | species เดียวกัน + has "playdate" ใน modes |
| breeding | species เดียวกัน + breed เดียวกัน + opposite sex + has "breeding" ใน modes |

Deck fetch โหลด `prevLikedIds` จาก DB เสมอ (ทุกกรณีรวม recycle) → liked cards ไม่กลับมา; `skippedIds` (session ref) เคลียร์ตอน recycle; `likedIds` ไม่เคยเคลียร์ (mirror DB). Demo counter (`swipeCount`+`forceNext` refs) เรียก `create_demo_match` RPC หลัง 3–7 swipe ถ้าไม่มี match ธรรมชาติ

### Demo Login Flow (`app/login/actions.ts`)
1. `signInWithPassword` ด้วย DEMO_EMAIL/DEMO_PASSWORD → 2. upsert profiles (กัน FK error) → 3. เช็คว่ามี pet ไหม → มี → `/app/swipe`, ไม่มี → `/onboarding` (query ต้องมี `.limit(1)` ก่อน `.maybeSingle()`)

### Route Protection (`middleware.ts`)
Matcher ครอบ `/app/:path*`, `/onboarding/:path*`, `/login` (ใส่ `/login` เพื่อ refresh session cookie). `/app/*` + `/onboarding` → redirect ไป `/login` ถ้าไม่มี session

---

## Patterns & Conventions (CRITICAL — อ่านก่อนเขียนโค้ดใหม่)

### Active Pet Pattern (ใช้ทุกหน้าที่ query ข้อมูลตาม pet)
```typescript
const storedId = localStorage.getItem("pawmate_active_pet_id");
let myPet: { id: string } | null = null;
if (storedId) {
  const { data } = await supabase.from("pets").select("id")
    .eq("owner_id", user.id).eq("id", storedId).maybeSingle();
  myPet = data;
}
if (!myPet) {
  const { data } = await supabase.from("pets").select("id")
    .eq("owner_id", user.id).limit(1).maybeSingle();
  myPet = data;
  if (myPet) localStorage.setItem("pawmate_active_pet_id", myPet.id);
}
```
ใช้ใน: `swipe`, `matches`, `chat/[matchId]`, `profile` (ตั้ง localStorage ตอนสลับ pet), และทุกหน้า care ที่ query per-pet

### Supabase Query Gotcha: bare `.maybeSingle()`
Query ที่อาจ match >1 row ต้องมี `.limit(1)` ก่อน `.maybeSingle()` เสมอ — bare `.maybeSingle()` จะ error ตอนมี >1 rows แล้วโค้ดที่ destructure แค่ `data` (ไม่เช็ก `error`) จะเห็นเป็น `null` เหมือน "ไม่มีข้อมูล" เงียบๆ เคยทำบั๊ก: Matches page โชว์ว่าไม่มีแมตช์ทั้งที่มี (Session 6), onboarding loop ตอน sign in (Session 8), seed script ข้าม pre-likes (Session 8). ใช้กฎนี้ทุกที่ที่ look up pet ด้วย `owner_id` โดยไม่มี pet `id` เฉพาะ — ไม่ใช่แค่หน้าที่ query active pet (รวม login flow ด้วย)

### Block Semantics (`lib/blocks.ts`)
`getBlockedPetIds(supabase, myPetId)` คืน `Set<string>` ของ pet ที่ถูกบล็อกทั้ง 2 ทิศทาง — ใช้ filter ใน memory เท่านั้น **ห้ามลบ row ใน DB** ใช้ใน swipe feed, matches list, chat (block guard redirect)

### Match Uniqueness
`pet_a_id` และ `pet_b_id` เก็บแบบ sorted เสมอ (`LEAST`/`GREATEST` ตอน insert) ป้องกัน `(A,B)` กับ `(B,A)` ซ้ำ

### z-index Convention
| Layer | z-index | ตัวอย่าง |
|---|---|---|
| Dropdown menu เล็กๆ | `z-50` | เมนู ⋮ ในหน้าแชท |
| Bottom sheet / detail sheet เหนือ swipe deck | `z-[60]` | filter sheet, pet detail sheet, FAB lost feed |
| Modal/popup สำคัญ | `z-[70]` | review modal, report sheet, block confirm, match popup, sighting modal |
| Toast | `z-[80]` | สูงสุด |

⚠️ **อย่าใช้ `z-50` กับ full-screen overlay ที่เนื้อหายาวจนชนขอบล่างจอ** — `BottomNav` ก็ `z-50` และ render หลังเสมอ (ทับทุกอย่างที่ z เท่ากันแต่ render มาก่อน) เคยทำให้ detail sheet ของการ์ด swipe ถูกบังจนดูเหมือน "เลื่อนไม่ได้" (แก้แล้ว Session 12)

### Mobile Layout Sizing (Session 11 lesson)
"ห้าม scroll" ≠ "ต้องลดขนาดรูป" — แก้ที่ root container ให้ `h-[calc(100dvh-5rem)] overflow-hidden` ก็พอ ส่วนเนื้อหาให้ `flex-1` เติมพื้นที่ที่เหลือได้ ใช้ `dvh`-based fixed height + fixed-height container เชื่อถือได้กว่าการเดา `aspect-[w/h]` ซ้ำไปมา เพราะ aspect-ratio ขึ้นกับความกว้าง/layout context ที่ซับซ้อนกว่า

### Supabase Client Usage
- Client component → `lib/supabase/client.ts` (`createBrowserClient`)
- Server component / action → `lib/supabase/server.ts` (`createServerClient`, cookies)
- Seed script เท่านั้น → service role key — ห้ามใช้ใน frontend

### รูปภาพ
Pet photos (Storage URLs / seed placeholder) ใช้ `<img>` ธรรมดา (มี `eslint-disable-next-line @next/next/no-img-element`) ไม่ใช้ `next/image`. เฉพาะ static local asset (เช่น `/logo.png`) ผ่าน `next/image`

---

## Bugs ที่เจอและแก้ไปแล้ว

| ปัญหา | สาเหตุ | วิธีแก้ |
|---|---|---|
| npm ล้มเหลวบน G: drive | Google Drive EBADF/EPERM | ย้ายมา `C:\dev\pawmate` |
| TypeScript error ใน server.ts | `cookiesToSet` ไม่มี type | import `CookieOptions` จาก @supabase/ssr |
| Supabase URL ผิด | copy /rest/v1/ suffix มา | แก้ .env.local เป็น base URL |
| Email rate limit exceeded | Supabase free tier | ปิด "Confirm email" ใน Auth settings |
| Demo login FK error | ไม่มีแถวใน profiles | เพิ่ม upsert profiles ใน demoLogin |
| Set spread TS error | downlevelIteration ปิด | ใช้ `Array.from().concat()` |
| seed.ts ถูก Next.js compile | ไม่มี exclude | เพิ่ม "scripts" ใน tsconfig exclude |
| CSS หายทุกหน้า | hot reload พัง | Ctrl+C แล้ว `npm run dev` ใหม่ |
| breeding mode มีการ์ดใบเดียว | seed ผูก pet ตัวเดียว + feed ไม่ exclude likes session เก่า | query `likes` ก่อนแสดงการ์ด + loop ทุก breeding pet ใน seed |
| GitHub Push Protection บล็อก push | DEVLOG มี service role key จริง | แก้เป็น placeholder แล้ว amend (ยังไม่ push) |
| Vercel deploy ล้มเหลว | Vercel ไม่ detect Next.js → หา `public` แทน `.next` | Settings → Framework Preset → Next.js → Redeploy |
| swipe mode toggle หายเมื่อ 1 mode | `availableModes.length > 1` ซ่อนทั้งก้อน | render เสมอ โหมดไม่ available = disabled + dimmed + tooltip (Session 15) |
| home greeting ไม่เปลี่ยนตาม active pet | ใช้ `profile.display_name` (static) | เปลี่ยนเป็น `activePet?.name` ลบ ownerName state (Session 16) |
| detail sheet "เลื่อนไม่ได้" | z-50 ชน BottomNav (render หลังทับ) | detail sheet → z-[60], MatchPopup → z-[70] (Session 12) |
| aspect-ratio ไม่ถูกใช้จริงบน swipe | aspect-ratio ตีกับ flex/cache | เลิกพึ่ง aspect-ratio → fixed-height container + flex-1 (Session 11) |

---

## Git & Deploy Status

### GitHub
- **URL:** `https://github.com/thanatstamp-bit/pawmate` · branch `main`

### Vercel
- ✅ Deploy ผ่านสมบูรณ์ (2026-06-12) — วิธีแก้ตอน setup: Settings → General → Framework Preset → **Next.js** → Save → Redeploy
- **Env vars ใน Vercel:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DEMO_EMAIL`, `DEMO_PASSWORD` (ไม่ต้องใส่ `SUPABASE_SERVICE_ROLE_KEY` — local seed เท่านั้น)
- หลัง deploy ทำแล้ว: Auth URL Configuration (Site/Redirect URLs), เปลี่ยน DEMO_PASSWORD จริง, ใส่ชื่อ/ลิงก์ใน footer landing

---

## QA Checklist — เช็คทุกครั้งที่แก้ feature ที่มี "สองฝั่ง"

ทดสอบด้วย 2 บัญชีคู่กันเสมอ (browser ปกติ + incognito):
- [ ] **บล็อก** — บล็อกฝั่ง A แล้วฝั่ง B มองไม่เห็นการ์ด/แมตช์/แชทของ A (ทั้ง 2 ฝั่ง)
- [ ] **รีวิว** — รีวิว 2 ฝั่ง คะแนนเฉลี่ยถูก, รีวิวซ้ำใน match เดิมไม่ได้ (ขึ้นของเดิมให้แก้/ลบแทน)
- [ ] **รายงาน** — toast ขึ้นถูก, ฝั่งที่ถูกรายงานไม่รู้ตัว (reports SELECT เฉพาะเจ้าของ)
- [ ] **RLS spot-check** — ลอง query ข้อมูลคนอื่นจากบัญชีที่ไม่ใช่เจ้าของใน SQL Editor ถ้าดึงได้ = RLS รั่ว

---

## Session History (สรุปย่อ)

> รายละเอียดเชิงลึกแบบ session-by-session ถูกย่อแล้ว — แต่ละ session เก็บ "ทำอะไร + ไฟล์/ผลลัพธ์สำคัญ" patterns/bugs ที่ค้นพบถูกยกขึ้นไปไว้ในหัวข้อ Patterns & Bugs ด้านบนแล้ว

**Session 3 (06-11) — Bug fix breeding deck + seed expansion**
แก้ breeding mode มีการ์ดใบเดียว: `fetchCards` query `likes` table ก่อนแสดงการ์ด (exclude liked ข้าม session). Seed โต ~100 pets (45 dogs + 40 cats + 15 breeding-compatible). commit `086b9c9`.

**Session 4 (06-12) — Dashboard + Multi-Pet + UI Polish**
สร้าง `PetStatCard` + `/app/dashboard` (ยุบเข้า profile ภายหลัง Session 10). วาง Active Pet concept (localStorage `pawmate_active_pet_id`). Onboarding back button ทุก step. ใส่ `logo.png` ทั่วแอป. เปลี่ยนฟอนต์ → Prompt. FilterSheet z-[60] กัน BottomNav ทับ.

**Session 5 (06-13) — Advanced Filters + Playdate Scheduling + Demo Match**
Advanced filters (breed/size/age/tags/health, `BREED_SIZE_MAP`, type `SwipeFilters` + draft state + active-count badge). Playdate: `008_playdates.sql`, `ScheduleSheet`, `ProposalBanner` (3 states), `seed-spots.ts` (24 ที่). Demo match: `009_demo_match.sql` + force match ทุก 3–7 swipe.

**Session 6 (06-14) — Bug Fixes**
Matches page โชว์ "ไม่มีแมตช์" ทั้งที่มี → ใช้ active-pet localStorage pattern ใน matches+chat. Deck exhaustion → auto-recycle 2 ชั้น (ใน `fetchCards` + `useEffect` เฝ้า `cards.length` มี `deckExhausted` guard).

**Session 7 (06-14) — Phase 6 Trust Layer**
`010_trust.sql` (reviews/reports/blocks + RLS). `lib/blocks.ts` `getBlockedPetIds()`. `components/trust/*` (RatingSummary, ReviewModal, ReportSheet, BlockConfirm, Toast). Badge วัคซีน/ทำหมัน บนการ์ด + detail sheet + amber warning ใน breeding mode. ⚠️ TS narrowing gotcha ใน PetCard (ดึง flag เป็น const ก่อน return).

**Session 8 (06-16) — Bug Fixes**
Onboarding loop ตอน sign in → เพิ่ม `.limit(1)` ก่อน `.maybeSingle()` ใน `AuthForm.tsx` + `login/actions.ts`. Breeding deck หมดถาวร → seed ผูกกับ pet ตัวเดียว, แก้เป็น loop ทุก pet จริงที่เปิด breeding + fix `.maybeSingle()` ใน seed. เปิดปุ่มนัดหมายให้ใช้ได้ทั้ง 2 โหมด (ตามคำขอ user).

**Session 9 (06-16) — Swipe Feed Layout ตาม Wireframe**
ปรับ `/app/swipe` ตาม `pawmate_wireframe/Swipe Feed Wireframe.dc.html`: ซ่อน logo header, segmented control + icon filter, card = รูป + info strip ล่าง, ย้ายปุ่ม ถูกใจ/ผ่าน ออกจากการ์ดไป page level, empty/loading states ใหม่. วน ratio หลายรอบ (4:3 → 3:2 → 5:3 ด้วย Python/PIL วัด pixel).

**Session 10 (06-16) — ยุบ Dashboard เข้า Profile**
ลบ `/app/dashboard` ทั้ง route. เขียน `profile/page.tsx` ใหม่: active hero (รายละเอียด) + stats row + section "น้องตัวอื่นของฉัน" (PetStatCard switcher). BottomNav กลับเป็น 4 tabs. onboarding redirect → `/app/profile`.

**Session 11 (06-16) — Swipe Feed fit จอ ไม่ scroll**
Root container `h-[calc(100dvh-5rem)] overflow-hidden`; photo `min-h-0 flex-1` (user ยืนยันอยากได้รูปใหญ่ แค่ไม่ scroll). **บทเรียน:** no-scroll = fix root container ไม่ใช่ลดขนาดรูป → [[feedback-mobile-layout-sizing]].

**Session 12 (06-16) — Phase 6 Trust UI rework ตาม Wireframe**
เพิ่มสี `rose #E0445A`. `011_reviews_delete.sql` (ลบรีวิวตัวเอง). Rework ทุก trust component ตาม 7 frame (RatingSummary 2-col, ReviewModal + ลบรีวิว, ReportSheet radio list, BlockConfirm ปุ่ม rose, Toast title/subtitle/icon). แก้ z-index: PetCard detail sheet → z-[60], MatchPopup → z-[70]. ใช้ plan mode + Explore/Plan agents + AskUserQuestion.

**Session 13 — Phase 7 (ถูก context limit ตัด ไม่มี log)**
สร้าง Phase 7 Care Hub + Hospital Finder แต่ session ถูกตัดก่อนเขียน log — ดู Session 14 recheck.

**Session 14 (06-17) — Phase 7 Recheck + Fixes**
เพิ่ม ดูแล tab ใน BottomNav (5 tabs, HeartPulse). แก้ `HospitalMap` ไม่ re-center → เพิ่ม `RecenterMap` (`useMap()` + `map.setView`). อัปเดต CLAUDE.md. ตรวจไฟล์ Phase 7 ครบ. ค้าง: รัน 012 + seed-hospitals.

**Session 15 (06-17) — Phase 8 Lost Pet Board**
`013_lost_pets.sql` (anon SELECT). `LostPetCard`, `SightingModal`, `/app/care/lost` (feed + 3 filters + extended FAB), `/new` (photo upload + in-page success), `/[id]` (carousel + sightings timeline + mark-found), `/lost/[id]` public (server component + OG meta). แก้ swipe mode toggle always-visible. สร้าง `LINK_PATH.md`. TS gotcha: FK join return เป็น array → cast.

**Session 16 (06-17) — Bug Fix: Home Greeting + Favicon**
Greeting ใช้ `activePet?.name` แทน `profile.display_name` (ลบ ownerName state + 1 query). เพิ่ม `app/icon.svg` (paw print บน coral, Next 14 auto-inject).

**Session 17 (06-17) — Phase 9 Blood Donation Center**
`014_blood.sql` (blood_donors/requests/responses, responses SELECT owner-only). `lib/blood-matching.ts` (`matchDonors`/`evaluateEligibility`/`monthsSinceLastDonation`, pure functions). `/app/care/blood` (2 tabs: feed ขอรับบริจาค + เป็นผู้บริจาค + overlay request form), `/[id]` (matching donors exact/crossmatch + responses list + ปิดประกาศ). รัน migration 011/012/013 + seed-hospitals แล้ว. commit `0cccc50`. ⚠️ 014 ยังไม่ได้รัน.

**Session 18 (06-17) — Phase 8 Enhancement: Public Share Page**
ยกระดับ `/lost/[id]` ตาม `Public Lost Pet Share.dc.html`: logo bar, dot indicators, celebration strip, facts "หายมาแล้ว X วัน", ปุ่มโทร (lost), social proof strip, CTA banner box, `PublicShareButton` client island (Web Share + clipboard), OG description ละเอียดขึ้น. commit `911cdde`.

**Session 19 (06-18) — Phase 10 Health Book + Wireframe Rework**
`015_health.sql` (health_records + RLS ผ่าน `owns_pet()`). `lib/health.ts` (`syncVaccinatedBadge()` — recompute `pets.vaccinated` จากวัคซีนพิษสุนัขบ้าภายใน 12 เดือน). `components/care/HealthRecordForm.tsx` (bottom sheet add/edit: type tabs, quick suggestions, "วันนัดครั้งต่อไป" collapsible, trash icon → inline rose confirm banner). `app/app/care/health/page.tsx` (vertical timeline + dots สีตาม type, ใกล้ถึงกำหนด section, pet switcher, empty CTA — ตรง wireframe ทุก frame). `components/care/CareDueBadge.tsx` (amber count badge). `BottomNav.tsx` เพิ่ม badge บน ดูแล tab. `care/page.tsx` → client component + reminder banner + unlock health card. `home/page.tsx` unlock สมุดสุขภาพ → `/app/care/health`. TypeScript ผ่าน 0 error. commit `e4fdbfc`.

**Session 20 (06-19) — Landing Page Navbar**
เพิ่ม sticky navbar บน landing page (`app/page.tsx`): logo + "PawMate" ซ้าย, ปุ่ม "เข้าสู่ระบบ" (outline) + "สมัครฟรี" (coral fill) ขวา — `sticky top-0 z-50 backdrop-blur`. commit `82b623a`.

---

## ROADMAP — Expansion Kit (Phase 6–11)

> ที่มา: `CLAUDE-EXPANSION.md` (รวมเข้าไฟล์นี้แล้ว). **ลำดับ:** 6 (Trust) → 7 (Care Hub + รพ.สัตว์) → 8 (สัตว์หาย) → 9 (บริจาคเลือด) → 10 (สมุดสุขภาพ) → 11 (Tele-vet demo, optional)
> **สถานะ:** Phase 6–10 ✅ เสร็จแล้ว → เหลือแค่ **Phase 11** (optional, migration ถัดไปคือ `016_vet_bookings.sql`)

### 🎯 EXPANSION CONTEXT (ground rules — อ้างอิงทุกเฟส)

**What this is:** เพิ่ม "Care & Community" layer บน MVP เดิม เปลี่ยน PawMate จากเครื่องมือจับคู่ครั้งเดียว เป็น daily-use companion app + viral loops (lost-pet + blood request แชร์ได้ดีในคอมมูนิตี้สัตว์เลี้ยงไทย)

**Feature set:** (1) Trust Layer (2) Care Hub tab "ดูแล" (3) Vet Hospital Finder (4) Lost Pet Board (5) Blood Donation Center (6) Health Book (7, optional) Tele-triage Demo

**Ground rules (brownfield — สำคัญ):**
- กฎ MVP เดิมยังใช้: tech stack, design system, Thai UI / English code, mobile-first 390px, max content width 480px, loading + empty states ทุก data fetch
- **DO NOT refactor/restyle/"improve" โค้ด MVP เดิม** เว้นแต่เฟสสั่งชัดเจน
- **ห้ามแก้ `001_init.sql`** ทุกเฟสที่แตะ DB เขียน migration ใหม่. เลข migration ในเอกสารนี้ (002_trust, 003_hospitals, ...) เป็นแค่ illustrative — เลขจริงคือ 010_trust, 011_reviews_delete, 012_hospitals, 013_lost_pets, 014_blood, **015_health**, 016_vet_bookings
- ALTER table เดิมได้แค่เพิ่ม column เมื่อเฟสสั่ง — ห้าม rename/drop column เดิม
- Navigation (ทำครั้งเดียวใน Phase 7): bottom nav 5 tabs — หน้าแรก, ปัดการ์ด, แมตช์, ดูแล, โปรไฟล์
- สี Urgent/Alert: deep rose `#E0445A` ใช้เฉพาะ urgent blood request, "lost" status, due-soon warning. Found/positive ใช้ teal `#2EC4B6`. ที่เหลือใช้ palette เดิม
- Lost-pet share pages = PUBLIC (no login). ที่เหลืออยู่หลัง auth
- Disclaimer: blood donation + tele-triage ต้องมี Thai disclaimer ว่าแอปเป็นสื่อกลาง/ระบบสาธิต ไม่ใช่บริการทางการแพทย์

**RLS (ทุก table ใหม่):** เปิด RLS, user INSERT/UPDATE/DELETE ได้เฉพาะ row ตัวเอง (ผ่าน profile id หรือ pet ที่ตัวเองเป็นเจ้าของ), SELECT authenticated-wide ยกเว้น: hospitals (SELECT only), lost_pets/lost_pet_sightings (SELECT ถึง anon ด้วย), blood_responses (เห็นเฉพาะ donor owner + request owner). Blocking: บล็อกทิศใดทิศหนึ่ง → exclude จาก swipe + ซ่อน match/chat (reusable query filter, ห้ามลบข้อมูล)

**Feature rules สำคัญ:**
- **Reviews:** 1 รีวิว/match/reviewer, ทำได้หลังมี match. Detail sheet โชว์ค่าเฉลี่ย (1 ทศนิยม) + count. Tag chips: ตรงปก, เป็นมิตร, แนะนำเลย (multi) + comment optional
- **Donor eligibility (eligible = ทุกข้อ true):** สุนัข — น้ำหนัก ≥20kg, อายุ 1–7 ปี, vaccinated=true; แมว — น้ำหนัก ≥4kg, อายุ 1–7 ปี, vaccinated=true, indoor-only. Spacing: available เมื่อ last_donation_date null หรือ ≥3 เดือน
- **Blood matching (request detail):** same species, province match โชว์ก่อน, blood type exact; donor blood_type 'unknown' แยกกลุ่ม "ต้องตรวจ crossmatch ก่อน". ต้องผ่าน weight + eligible + available
- **Health Book → badge sync:** record type 'vaccine' + title มี 'พิษสุนัขบ้า' + record_date ภายใน 12 เดือน → `pets.vaccinated=true` (recompute ทุก record change). record ที่ next_due_date ภายใน 30 วัน → badge บน ดูแล tab

### สถานะแต่ละเฟส

| Phase | สถานะ | Migration จริง | เช็คก่อนไปต่อ |
|---|---|---|---|
| 6 Trust Layer | ✅ Session 7 + UI rework S12 | 010 + 011 | รีวิว 2 ฝั่งคะแนนถูก, รีวิวซ้ำไม่ได้, บล็อกแล้วหายทั้ง 2 ฝั่ง |
| 7 Care Hub + รพ.สัตว์ | ✅ Session 13–14 | 012 | แผนที่ขึ้นหมุดตาม filter, โทร/นำทางได้, filter จังหวัด+24ชม., ปฏิเสธ location ไม่พัง |
| 8 Lost Pet Board | ✅ Session 15 + S18 | 013 | โพสต์+แจ้งเบาะแสได้, ลิงก์แชร์เปิดไม่ล็อกอิน, OG preview ขึ้นรูป, กดพบแล้ว → สถานะเปลี่ยน |
| 9 Blood Donation | ✅ Session 17 | 014 | checklist ประเมินถูก, ขอเลือด→อีกบัญชีกดช่วย→เจ้าของเห็น contact, ปิดประกาศได้ |
| 10 Health Book | ✅ Session 19 | 015 | เพิ่ม/แก้/ลบ record, บันทึกวัคซีนพิษสุนัขบ้า → badge ✅ ขึ้นการ์ดปัดอัตโนมัติ, banner + ตัวเลขบน tab ดูแล |
| 11 Tele-vet demo | 🔲 optional | 016 | จองคิว → confirmation + ห้องรอ, ทุกหน้ามีป้าย ระบบสาธิต, ลิงก์ฉุกเฉิน → รพ.สัตว์ |

### Phase 11 (OPTIONAL) — Tele-Triage Demo (สรุป prompt)

DEMO ปรึกษาสัตวแพทย์ออนไลน์ (ไม่มีหมอจริง — เพื่อ portfolio). ทุกหน้าต้องมี amber badge "ระบบสาธิต (Demo)".
1. `016_vet_bookings.sql`: vet_bookings owner-only RLS
2. `/app/care/vet-online`: intro card + emergency disclaimer (link → Phase 7 hospitals)
3. Mock vet list 4–5 คน (hardcoded constants, ไม่มี DB): avatar, name, specialty, rating, ค่าปรึกษา mock, slots
4. Booking flow: เลือกหมอ → time slot (next 3 days client-side) → topic textarea → confirmation → insert vet_bookings
5. My bookings + cancel; mock ห้องรอ (vet card + countdown + disabled video frame + Demo badge)

### เทคนิค Vibe Code งานต่อยอด (brownfield)
1. อย่าปล่อยให้ AI "ปรับปรุง" ของเดิมเอง — ถ้าเห็นเริ่มรื้อ MVP ที่ใช้ได้ ให้หยุด: "do not modify existing code, only add new files"
2. Migration ใหม่เท่านั้น ห้ามแก้ไฟล์เก่า (001 = ประวัติศาสตร์)
3. ทดสอบด้วย 2 บัญชีเสมอ (ฟีเจอร์ส่วนใหญ่มี 2 ฝั่ง)
4. Commit ทุกครั้งที่จบเฟส (save point)
5. ถ้า AI หลุด context (สีนอก palette, ลืม RLS) → paste ground rules ซ้ำ
6. เช็ค RLS ทุกเฟสที่มีตารางใหม่ (query ข้อมูลคนอื่นจากบัญชีที่ไม่ใช่เจ้าของ ถ้าได้ = รั่ว)

---

## PHASE 10 — Health Book (เสร็จแล้ว — Session 19, commit `e4fdbfc`)

ดูแผนเดิมใน git history ถ้าต้องการ spec ย้อนหลัง ไฟล์ที่ส่งมอบ:
- `supabase/migrations/015_health.sql` — health_records + RLS
- `lib/health.ts` — `syncVaccinatedBadge()`
- `components/care/HealthRecordForm.tsx` — bottom sheet add/edit/delete (wireframe ทุก frame)
- `app/app/care/health/page.tsx` — vertical timeline, ใกล้ถึงกำหนด, pet switcher, empty CTA
- `components/care/CareDueBadge.tsx` — amber badge บน tab ดูแล
- `components/BottomNav.tsx`, `app/app/care/page.tsx`, `app/app/home/page.tsx` — unlock + badge + reminder banner

---

## Ideas สำหรับ Phase ถัดไป (backlog)
- Swipe gestures (drag ซ้าย/ขวา ด้วย framer-motion)
- Push notifications เมื่อได้แมตช์ใหม่ (Supabase Edge Functions + Web Push)
- Photo moderation ก่อนแสดงผล
- Location-based filter (ระยะทางจริงจาก province/district)
- LINE Notify integration เมื่อมีแมตช์
