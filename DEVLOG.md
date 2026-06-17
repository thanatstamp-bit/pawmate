# PawMate — Developer Log & Handoff Notes

> บันทึกสิ่งที่ทำไปในแต่ละ session เพื่อ reference สำหรับครั้งถัดไป
> อัปเดตล่าสุด: 2026-06-17 (session 17)

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
✅ Phase 7 — Care Hub + Vet Hospital Finder (Session 13) — UI ตรงตาม `Care Hub Wireframe.dc.html` + `Hospital Finder Wireframe.dc.html` ทุก frame
✅ Phase 7 recheck (Session 14) — เพิ่ม ดูแล tab ใน BottomNav (5 tabs), แก้ HospitalMap re-centering, อัปเดต CLAUDE.md
✅ Phase 8 — Lost Pet Board / ประกาศสัตว์หาย (Session 15) — feed + create form + detail + public share page พร้อม OG meta
✅ Phase 9 — Blood Donation Center / ศูนย์บริจาคเลือด (Session 17) — feed + donor registration + request detail + donor matching
🔲 Phase 10–11 — สมุดสุขภาพ / tele-vet demo — ยังไม่เริ่ม

### ⚠️ ค้างทำก่อนใช้งานจริง (อัปเดต Session 17)

- [ ] **รัน migration `014_blood.sql` ใน Supabase SQL Editor** — ยังไม่ได้รัน เป็น blocker ของ Phase 9 ทั้งหมด (`/app/care/blood` และ `/app/care/blood/[id]` จะ error)
- [ ] **ยังไม่ได้ทดสอบ UI จริงในเบราว์เซอร์/มือถือ** สำหรับงานทั้งหมดใน Session 9–12 (ไม่มี browser tool ในเซสชันที่ทำ) — โดยเฉพาะ: หน้า swipe (layout+scroll), หน้า profile (หลังยุบ dashboard), Trust Layer 6 frame ใหม่ (rating card, review modal+ลบรีวิว, report sheet, toast, block dialog), detail sheet ของการ์ด swipe (z-index fix)
- [x] ~~รัน migration 011/012/013 ใน Supabase SQL Editor~~ — รันแล้วใน Session 17 ✅
- [x] ~~รัน seed-hospitals.ts~~ — รันแล้ว Session 17 (✅ Done! Inserted 30 hospitals.)
- [x] ~~tile "แดชบอร์ด" dead link ใน `/app/home`~~ — แก้แล้วใน Session 15 (ลบ tile + import ออก)
- [x] ~~mode toggle หายไปบนหน้า swipe เมื่อ pet มีแค่ 1 mode~~ — แก้แล้ว Session 15 (แสดง toggle เสมอ โหมดที่ไม่ available จะ disabled + dimmed แทนซ่อน)
- [x] ~~greeting "สวัสดี, X" บน `/app/home` ไม่เปลี่ยนตาม active pet~~ — แก้แล้ว Session 16 (เปลี่ยนจาก `profile.display_name` เป็น `activePet.name`)

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

> ⚠️ เปลี่ยน DEMO_PASSWORD ก่อน deploy จริง  
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
| Deploy | ✅ Vercel (deployed since 2026-06-12, see Git & Deploy Status) |

### Design System (Tailwind custom values — ตรงกับ `tailwind.config.ts` จริง)
```
cream:       #FFF8F0  (background)
coral:       #FF6B5B  (primary, like button)
coral-dark:  #E85647
teal:        #2EC4B6  (playdate mode)
teal-dark:   #26A89C
amber:       #FFB84C  (breeding mode)
amber-dark:  #F0A636
rose:        #E0445A  (Session 12 — destructive/urgent trust actions only: block, delete review — never primary actions)
brown:       #2D2A26  (text)
brown-muted: #8A8580  (muted text)
rounded-card: 20px
shadow-card:  0 4px 16px rgba(0,0,0,0.06)
```

### Fonts
- **Prompt** (ครอบคลุมทั้งไทยและอังกฤษในฟอนต์เดียว) — โหลดผ่าน `next/font/google`
- CSS var: `--font-prompt`
- ตั้งใน `app/layout.tsx`, inject ผ่าน `<html className>`
- (เวอร์ชันแรกๆ ของโปรเจกต์เคยใช้ Nunito + IBM Plex Sans Thai 2 ฟอนต์ — เปลี่ยนมาเป็น Prompt ฟอนต์เดียวตั้งแต่ Session 4)

---

## Database Schema

### Tables

```sql
profiles
  id          uuid  PRIMARY KEY  (= auth.users.id)
  display_name text
  line_id     text  NULLABLE
  created_at  timestamptz

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

likes
  id           uuid
  from_pet_id  uuid  FK → pets.id
  to_pet_id    uuid  FK → pets.id
  mode         text  ('playdate' | 'breeding')
  created_at   timestamptz
  UNIQUE (from_pet_id, to_pet_id, mode)

matches
  id        uuid
  pet_a_id  uuid  FK → pets.id
  pet_b_id  uuid  FK → pets.id
  mode      text
  created_at timestamptz
  — pet_a_id < pet_b_id เสมอ (sort ก่อน insert เพื่อ consistency)

messages
  id            uuid
  match_id      uuid  FK → matches.id
  sender_pet_id uuid  FK → pets.id
  content       text
  created_at    timestamptz

-- เพิ่มใน Session 5 (008_playdates.sql) --
playdate_spots
  id, name, type ('park'|'cafe'|'beach'|'resort'|'other'), province, district, description

playdate_proposals
  id, match_id FK, proposer_pet_id FK, proposed_at timestamptz,
  spot_id FK NULLABLE, custom_location text NULLABLE, note text NULLABLE,
  status ('pending'|'accepted'|'cancelled')

-- เพิ่มใน Session 7 / ปรับ UI ใน Session 12 (010_trust.sql + 011_reviews_delete.sql) --
reviews
  id, match_id FK, reviewer_pet_id FK, reviewed_pet_id FK,
  rating int (1-5), tags text[], comment text NULLABLE, created_at
  UNIQUE (match_id, reviewer_pet_id) — รีวิวได้ 1 ครั้งต่อ match ต่อผู้รีวิว
  DELETE policy (reviewer ลบรีวิวตัวเองได้) เพิ่มทีหลังใน 011_reviews_delete.sql

reports
  id, reporter_pet_id FK, reported_pet_id FK, reason text, details text NULLABLE, created_at

blocks
  id, blocker_pet_id FK, blocked_pet_id FK, created_at
  UNIQUE (blocker_pet_id, blocked_pet_id), CHECK ห้าม block ตัวเอง
```

### Migration Files (ลำดับจริงไม่ต่อเนื่อง — เลข 003–007 สงวนไว้ตาม roadmap ใน `CLAUDE-EXPANSION.md` ไม่ได้ใช้จริง)
- `001_init.sql` — สร้างทุก table หลัก + RLS policies + helper functions (**ห้ามแก้ไฟล์นี้เด็ดขาด**)
- `002_storage_policies.sql` — Storage policies สำหรับ pet-photos bucket
- `008_playdates.sql` — playdate_spots + playdate_proposals
- `009_demo_match.sql` — `create_demo_match()` SECURITY DEFINER RPC (ใช้ตอน demo swipe เพื่อการันตี match)
- `010_trust.sql` — reviews + reports + blocks (Phase 6)
- `011_reviews_delete.sql` — เพิ่ม RLS DELETE policy ให้ลบรีวิวตัวเองได้ (Session 12) — ✅ รันแล้ว Session 17
- `012_hospitals.sql` — ตาราง `hospitals` (Phase 7) public read-only RLS (Session 13) — ✅ รันแล้ว Session 17
- `013_lost_pets.sql` — ตาราง `lost_pets` + `lost_pet_sightings` (Phase 8) — anon SELECT เพื่อให้ `/lost/[id]` เข้าได้โดยไม่ login — ✅ รันแล้ว Session 17
- `014_blood.sql` — ตาราง `blood_donors` + `blood_requests` + `blood_responses` (Phase 9) + RLS — **ยังไม่ได้รันใน Supabase จริง ดูหัวข้อ "ค้างทำ" ด้านบน**
- migration ใหม่ถัดไปควรเป็น `015_*.sql`

### RLS Rules
- ทุก table เปิด RLS
- `profiles`, `pets`: SELECT ได้ทุกคน, INSERT/UPDATE เฉพาะเจ้าของ
- `likes`: INSERT เฉพาะเจ้าของสัตว์ตัว from_pet_id
- `matches`: SELECT เฉพาะคู่ที่ user เป็นเจ้าของ pet_a หรือ pet_b
- `messages`: SELECT/INSERT เฉพาะคนที่อยู่ใน match
- `reviews`: SELECT ทุกคน (โชว์บนการ์ด), INSERT/UPDATE/DELETE เฉพาะ reviewer ที่อยู่ใน match นั้น
- `reports`: INSERT/SELECT เฉพาะเจ้าของ report (เห็นแค่ของตัวเอง)
- `blocks`: SELECT เห็นได้ทั้ง 2 ฝั่ง (blocker หรือ blocked), INSERT/DELETE เฉพาะ blocker

### Helper Functions (ใน SQL)
```sql
owns_pet(pet_id uuid) → bool
  -- ตรวจว่า auth.uid() เป็น owner ของ pet_id นั้นไหม

is_in_match(match_id uuid) → bool
  -- ตรวจว่า user เป็นเจ้าของ pet ฝั่งใดฝั่งหนึ่งใน match นั้นไหม
```

### Realtime
- เปิด realtime publication สำหรับ `messages` table
- Subscribe ใน `/app/app/chat/[matchId]/page.tsx` โดย filter `match_id=eq.{matchId}`

---

## File Structure (สำคัญ)

```
app/
  layout.tsx                    — Root layout, Prompt font, cream background
  page.tsx                      — Landing page (public)
  login/
    page.tsx                    — Login/signup form
    actions.ts                  — Server actions: login, signup, demoLogin
  onboarding/
    page.tsx                    — 4-step wizard
  app/
    layout.tsx                  — App shell: ConditionalAppHeader + {children} + BottomNav
    home/page.tsx                — หน้าแรก: pet hero card + quick stats (Session 4)
    swipe/page.tsx               — Swipe cards + match logic + mode toggle + filters
    matches/page.tsx             — Matches list (2 tabs: แชท / นัดหมาย)
    chat/[matchId]/page.tsx      — Realtime chat + scheduling + trust actions
    profile/page.tsx             — Active-pet hero + multi-pet switcher + stats + account
                                    (รวม dashboard เดิมเข้ามาแล้ว — app/app/dashboard ไม่มีแล้ว ลบไปตั้งแต่ Session 10)
    care/
      page.tsx                   — Care Hub 2×2 grid (Phase 7)
      hospitals/page.tsx         — Hospital finder: list/map toggle, geolocation sort
      lost/
        page.tsx                 — Lost pet feed + 3 filters + extended pill FAB (Phase 8)
        new/page.tsx             — Create form: photo upload, in-page success screen
        [id]/page.tsx            — Detail: carousel, sightings timeline, mark-as-found
      blood/
        page.tsx                 — Blood donation center: 2 tabs (ประกาศขอรับบริจาค feed + เป็นผู้บริจาค) + overlay request form (Phase 9)
        [id]/page.tsx            — Blood request detail: matched donors (exact+crossmatch groups), responses list (Phase 9)

app/ (public — ไม่ต้อง login)
  lost/
    [id]/page.tsx                — Public share page (server component, OG meta, anon RLS)

components/
  AuthForm.tsx                   — Login/signup tabs + Demo button
  AppHeader.tsx                  — Logo header (โชว์ทุกหน้ายกเว้น /app/chat/* และ /app/swipe)
  ConditionalAppHeader.tsx       — เลือกว่าจะโชว์ AppHeader หรือไม่ตาม path
  BottomNav.tsx                  — Bottom navigation (5 tabs: หน้าแรก/ปัดการ์ด/แมตช์/ดูแล/โปรไฟล์)
  LogoutButton.tsx                — Logout button (client component)
  onboarding/
    Step1Photos.tsx              — Photo upload (Supabase Storage)
    Step2Basic.tsx               — Species, breed, sex, birth month
    Step3Personality.tsx         — Tags, province, district, bio
    Step4Modes.tsx               — Playdate/breeding toggles + vaccinated/neutered
  swipe/
    PetCard.tsx                  — Card UI + detail bottom sheet + rating/trust/report/block
    MatchPopup.tsx                — Match popup with animation
    FilterSheet.tsx               — Advanced filter bottom sheet (province/breed/size/age/tags/health)
  dashboard/
    PetStatCard.tsx               — Compact pet card w/ stats — ใช้ใน profile page's "other pets" switcher
  playdates/
    ScheduleSheet.tsx             — สร้างคำขอนัดหมาย (ใช้ได้ทั้ง playdate และ breeding mode)
    ProposalBanner.tsx            — แบนเนอร์สถานะคำขอนัดหมาย 3 สถานะ ในหน้าแชท
  trust/
    ReviewModal.tsx               — ให้คะแนน/แก้ไข/ลบรีวิวหลังนัดเจอ
    ReportSheet.tsx                — รายงานโปรไฟล์
    BlockConfirm.tsx               — ยืนยันบล็อก
    RatingSummary.tsx              — คะแนนเฉลี่ย + รีวิวล่าสุด (compact card)
    Toast.tsx                      — toast แจ้งเตือนทั่วไป (title/subtitle/icon)
  care/
    HospitalCard.tsx              — Hospital list card
    HospitalDetailSheet.tsx       — Hospital detail bottom sheet (stops at bottom-[60px])
    HospitalMap.tsx               — Leaflet map, custom divIcon, dynamic import ssr:false
  lost/
    LostPetCard.tsx               — Feed card: photo + status badge + days-lost
    SightingModal.tsx             — Bottom sheet แจ้งเบาะแส

lib/
  supabase/
    client.ts                    — createBrowserClient (client components)
    server.ts                    — createServerClient (server components/actions)
    middleware.ts                 — updateSession
  match.ts                       — checkAndCreateMatch() helper
  blocks.ts                      — getBlockedPetIds() — กรอง pet ที่ถูกบล็อกออกจาก feed/matches/chat
  blood-matching.ts              — matchDonors() donor ranking + evaluateEligibility() checklist + monthsSinceLastDonation() spacing check (Phase 9)
  data/
    breeds.ts                    — DOG_BREEDS, CAT_BREEDS, BREED_SIZE_MAP
    provinces.ts                 — Thai provinces array (77 จังหวัด)
    tags.ts                      — Personality tags array

middleware.ts                    — Route protection: /app/*, /onboarding/*, /login

lib/
  geo.ts                         — haversineKm() great-circle distance (Phase 7)

scripts/
  seed.ts                        — Seed script (45 dogs + 40 cats + breeding-compatible ต่อ pet จริง + pre-likes)
  seed-spots.ts                  — Seed 24 pet-friendly playdate spots
  seed-hospitals.ts              — Seed ~30 vet hospitals (รัน หลัง 012_hospitals.sql)
  tsconfig.json                  — Separate tsconfig for scripts (commonjs)

supabase/
  migrations/
    001_init.sql
    002_storage_policies.sql
    008_playdates.sql
    009_demo_match.sql
    010_trust.sql
    011_reviews_delete.sql
    012_hospitals.sql            — hospitals table (Phase 7) — ✅ รันแล้ว Session 17
    013_lost_pets.sql            — lost_pets + lost_pet_sightings (Phase 8) — ✅ รันแล้ว Session 17
    014_blood.sql                — blood_donors + blood_requests + blood_responses (Phase 9) — ยังไม่ได้รันใน Supabase

tsconfig.json                    — "scripts" อยู่ใน exclude เพื่อไม่ให้ Next.js compile seed
```

---

## Logic สำคัญ

### Match Creation (`lib/match.ts`)
```typescript
// checkAndCreateMatch(supabase, fromPetId, toPetId, mode)
// 1. ตรวจว่า toPetId ได้ like fromPetId ในโหมดเดียวกันไหม
// 2. ถ้าใช่ → sort pet IDs (a < b เสมอ) แล้ว insert matches
// 3. handle error 23505 (duplicate) แบบ silent — return null
// 4. return matchId ถ้า match ใหม่, null ถ้าไม่มี match
```

### Swipe Feed Filters
| Mode | Filter |
|---|---|
| playdate | species เดียวกัน + has "playdate" ใน modes |
| breeding | species เดียวกัน + breed เดียวกัน + opposite sex + has "breeding" ใน modes |

### Demo Login Flow (`app/login/actions.ts`)
1. `signInWithPassword` ด้วย DEMO_EMAIL/DEMO_PASSWORD
2. `upsert` ลง `profiles` (ป้องกัน FK error)
3. ตรวจว่ามี pet ไหม → ถ้ามีไป `/app/swipe`, ถ้าไม่มีไป `/onboarding` (query ต้องมี `.limit(1)` ก่อน `.maybeSingle()` — ดู "Supabase query gotcha" ด้านล่าง, แก้ไป Session 8)

### Route Protection (`middleware.ts`)
- Matcher ครอบคลุม `/app/:path*`, `/onboarding/:path*`, `/login` (ใส่ `/login` ไว้ด้วยเพื่อ refresh session cookie ที่นั่นด้วย ไม่ใช่เพื่อ protect)
- `/app/*` และ `/onboarding` → redirect ไป `/login` ถ้าไม่มี session

---

## Patterns & Conventions สำคัญ (quick reference)

รวบรวมจาก pattern ที่เจอซ้ำๆ หลาย session — เปิดดูตรงนี้ก่อนเขียนโค้ดใหม่ที่ต้อง query pet/match/block

### Active Pet Pattern (CRITICAL — ใช้ทุกหน้าที่ query ข้อมูลตาม pet)
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
ใช้ใน: `swipe/page.tsx`, `matches/page.tsx`, `chat/[matchId]/page.tsx`, `profile/page.tsx` (ตั้งค่า localStorage ตอนสับ pet ด้วย)

### Supabase Query Gotcha: bare `.maybeSingle()`
Query ที่อาจ match มากกว่า 1 row ต้องมี `.limit(1)` ก่อน `.maybeSingle()` เสมอ — bare `.maybeSingle()` จะ error ตอนมี >1 rows แล้วโค้ดที่ destructure แค่ `data` (ไม่เช็ก `error`) จะเห็นเป็น `null` เหมือน "ไม่มีข้อมูล" เงียบๆ เคยทำให้เกิดบั๊ก: Matches page โชว์ว่าไม่มีแมตช์ทั้งที่มีจริง (Session 6), onboarding loop ตอน sign in ใหม่ (Session 8), seed script ข้าม pre-likes (Session 8)

### Block Semantics (`lib/blocks.ts`)
`getBlockedPetIds(supabase, myPetId)` คืน `Set<string>` ของ pet ที่ถูกบล็อกทั้ง 2 ทิศทาง (ฉันบล็อกเขา หรือเขาบล็อกฉัน) — ใช้ filter ใน memory เท่านั้น **ห้ามลบ row ใน DB** ใช้ใน swipe feed, matches list, chat (block guard redirect)

### Match Uniqueness
`pet_a_id` และ `pet_b_id` เก็บแบบ sorted เสมอ (`LEAST`/`GREATEST` ตอน insert) ป้องกัน `(A,B)` กับ `(B,A)` ซ้ำกัน

### z-index Convention
| Layer | z-index | ตัวอย่าง |
|---|---|---|
| Dropdown menu เล็กๆ (ไม่ลงไปชน bottom nav) | `z-50` | เมนู ⋮ ในหน้าแชท |
| Bottom sheet / detail sheet เหนือ swipe deck | `z-[60]` | filter sheet, pet detail sheet |
| Modal/popup สำคัญ (เหนือ detail sheet) | `z-[70]` | review modal, report sheet, block confirm, match popup |
| Toast | `z-[80]` | สูงสุด อยู่เหนือทุกอย่าง |

⚠️ **อย่าใช้ `z-50` กับ full-screen overlay ที่เนื้อหายาวจนชนขอบล่างจอ** — `BottomNav` ก็เป็น `z-50` เหมือนกัน และ render หลังเสมอ (ทับทุกอย่างที่ z-index เท่ากันแต่ render มาก่อน) เคยทำให้ detail sheet ของการ์ด swipe ถูกบังจนดูเหมือน "เลื่อนดูไม่ได้" ทั้งที่ scroll ทำงานปกติ (แก้ไปแล้วใน Session 12 — เปลี่ยนเป็น `z-[60]`)

### Supabase Client Usage
- Client component → `lib/supabase/client.ts` (browser, `createBrowserClient`)
- Server component / action → `lib/supabase/server.ts` (cookies, `createServerClient`)
- Seed script เท่านั้น → service role key — ห้ามใช้ใน frontend เด็ดขาด

---

## Seed Script

### รัน
```bash
cd C:\dev\pawmate
npx ts-node --project scripts/tsconfig.json scripts/seed.ts        # pets
npx ts-node --project scripts/tsconfig.json scripts/seed-spots.ts  # playdate spots (24 ที่)
```

### `seed.ts` ทำอะไร (อัปเดตล่าสุด Session 8)
1. หา demo account ใน Supabase Auth (ใช้ `.limit(1)` ก่อน `.maybeSingle()` — กันพังตอน demo account มีหลาย pet)
2. สร้าง seed user ใหม่ (email: `seed-bot-{timestamp}@pawmate.internal`)
3. สร้าง **45 dogs + 40 cats** (random breed/sex/province) — เพิ่มจาก 25+20 เดิมตั้งแต่ Session 4-5
4. สร้าง breeding-compatible cohort (8 ตัวต่อ pet) **ให้ทุก pet จริงที่เปิดโหมด breeding** ไม่ใช่แค่ pet เดียวแบบเดิม (แก้ Session 8 — ของเดิมผูกกับ "pet ตัวเดียว" พอมี multi-pet แล้ว pet อื่นไม่มี candidate เลย)
5. สร้าง pre-likes ไปที่ pet เป้าหมายแต่ละตัว
6. รันซ้ำได้ — จะสร้าง seed user ใหม่ทุกครั้ง (ไม่มี duplicate error, เป็น additive)

### `seed-spots.ts` ทำอะไร
สร้าง 24 สถานที่เที่ยวเล่นกับสัตว์เลี้ยง (สวน/คาเฟ่/ชายหาด/รีสอร์ท) ลงตาราง `playdate_spots` — ใช้แนะนำใน `ScheduleSheet`

### ล้าง Seed Data
ลบ seed user ออกจาก Supabase Auth dashboard → pets และ likes จะถูก cascade delete

---

## Bugs ที่เจอและแก้ไปแล้ว

| ปัญหา | สาเหตุ | วิธีแก้ |
|---|---|---|
| npm ล้มเหลวบน G: drive | Google Drive EBADF/EPERM | ย้ายมา `C:\dev\pawmate` |
| TypeScript error ใน server.ts | `cookiesToSet` ไม่มี type | import `CookieOptions` จาก @supabase/ssr |
| Supabase URL ผิด | copy /rest/v1/ suffix มาด้วย | แก้ใน .env.local ให้เป็น base URL |
| Email rate limit exceeded | Supabase free tier limit | ปิด "Confirm email" ใน Auth settings |
| Demo login FK error | ไม่มีแถวใน profiles | เพิ่ม upsert profiles ใน demoLogin action |
| Set spread TypeScript error | downlevelIteration ไม่ได้เปิด | ใช้ `Array.from().concat()` แทน |
| seed.ts ถูก Next.js compile | ไม่มี exclude | เพิ่ม "scripts" ใน tsconfig.json exclude |
| CSS หายทุกหน้า | hot reload พัง | Ctrl+C แล้ว `npm run dev` ใหม่ |
| breeding mode ไม่มีการ์ด | seed ไม่ตรงสายพันธุ์ demo | เพิ่ม 8 breeding-compatible pets ใน seed script |
| breeding mode มีการ์ดแค่ใบเดียว | seed รันก่อน demo pet มี breeding mode → ไม่ได้สร้าง compatible pets + swipe feed ไม่ exclude likes จาก session เก่า | แก้ `fetchCards` ให้ query `likes` table ก่อนแสดงการ์ด + รัน seed ใหม่ (ดู Session 3) |
| GitHub Push Protection บล็อก push | DEVLOG.md มี `SUPABASE_SERVICE_ROLE_KEY` จริง | แก้ DEVLOG เป็น placeholder แล้ว `git commit --amend --no-edit` (safe เพราะยังไม่ได้ push) |
| Vercel deploy ล้มเหลว | Vercel ไม่ detect Next.js framework อัตโนมัติ → หา output dir `public` แทน `.next` | ไปที่ Vercel → Project Settings → General → Framework Preset → เลือก "Next.js" → Save → Redeploy ✅ |
| swipe mode toggle หายเมื่อ pet มีแค่ 1 mode | เงื่อนไข `availableModes.length > 1` ซ่อน toggle ทั้งก้อน | เปลี่ยนให้ render เสมอ โหมดที่ไม่ available ได้รับ `disabled` + `cursor-not-allowed text-brown-muted/30` + tooltip (Session 15) |
| greeting "สวัสดี, X" บน `/app/home` ไม่เปลี่ยนตาม active pet | ใช้ `ownerName` = `profile.display_name` (ค่า static ของ user ไม่ใช่ per-pet) | เปลี่ยนเป็น `activePet?.name` ซึ่งอัปเดตทุกครั้งที่สลับน้อง ลบ `ownerName` state + profile query ออกด้วย (Session 16) |

---

## Git & Deploy Status

### GitHub Repository
- **URL:** `https://github.com/thanatstamp-bit/pawmate`
- **Branch:** `main`
- **Status:** ✅ Push สำเร็จ (session 3) — commit `086b9c9`

### Vercel
- **Status:** ✅ Deploy ผ่านสมบูรณ์ (2026-06-12)
- **วิธีแก้ที่ใช้:** Vercel dashboard → Project → Settings → General → Framework Preset → เลือก **Next.js** → Save → Redeploy

### Env Vars ที่ใส่ใน Vercel แล้ว
- `NEXT_PUBLIC_SUPABASE_URL` ✅
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
- `DEMO_EMAIL` ✅
- `DEMO_PASSWORD` ✅
> ไม่ต้องใส่ `SUPABASE_SERVICE_ROLE_KEY` บน Vercel (ใช้เฉพาะ seed script local)

### หลัง Deploy ผ่านแล้ว ต้องทำ
- [x] Supabase dashboard → **Auth → URL Configuration** → เพิ่ม production URL (Site URL + Redirect URLs)
- [x] เปลี่ยน `DEMO_PASSWORD` จาก "change-me" เป็น password จริง (ทั้งใน Vercel env vars และ Supabase Auth dashboard)
- [x] ใส่ชื่อจริงและลิงก์ใน footer ของ landing page (`app/page.tsx` ค้นหา `[NAME]`)

## สิ่งที่ต้องทำก่อน Deploy (เดิม — อัปเดตแล้ว)

- [x] ตรวจ `.gitignore` ว่ามี `.env.local` อยู่แล้ว
- [x] สร้าง project ใน Vercel และใส่ env vars ทั้งหมด
- [x] เปลี่ยน `DEMO_PASSWORD` เป็น password จริง
- [x] ใส่ชื่อจริงและลิงก์ใน footer (`app/page.tsx`)

---

## QA Checklist มาตรฐาน — เช็คทุกครั้งที่แก้ feature ที่มี "สองฝั่ง"

ฟีเจอร์พวกรีวิว/บล็อก/รายงาน/แมตช์ ล้วนมีสองฝั่งที่ต้องเห็นผลตรงกัน ทดสอบด้วย 2 บัญชีคู่กันเสมอ (เปิด browser ปกติ + incognito):

- [ ] **บล็อก** — บล็อกจากฝั่ง A แล้วเช็คว่าฝั่ง B มองไม่เห็นการ์ด/แมตช์/แชทของ A เหมือนกัน (ไม่ใช่แค่ฝั่งเดียว)
- [ ] **รีวิว** — รีวิวจาก 2 ฝั่งแล้วเช็คว่าคะแนนเฉลี่ยคำนวณถูก, รีวิวซ้ำใน match เดิมไม่ได้ (ต้องขึ้นของเดิมให้แก้/ลบแทน)
- [ ] **รายงาน** — ส่งรายงานแล้วเช็คว่า toast ขึ้นถูก และฝั่งที่ถูกรายงานไม่รู้ตัว (reports table SELECT ได้แค่เจ้าของ report)
- [ ] **RLS spot-check** — ลอง query ข้อมูลของอีกบัญชีจากบัญชีที่ไม่ใช่เจ้าของใน Supabase SQL Editor (เปลี่ยน role เป็น authenticated + ใส่ JWT ของอีกฝั่ง) ถ้าดึงข้อมูลที่ไม่ใช่ของตัวเองได้ = RLS รั่ว ต้องแก้ก่อนไปต่อ

---

## Session 3 — 2026-06-11 (Bug Fix + Seed Expansion)

### ปัญหาที่แก้: Breeding Mode มีการ์ดแค่ใบเดียว

**สาเหตุ 2 ข้อ:**

1. **Data problem** — `fetchCards` filter ใช้ `eq("breed", myPet.breed)` + `neq("sex", myPet.sex)` + `contains("modes", ["breeding"])` ซึ่ง strict มาก จาก 45 random pets มีแค่ 1 ตัวที่ตรงสายพันธุ์ demo pet พอดี ส่วน 8 breeding-compatible pets ที่ควรจะมีนั้น **ไม่ถูกสร้าง** เพราะ seed รันก่อนที่ demo pet จะเปิดโหมด "หาคู่"

2. **Code problem** — `fetchCards` ใน `app/app/swipe/page.tsx` track likes เฉพาะ in-memory (`skippedIds`, `likedIds` refs) ซึ่งหายทุกครั้งที่ reload หน้า ทำให้การ์ดที่ like ไปแล้วใน session ก่อนหน้ากลับมาโผล่ซ้ำ

### โค้ดที่แก้

**`app/app/swipe/page.tsx` — ฟังก์ชัน `fetchCards`**

เพิ่มการ query ตาราง `likes` ทุกครั้งก่อน fetch cards เพื่อ exclude pets ที่เคย like ไปแล้วในทุก session:

```typescript
// ใหม่ — ดึง likes จาก DB ด้วย ไม่ใช่แค่ in-memory
const { data: prevLikes } = await supabase
  .from("likes")
  .select("to_pet_id")
  .eq("from_pet_id", myPet.id)
  .eq("mode", mode);
const prevLikedIds = new Set((prevLikes ?? []).map((l) => l.to_pet_id));

// seen รวม 3 แหล่ง: skipped (session), liked (session), liked (DB ทุก session)
const seen = new Set([
  ...Array.from(skippedIds.current),
  ...Array.from(likedIds.current),
  ...Array.from(prevLikedIds),
]);
```

### Seed Script ที่อัปเดต (`scripts/seed.ts`)

| รายการ | เดิม | ใหม่ |
|---|---|---|
| จำนวนหมา | 25 ตัว | **45 ตัว** |
| จำนวนแมว | 20 ตัว | **40 ตัว** |
| Breeding-compatible pets | 8 ตัว | **15 ตัว** |
| DOG_NAMES | 25 ชื่อ | **50 ชื่อ** |
| CAT_NAMES | 20 ชื่อ | **45 ชื่อ** |
| TAGS | 10 อัน | **15 อัน** (เพิ่ม ชอบน้ำ, กลัวน้ำ, ชอบเดินเล่น, ดุกับแปลกหน้า, เข้ากับแมวได้) |
| รวม pets | ~53 ตัว | **~100 ตัว** |

### วิธีรัน Seed Script

```bash
# รันจาก root ของโปรเจกต์
npx ts-node --project scripts/tsconfig.json scripts/seed.ts
```

**ข้อควรระวังก่อนรัน:**
- ตรวจว่า demo pet เปิดโหมด "หาคู่" แล้ว — ถ้าไม่เปิด ส่วน breeding-compatible 15 ตัวจะถูกข้าม
- ลบ seed users เก่า (`seed-bot-*@pawmate.internal`) ออกจาก Supabase Auth dashboard ก่อนรัน เพื่อไม่ให้ pets ซ้ำสะสม

**Seed script ทำอะไร:**
1. หา demo pet ใน Supabase
2. สร้าง seed user ใหม่ (`seed-bot-{timestamp}@pawmate.internal`)
3. สร้าง 45 dogs + 40 cats แบบสุ่ม (breed/sex/province)
4. สร้าง 15 breeding-compatible pets ที่ตรงสายพันธุ์ + เพศตรงข้ามกับ demo pet
5. สร้าง pre-likes จาก breeding pets → demo pet (mode: breeding)
6. สร้าง 10 pre-likes จาก random pets → demo pet (mode: playdate)

**ผลลัพธ์การรัน Session 3:**
```
✅ 45 dogs created
✅ 40 cats created
✅ 15 breeding-compatible pets (dog, ชิวาวา, male) + pre-likes
✅ 10 pre-likes (playdate) → demo pet
🎉 Seed complete! Created 100 pets
   Seed user ID: a6cb5844-7ee2-4382-b3f7-667e3e746368
```

### Git & Deploy

```
git commit -m "fix: exclude previously liked pets from swipe feed"
# commit: 086b9c9
# 1 file changed, 13 insertions(+), 1 deletion(-)

git push  # → main (Vercel auto-deploy triggered)
```

> **หมายเหตุ:** Seed data เขียนตรงเข้า Supabase — ไม่ต้อง redeploy เพื่อให้ข้อมูลใหม่ขึ้น แค่โหลดหน้าใหม่ก็เห็นการ์ดทันที

---

## Session 4 — 2026-06-12 (Dashboard + Multi-Pet + UI Polish)

### 1. Dashboard หน้าใหม่ + รองรับหลายตัวต่อ account

**ไฟล์ที่สร้างใหม่:**
- `components/dashboard/PetStatCard.tsx` — card แสดงข้อมูล + stats ต่อสัตว์เลี้ยง 1 ตัว
- `app/app/dashboard/page.tsx` — หน้า dashboard รวม: list ทุกตัว, switch active, stats, logout/delete

**ไฟล์ที่แก้ไข:**
- `components/BottomNav.tsx` — เพิ่ม tab "แดชบอร์ด" (LayoutDashboard icon) รวมเป็น 4 tabs
- `app/app/swipe/page.tsx` — โหลด pet จาก `localStorage.pawmate_active_pet_id` แทน `.maybeSingle()`
- `app/app/profile/page.tsx` — โหลด pet จาก `localStorage.pawmate_active_pet_id` เช่นกัน
- `app/onboarding/page.tsx` — หลัง create pet ใหม่: set active pet → redirect ไป `/app/dashboard`

**Active Pet Concept** — localStorage key: `pawmate_active_pet_id`
- Swipe/Profile: อ่าน key ก่อน ถ้าไม่มี/ไม่ตรง → fall back ตัวแรก แล้ว set ลง localStorage
- Dashboard: กด "ใช้ตัวนี้" → setItem ทันที, swipe page รับค่าใหม่ครั้งถัดไปที่โหลด

**Stats ต่อ Pet Card** — ดึง 3 parallel queries ไม่มี N+1:

| ไอคอน | ชื่อ | Query |
|---|---|---|
| ❤️ | ถูกไลก์ | `likes WHERE to_pet_id = $id` |
| 👥 | แมตช์ | `matches WHERE pet_a_id = $id OR pet_b_id = $id` |
| 📤 | ส่งไลก์ | `likes WHERE from_pet_id = $id` |

---

### 2. ปุ่มย้อนกลับทุก step ใน Onboarding

**ไฟล์:** `app/onboarding/page.tsx`

เดิม: ปุ่ม `<` แสดงเฉพาะ `step > 1`
ใหม่: แสดงทุก step — step 1 ใช้ `router.back()` (ออกจาก wizard), step 2–4 ย้อนกลับ step ก่อน

```typescript
onClick={() => {
  if (step > 1) { setStep(step - 1); setError(null); }
  else { router.back(); }
}}
```

---

### 3. เปลี่ยน Logo ทั่วทั้งแอป

**ไฟล์ logo:** `public/logo.png` (copy จาก Downloads)

**ลบพื้นหลังโปร่งใส** — ใช้ Python + Pillow flood-fill จากขอบภาพ (magic wand style):
```bash
# ติดตั้ง pillow แล้วรัน script
python -c "
from PIL import Image
from collections import deque
img = Image.open('public/logo.png').convert('RGBA')
# flood-fill จาก 4 ขอบ, tolerance=70
# ผลลัพธ์: 324,712 pixels → transparent
img.save('public/logo.png', 'PNG')
"
```

**จุดที่ใช้ logo:**

| ไฟล์ | ขนาด | แทนที่อะไร |
|---|---|---|
| `app/page.tsx` (landing) | 120×120 | Coral circle + PawPrint icon |
| `app/login/page.tsx` | 96×96 | Coral circle + "PawMate" text |
| `app/app/swipe/page.tsx` (header) | 40×40 | Text "PawMate" เดิม |

Logo ใน swipe header แสดงควบคู่กับข้อความ "PawMate" (`font-medium`) ด้านขวา:
```tsx
<div className="flex items-center gap-2">
  <img src="/logo.png" className="h-10 w-10 object-contain drop-shadow-sm" />
  <span className="text-xl font-medium text-brown">PawMate</span>
</div>
```

---

### 4. เปลี่ยน Font → Prompt

**สาเหตุ:** Nunito (Latin) + IBM Plex Sans Thai ดู mismatched และ IBM Plex Sans Thai ดู stiff เกินไป

**Font ใหม่:** [Prompt](https://fonts.google.com/specimen/Prompt) — รองรับ Thai + Latin ในตัวเดียว, popular ใน Thai apps (Grab, SCB Easy)

**ไฟล์ที่แก้:**
- `app/layout.tsx` — เปลี่ยน import + variable จาก 2 fonts → Prompt เดียว (weights 300–700)
- `tailwind.config.ts` — เปลี่ยน CSS variable เป็น `--font-prompt`

```typescript
// layout.tsx
const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-prompt",
  display: "swap",
});
```

---

### 5. ปรับ Font Weight ใน Swipe Header

`font-bold` (700) → `font-medium` (500) สำหรับ "PawMate" text ข้างโลโก้ เพราะดูหนาเกินไป

---

### 6. แก้ FilterSheet ถูก Bottom Nav ทับ

**ปัญหา:** FilterSheet และ BottomNav ใช้ `z-50` เท่ากัน nav render ทีหลังจึงทับ sheet

**แก้ `components/swipe/FilterSheet.tsx`:**
- `z-50` → `z-[60]` (สูงกว่า nav)
- `p-6` → `px-6 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]` (เผื่อ safe area iPhone)

---

## Session 5 — 2026-06-13 (Advanced Filters + Playdate Scheduling + Demo Match)

### 1. Advanced Filters ใน Swipe Feed

**ไฟล์ที่แก้:**
- `lib/data/breeds.ts` — เพิ่ม `BREED_SIZE_MAP: Record<string, "small"|"medium"|"large">` ก่อน DOG_BREEDS array
- `components/swipe/FilterSheet.tsx` — เขียนใหม่ทั้งหมด

**Filter ใหม่ที่เพิ่ม:**

| Filter | วิธีกรอง | หมายเหตุ |
|---|---|---|
| สายพันธุ์ (breed) | DB-side `.eq("breed", ...)` | ซ่อนเมื่อ mode=breeding (ถูกกำหนดโดยสายพันธุ์ demo pet อยู่แล้ว) |
| ขนาด (size) | Client-side ผ่าน BREED_SIZE_MAP | small/medium/large |
| อายุ (ageMin/ageMax) | DB-side `.lte/.gte("birth_month", ...)` | age→birth_month แปลงผ่าน date math |
| นิสัย (tags) | Client-side overlap check | multi-select chips |
| ใบรับรองสุขภาพ | DB-side `.eq("vaccinated", true)` | เฉพาะ mode=breeding |

**Type ที่ export จาก FilterSheet:**
```typescript
export type SwipeFilters = {
  province: string; breed: string; size: string;
  ageMin: number; ageMax: number; tags: string[];
  vaccinated: boolean; neutered: boolean;
};
export const DEFAULT_FILTERS: SwipeFilters = {...};
export function countActiveFilters(f: SwipeFilters): number {...}
```

FilterSheet ใช้ draft state — การเปลี่ยนแปลงมีผลเฉพาะเมื่อกด "ดูผลลัพธ์"
Filter button มี badge แสดงจำนวน active filters

---

### 2. Playdate Scheduling Feature

**Migration ใหม่:**
- `supabase/migrations/008_playdates.sql` — 2 tables + RLS

```sql
playdate_spots (id, name, type, province, district, address, description, created_at)
-- type: 'park'|'cafe'|'beach'|'resort'|'other'
-- RLS: public read-only

playdate_proposals (id, match_id, proposer_pet_id, proposed_at, spot_id, custom_location, note, status, created_at)
-- status: 'pending'|'accepted'|'declined'|'cancelled'
-- RLS: is_in_match(match_id) สำหรับ read, owns_pet(proposer_pet_id) สำหรับ insert
-- 1 active proposal ต่อ match — insert ใหม่จะ cancel อันเก่า
```

**Seed spots:** `scripts/seed-spots.ts` — 24 pet-friendly spots
- กรุงเทพฯ 10, เชียงใหม่ 5, ภูเก็ต 4, ชลบุรี 3, ขอนแก่น 2
- รัน: `npx ts-node --project scripts/tsconfig.json scripts/seed-spots.ts`

**Components ใหม่:**
- `components/playdates/ScheduleSheet.tsx` — bottom sheet นัดหมาย, props: `{ matchId, myPetId, province, onClose, onSuccess }`
- `components/playdates/ProposalBanner.tsx` — banner แสดงสถานะนัด, export type `ProposalData`
  - 3 states: pending-proposer (amber), pending-receiver (coral), accepted (teal)

**ไฟล์ที่แก้:**
- `app/app/chat/[matchId]/page.tsx` — เพิ่ม CalendarDays button (playdate mode เท่านั้น), ProposalBanner, ScheduleSheet modal
- `app/app/matches/page.tsx` — เพิ่ม tab 'playdates' แสดงนัดหมายทั้งหมด

---

### 3. Demo Match Mockup

**ปัญหา:** ยังไม่มีผู้ใช้จริง → Demo user ปัดแล้วไม่ได้แมตช์เลย

**วิธีแก้:** สุ่มทุกๆ 3–7 swipe จะบังคับให้เกิด match 1 ครั้ง (ไม่เกิน 10 swipe แน่นอน)

**Migration:** `supabase/migrations/009_demo_match.sql`
```sql
CREATE OR REPLACE FUNCTION create_demo_match(p_from_pet uuid, p_to_pet uuid, p_mode text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$...$$;
-- SECURITY DEFINER: insert reverse-like bypass RLS, สร้าง match
-- Safety check: IF NOT owns_pet(p_from_pet) THEN RAISE EXCEPTION 'unauthorized'
-- Returns: match UUID (existing or newly created)
```

**Logic ใน `app/app/swipe/page.tsx`:**
```typescript
// Module-level
function randomThreshold() { return 3 + Math.floor(Math.random() * 5); } // 3–7

// Refs (ไม่ใช้ state เพื่อไม่ให้ re-render)
const swipeCount = useRef(0);
const forceNext  = useRef(false);
const matchAt    = useRef(randomThreshold());

// ใน handleLike — หลัง checkAndCreateMatch คืน null:
if (!matchId && forceNext.current) {
  const { data } = await supabase.rpc("create_demo_match", {...});
  matchId = data ?? null;
}
```

---

## Session 6 — 2026-06-14 (Bug Fixes: Matches Page + Deck Exhaustion)

### 1. แก้ Matches Page แสดง "ยังไม่มีแมตช์" ทั้งที่มีแมตช์ใน DB

**สาเหตุ:**
`matches/page.tsx` และ `chat/[matchId]/page.tsx` ใช้ `.maybeSingle()` โดยไม่อ่าน `localStorage.pawmate_active_pet_id` — ถ้า demo account มีหลาย pet, `.maybeSingle()` จะ error (return null) → page return ก่อนแสดงข้อมูล

**วิธีแก้:** ใช้ pattern เดียวกับ swipe page ทั้ง 2 ไฟล์:

```typescript
// matches/page.tsx และ chat/[matchId]/page.tsx
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

**กฎ (สำคัญ):** ทุกหน้าที่ต้องรู้ว่า pet ตัวไหน active ต้องใช้ pattern นี้เสมอ — ห้ามใช้ `.maybeSingle()` โดยไม่เช็ก localStorage

---

### 2. แก้ Deck Exhaustion — การ์ดหมดแล้วปัดต่อไม่ได้

**สาเหตุ:** หลังปัดครบทุกใบใน batch (50 ใบ) หรือหลัง DB likes ล้น → cards = [] → empty state แสดงถาวร

**วิธีแก้:** Auto-recycle 2 ชั้น ใน `app/app/swipe/page.tsx`

**ชั้นที่ 1 — ใน `fetchCards(recycle = false)`:**
```typescript
// เมื่อ fetch คืน 0 ผลและยังไม่ได้ recycle:
if (result.length === 0 && !recycle) {
  skippedIds.current = new Set();
  likedIds.current   = new Set();
  fetchCards(true); // โหลดซ้ำโดยไม่กรอง prevLikes
  return;
}
```

**ชั้นที่ 2 — `useEffect` เฝ้า `cards.length`:**
```typescript
const deckExhausted = useRef(false); // guard ป้องกัน infinite loop

useEffect(() => {
  if (cards.length > 0) { deckExhausted.current = false; return; }
  if (loading || !myPet || deckExhausted.current) return;
  deckExhausted.current = true;
  const t = setTimeout(() => fetchCards(), 600); // รอ 600ms ให้ user เห็น empty state สั้นๆ
  return () => clearTimeout(t);
}, [cards.length, loading, myPet, fetchCards]);
```

**Reset `deckExhausted`:** ทำใน `handleFilterChange` และ mode change `useEffect`

---

## Session 7 — 2026-06-14 (Phase 6: Trust Layer)

เริ่ม Expansion Kit เฟสแรก — ชั้นความน่าเชื่อถือ: badge, รีวิว, รายงาน, บล็อก

### 1. Migration ใหม่ — `010_trust.sql`

> ⚠️ Expansion doc เขียน `002_trust.sql` แต่ `002_storage_policies.sql` มีอยู่แล้ว → ใช้ **010** ตามลำดับจริง (001, 002, 008, 009)

3 ตาราง + RLS (reuse helper `owns_pet()` / `is_in_match()` จาก 001):

| ตาราง | คอลัมน์สำคัญ | RLS |
|---|---|---|
| `reviews` | match_id, reviewer_pet_id, reviewed_pet_id, rating (1–5), tags[], comment · UNIQUE(match_id, reviewer_pet_id) | SELECT ทุกคน (ratings โชว์บนการ์ด), INSERT = owns_pet+is_in_match, UPDATE = owns_pet |
| `reports` | reporter_pet_id, reported_pet_id, reason, details | INSERT/SELECT = owns_pet(reporter) เท่านั้น |
| `blocks` | blocker_pet_id, blocked_pet_id · UNIQUE + no_self CHECK | SELECT = owns เจ้าของฝั่งใดก็ได้, INSERT/DELETE = owns_pet(blocker) |

**ต้องรันเองใน Supabase SQL Editor** (เหมือน 008/009)

### 2. Reusable block filter — `lib/blocks.ts` (ใหม่)

`getBlockedPetIds(supabase, myPetId)` → คืน `Set<string>` ของ pet ที่บล็อก **ทั้งสองทิศทาง** (เราบล็อกเขา + เขาบล็อกเรา) ใช้ร่วมกันทั้ง swipe + matches + chat guard — ไม่ลบข้อมูล

### 3. Components ใหม่ `components/trust/`

- `RatingSummary.tsx` — fetch reviews ตอนเปิด detail sheet, โชว์ดาวเฉลี่ย (1 ทศนิยม) + count + 3 คอมเมนต์ล่าสุด + Thai `timeAgo()`
- `ReviewModal.tsx` — 1–5 ดาว + tag chips (ตรงปก/เป็นมิตร/แนะนำเลย) + comment; fetch รีวิวเดิม → UPDATE ถ้ามี, INSERT ถ้าไม่มี
- `ReportSheet.tsx` — bottom sheet (z-[60] + safe-area), 4 เหตุผล + details
- `BlockConfirm.tsx` — confirm dialog (สไตล์เดียวกับ delete dialog ใน profile)
- `Toast.tsx` — pill auto-dismiss สำหรับ thank-you

### 4. ไฟล์ที่แก้

- `components/swipe/PetCard.tsx` — เพิ่ม prop `myPetId` + `onBlock`; badge วัคซีน/ทำหมัน (card face + detail sheet) + amber warning `ยังไม่ยืนยันวัคซีน` (breeding mode); RatingSummary; ปุ่มรายงาน/บล็อก ใน detail sheet
  - **หมายเหตุ TS:** ดึง flag (`showVaccinated`/`showNeutered`/`showVaccineWarning`) เป็น const ก่อน return — ถ้าเขียน `pet.vaccinated !== true` ใน OR-chain หลัง `=== true` จะโดน TS2367 (narrowing)
- `app/app/swipe/page.tsx` — `fetchCards` merge blocked IDs เข้า `seen` **ทุกกรณีรวม recycle**; ส่ง `myPetId`/`onBlock` ให้ PetCard
- `app/app/chat/[matchId]/page.tsx` — เมนู ⋮ (ให้คะแนน/รายงาน/บล็อก) + block guard ตอนโหลด (redirect ไป matches) + Toast
- `app/app/matches/page.tsx` — filter `visibleMatches` ตัด match ที่ pet ถูกบล็อก ก่อน build rows

### 5. ตรวจแล้ว

- ✅ `npx tsc --noEmit` ผ่าน
- ⏳ ยังต้องทดสอบ 2 บัญชี: รีวิว 2 ฝั่ง, แก้รีวิวเดิม, บล็อกแล้วหายทั้ง 2 ฝั่ง, รายงาน + toast (หลังรัน migration)

---

## Session 8 — 2026-06-16 (Bug Fixes: Onboarding Loop on Login + Breeding Deck Exhaustion)

### 1. Sign-in เด้งกลับ Onboarding ทั้งที่มี pet อยู่แล้ว

**สาเหตุ:** `handleLogin` (`components/AuthForm.tsx`) และ `demoLogin` (`app/login/actions.ts`) เช็คว่า account มี pet หรือยังด้วย `.maybeSingle()` แบบเปลือยๆ — error ทันทีถ้า account มี pet มากกว่า 1 ตัว (multi-pet feature) แล้วโค้ดไม่เช็ก `error` เลย ทำให้ `pet` เป็น `null` เหมือนไม่มี pet → เด้งไป `/onboarding` ทุกครั้งที่ sign in ทั้งที่มี pet อยู่แล้ว

**วิธีแก้:** เพิ่ม `.limit(1)` ก่อน `.maybeSingle()` ทั้ง 2 ที่ (ตรงกับ pattern ที่ `app/app/home/page.tsx` ใช้อยู่แล้ว)

**กฎเดิมที่ลืมใช้กับ login flow:** ทุกที่ที่เช็ก "มี pet ไหม" ต้องกัน multi-pet เสมอ ไม่ใช่แค่หน้าที่ query active pet (ดู [[feedback-active-pet]] ใน memory)

---

### 2. การ์ดหมดถาวรในโหมด "หาคู่" (breeding)

**สาเหตุ:** ไม่ใช่บัคใน auto-recycle logic ของ Session 6 (ยังทำงานถูกต้อง) — เป็นปัญหาข้อมูลจริง: `scripts/seed.ts` สร้าง breeding-compatible pets (เพศตรงข้าม + สายพันธุ์เดียวกัน) ผูกกับ **pet ตัวเดียว** ที่หาเจอตอนรัน (สมัยยังไม่มี multi-pet) พอมี pet ใหม่ที่เพศ/สายพันธุ์ไม่ตรงกับตอน seed ครั้งแรก (เช่น "ถุงเงิน" ตัวผู้ ชิวาวา ในขณะที่ cohort เดิมสร้างไว้สำหรับคู่ของ "น้องถุงทอง" ตัวเมีย) จะไม่มี candidate เพศตรงข้ามเลย เหลือแค่สุ่มจาก pool ทั่วไป 1-2 ตัว พอไลก์หมดก็การ์ดหมดถาวร (recycle คืนซ้ำไม่ได้เพราะ liked ไม่เคลียร์)

**บัคแฝงที่เจอด้วย:** ฟังก์ชันหา demo pet ใน `seed.ts` ก็ใช้ `.maybeSingle()` เปลือยๆ เหมือนกัน — ถ้ารันซ้ำตอนนี้ (demo มี 2 pets แล้ว) จะ error เงียบๆ แล้ว skip การสร้าง breeding-compatible ทั้งหมด

**วิธีแก้ (`scripts/seed.ts`):**
- เพิ่ม `.limit(1)` ก่อน `.maybeSingle()` ตอนหา demo pet
- เปลี่ยน breeding-compatible generation จากผูกกับ "demo pet ตัวเดียว" เป็น loop ทุก pet จริง (ไม่ใช่ seed-bot) ที่เปิดโหมด breeding — สร้าง cohort 8 ตัว (เพศตรงข้าม สายพันธุ์เดียวกัน) + pre-like ให้ทุกตัวที่เจอ

**รันสคริปต์แล้ว:** สร้าง breeding-compatible cohort ให้ครบ 3 pet จริงที่เปิดโหมด breeding (รวม "ถุงเงิน" ที่ก่อนหน้านี้มี candidate เหลือ 0 → ตอนนี้มี 9 ตัวที่ยังไม่ไลก์)

**ข้อสังเกตสำหรับอนาคต:** seed script ที่ผูก logic กับ "ตัวเดียว" ไม่ scale กับ multi-pet/multi-account — ทุกครั้งที่เพิ่มฟีเจอร์ที่เปิดให้มีหลาย entity ต่อ user ต้องเช็คว่า seed/demo data script รองรับด้วย

---

### 3. ปุ่มนัดหมาย (Playdate Scheduling) หายไปในแชทโหมด "หาคู่"

**ไม่ใช่บัค** — Session 5 ตั้งใจ scope ปุ่ม CalendarDays + ScheduleSheet ไว้เฉพาะ `matchMode === "playdate"` เท่านั้น แมตช์โหมด breeding จะไม่เห็นปุ่มนัดหมายเลย

**เปลี่ยนตามคำขอ user:** เปิดให้ใช้ได้ทั้ง 2 โหมด เพราะ breeding ก็ต้องนัดเจอตัวจริงเหมือนกัน

**ไฟล์ที่แก้:**
- `app/app/chat/[matchId]/page.tsx` — เอาเงื่อนไข `matchMode === "playdate"` ออกจากปุ่ม CalendarDays (header) และปุ่มในสถานะแชทว่าง; ลบ state `matchMode`/`setMatchMode` ที่ไม่ได้ใช้แล้วทั้งหมด (รวม column `mode` ที่ query มาเฉพาะเพื่อสิ่งนี้)
- `components/playdates/ScheduleSheet.tsx` — หัวข้อ bottom sheet เปลี่ยนจาก "นัดหมาย Playdate" → "นัดหมาย" (ใช้ได้ทั้งสองโหมด)
- `app/app/matches/page.tsx` — ข้อความ hint ในแท็บนัดหมาย (empty state) เปลี่ยนจาก "...เพื่อนัด Playdate" → "...เพื่อนัดหมาย"

**หมายเหตุ:** ไม่ต้องแก้ DB/RLS — `playdate_proposals` ไม่เคยมีเงื่อนไขผูกกับ mode ตั้งแต่แรก (เช็คแค่ `is_in_match`) และ `/app/matches` แท็บนัดหมาย query ข้าม mode อยู่แล้ว

---

## Session 9 — 2026-06-16 (Swipe Feed Layout — ปรับตาม Wireframe)

### Refactor: `/app/swipe` layout ให้ตรงกับ `pawmate_wireframe/Swipe Feed Wireframe.dc.html`

**ที่มา:** มีโฟลเดอร์ `pawmate_wireframe/` ในรูทโปรเจกต์ (mid-fi wireframe เป็น static HTML export) ที่นิยาม layout ของหน้า swipe ไว้ต่างจากของจริงในหลายจุด — user ขอให้ปรับ UI ให้ตรงตาม wireframe นี้

**สิ่งที่เปลี่ยน:**
- **ไม่แสดง logo header บนหน้า swipe** — `components/ConditionalAppHeader.tsx` ซ่อน `AppHeader` เพิ่มสำหรับ path `/app/swipe` (เดิมซ่อนแค่ `/app/chat/*`) ตาม annotation ใน wireframe ที่บอกว่าต้องการพื้นที่แนวตั้งให้การ์ดมากที่สุด
- **Mode toggle + filter** (`app/app/swipe/page.tsx`) — เปลี่ยนจาก pill toggle สีขาว + ปุ่ม "ตัวกรอง" แบบมีข้อความ เป็น segmented control พื้นหลังเทาอ่อน (`#EDEAE6`) + ปุ่มไอคอนกรองเปล่าๆ ขนาด 40×40 (มี badge ตัวเลขมุมขวาบนเมื่อมี filter active)
- **โครงสร้างการ์ด** (`components/swipe/PetCard.tsx`) — เปลี่ยนจากรูปเต็มการ์ด + gradient overlay + ข้อความสีขาวทับรูป เป็นรูป (`aspect-[4/3]`) ต่อด้วย info strip พื้นขาวแยกด้านล่าง (ชื่อ+อายุ, สายพันธุ์+ที่อยู่, trust badges, personality tags, แถว "ดูข้อมูลเพิ่ม" มีเส้นแบ่งด้านบน) ตาม wireframe
- **ปุ่ม ถูกใจ/ผ่าน ย้ายออกจากการ์ด** — เดิมอยู่ในกล่องขาวเดียวกับรูป ตอนนี้ย้ายไปเป็นแถวแยกที่ระดับหน้า (`app/app/swipe/page.tsx`) อยู่ใต้การ์ดเสมอ ไม่ขยับตามขนาดเนื้อหาการ์ด — `PetCard` ตัด prop `onLike`/`onSkip` ออก (เหลือแค่ `onBlock` สำหรับ flow บล็อกใน detail sheet)
- **Empty state** — เปลี่ยนข้อความ/ไอคอน/ปุ่มให้ตรง wireframe: ไอคอน `Search` (เดิม `PawPrint`), หัวข้อ "ดูครบแล้ว!" (เดิม "การ์ดหมดแล้ว"), ปุ่ม "ดูใหม่อีกครั้ง" เรียก `fetchCards()` ตรงๆ (recycle) แทนปุ่ม "เปลี่ยน filter" เดิม — สอดคล้องกับ auto-recycle logic ที่มีอยู่แล้วจาก Session 6
- **Loading state** — เปลี่ยนจาก spinner ไอคอนกลางจอ เป็น skeleton card ที่มีสัดส่วนตรงกับการ์ดจริง (รูป + แถบเทาแทนชื่อ/breed/badge) ตาม annotation "skeleton mirrors card exact dimensions"

**ไม่แก้:** `components/swipe/FilterSheet.tsx` — wireframe เป็นแค่ frame เสริม (secondary) ที่โชว์ filter แบบง่าย (ชนิด/ระยะทาง/อายุ) แต่ของจริงมี advanced filters จาก Session 5 (จังหวัด, สายพันธุ์, ขนาด, ช่วงอายุ, นิสัย, ใบรับรองสุขภาพ) ซึ่งเป็นฟีเจอร์ที่ใช้งานจริงอยู่แล้ว ไม่ตัดออกเพื่อให้ตรง mock แบบเดียวกับ layout หลัก

**Verify:** `npx tsc --noEmit` ผ่านสะอาด — ไม่มี browser tool ในเซสชันนี้ ยังไม่ได้ตรวจสอบผลจริงในเบราว์เซอร์ ควรลองเปิด `/app/swipe` เทียบกับ wireframe ด้วยตา

**แก้ไขเพิ่ม (ratio, รอบ 1):** user ส่ง screenshot ของ wireframe มาเทียบ — สัดส่วนกรอบรูปเดิม (`aspect-[4/3]`) สูงเกินไป คำนวณจาก pixel ค่าจริงใน `Swipe Feed Wireframe.dc.html` (CSS box model, ประมาณค่า line-height เอง) ได้ ratio ≈1.5 → ปรับเป็น `aspect-[3/2]`

**แก้ไขเพิ่ม (ratio, รอบ 2 — ค่าแม่นยำกว่า):** user ยืนยันว่ายังไม่ตรง พร้อมส่ง screenshot ใหม่ของการ์ดเดี่ยวๆ มาเทียบ — รอบนี้ใช้ Python/PIL สแกนสีพิกเซลของ screenshot จริง (ไม่ใช่ประมาณจาก CSS) หาขอบกรอบรูป (เปลี่ยนจากสีเทา `#E0DDD8` เป็นสีขาว `#FDFCFB`) ได้กรอบรูปจริง ≈268×161px → ratio ≈1.665 ≈ **5:3** (แม่นยำกว่ารอบแรกมาก, cross-check กับความสูงรวมการ์ด 268×277px ≈0.967 ตรงกับค่าที่คำนวณจาก HTML เดิม 358×370px ≈0.967 ทุกประการ ยืนยันว่าตัวเลขนี้ถูก) ปรับเป็น `aspect-[5/3]` ทั้งที่การ์ดจริง (`PetCard.tsx`) และ skeleton loading (`app/app/swipe/page.tsx`)

---

## Session 10 — 2026-06-16 (ยุบหน้า Dashboard เข้ากับ Profile)

### Merge: `/app/dashboard` + `/app/profile` → `/app/profile` เดียว

**ที่มา:** user มองว่าสองหน้านี้ทำหน้าที่คล้ายกันเกินไป ไม่เห็นความแตกต่างชัดเจน ขอให้ยุบรวมเป็นหน้าเดียว

**เดิม:**
- `/app/dashboard` — list pet ทั้งหมด (`PetStatCard`: รูป+ชื่อ+breed+อายุ+เพศ+mode badges, stats 3 ช่อง likesReceived/matches/likesSent, ปุ่มสับ active pet + แก้ไข), ปุ่มเพิ่มน้อง, account actions (logout/ลบบัญชี)
- `/app/profile` — แสดงแค่ active pet ตัวเดียวแบบละเอียด (รูปใหญ่+gradient overlay, photo strip, location, personality tags, bio, mode badges แบบ label เต็ม), ปุ่มแก้ไข → `/onboarding`, account actions (ซ้ำกับ dashboard)

**ใหม่ (`app/app/profile/page.tsx` เขียนใหม่ทั้งไฟล์):**
- **Active pet** แสดงแบบละเอียดเหมือน Profile เดิมทั้งหมด (รูป+gradient, photo strip, tags, bio, mode badges) **+ เพิ่ม stats row 3 ช่องจาก Dashboard** เข้าไปในการ์ดเดียวกัน
- **น้องตัวอื่นของฉัน** — section ใหม่ (โชว์เฉพาะเมื่อมีมากกว่า 1 ตัว) ใช้ `PetStatCard` (เดิมจาก dashboard, ไม่แก้ component) แสดงเฉพาะ pet ที่ไม่ active พร้อมปุ่ม "ใช้ตัวนี้" สลับ active pet ทันทีในหน้าเดียว (ไม่ต้อง navigate)
- Header เดียว ("โปรไฟล์น้อง" + ปุ่ม "เพิ่มน้อง" → `/onboarding`), account section เดียว (ไม่ซ้ำซ้อนแล้ว)
- Query pets ดึง column ครบ (ของเดิม dashboard ดึงแค่บางอัน, profile ดึง `*`) ในครั้งเดียว เพื่อให้ทั้ง active hero และ switcher list ใช้ query เดียวกันได้

**ไฟล์ที่แก้/ลบ:**
- ลบ `app/app/dashboard/page.tsx` ทั้งไฟล์ (ลบ route ทิ้งไปเลย ไม่ทำ redirect stub เพราะเป็นโปรเจกต์ที่ยังไม่มี user จริงผูก bookmark ไว้)
- `components/BottomNav.tsx` — เอา tab "แดชบอร์ด" ออก (เหลือ 4 tabs: หน้าแรก/ปัดการ์ด/แมตช์/โปรไฟล์)
- `app/onboarding/page.tsx` — redirect หลังสร้าง pet สำเร็จ เปลี่ยนจาก `/app/dashboard` → `/app/profile`
- `CLAUDE.md` — ลบแถว `/app/dashboard` ใน route table, รวม description เข้า `/app/profile`; แก้ข้อความ "Active pet pattern" ที่อ้าง Dashboard page ให้ชี้ไป Profile page แทน

**ไม่ได้แก้:** `components/dashboard/PetStatCard.tsx` — ยังอยู่ที่เดิม (path เดิม) เพราะ type `DashboardPet` เป็น subset ของ `Pet` ใหม่ใน profile page อยู่แล้ว ใช้ซ้ำได้ตรงๆ ไม่ต้องแก้

**Verify:** ลบ `.next/` cache ก่อน (มี type ค้างอ้างถึง route `dashboard` ที่ลบไปแล้ว ทำให้ `tsc` error ชั่วคราว) แล้ว `npx tsc --noEmit` ผ่านสะอาด — ไม่มี browser tool ในเซสชันนี้ ยังไม่ได้ตรวจสอบ UI จริงในเบราว์เซอร์

---

## Session 11 — 2026-06-16 (Swipe Feed: หน้าจอ scroll ได้ + กรอบรูปยังสูงเกิน)

### Fix: `/app/swipe` ต้อง fit พอดีจอ ห้าม scroll + กรอบรูปสั้นลงครึ่งหนึ่ง

**ที่มา:** user ส่ง screenshot จริงจากเบราว์เซอร์มาหลังแก้ ratio รอบที่แล้ว (`aspect-[5/3]`) — พบว่าหน้าจอยัง scroll ได้ และรูปสุนัขที่แสดงผลจริงเป็นแนวตั้ง (สูงกว่ากว้าง) ทั้งที่ตั้ง `aspect-[5/3]` ไว้ (ควรเป็นแนวนอน กว้าง:สูง = 1.67:1)

**วัดจาก screenshot จริงด้วย Python/PIL อีกครั้ง:** กรอบรูปจริงสูง ~428px จากความสูงจอทั้งหมด ~818px (เกินครึ่งจอ) — สรุปว่า `aspect-ratio` CSS ไม่ถูกนำไปใช้จริงตามที่ตั้งไว้ (สาเหตุที่แท้จริงไม่ชัดเจน — อาจเป็น dev server/browser cache ค้าง หรือ aspect-ratio ตีกับ flexbox ใน edge case บางอย่าง) ทำให้ photo div ใช้ความสูงตามสัดส่วนภาพต้นฉบับ (แนวตั้ง) แทน

**วิธีแก้ (เปลี่ยนวิธีคิดทั้งหมด ไม่พึ่ง `aspect-ratio` อีกแล้ว):**
- **`app/app/swipe/page.tsx`** — root container เปลี่ยนจาก `min-h-screen` (สูงได้ไม่จำกัด ถ้า content ยาวเกิน 100vh จะ scroll) เป็น `h-[calc(100dvh-5rem)]` (ความสูง**คงที่** พอดีกับพื้นที่เหนือ BottomNav เป๊ะๆ, `5rem`=`pb-20` ที่ `app/app/layout.tsx` กันไว้ให้ nav) + `overflow-hidden` — การันตีไม่มี scroll ได้แน่นอนไม่ว่า content จะยาวแค่ไหน (ถ้าเกินจะถูก clip ไม่ใช่ scroll)
- **`components/swipe/PetCard.tsx`** — เลิกใช้ `aspect-[5/3]` ทั้งหมด เปลี่ยน photo เป็น `h-[24dvh]` (ความสูงคงที่ ~24% ของจอ ไม่ผูกกับความกว้าง) — ทั้งสั้นลงจริง (ครึ่งหนึ่งของ ~428px ที่เคยเจอ) และไม่พึ่ง aspect-ratio ที่ไม่น่าเชื่อถือ; back-peek card เปลี่ยนจาก `aspect-[9/10]` เป็น stretch (`top-3 bottom-0`) ตามความสูงจริงของ front card แทน
- โครงสร้าง flex เปลี่ยนจาก "force fill 100% ของพื้นที่ที่เหลือ" เป็น "sizing ตาม content จริง แล้ว anchor ไว้บนสุด" — พื้นที่ที่เหลือ (ถ้ามี) จะเป็นพื้นที่ว่างสีครีมด้านล่างปุ่ม ไม่ดึงรูปให้ยืดเต็มจอ (ซึ่งจะทำให้สูงเท่าของเดิมอีก)
- Loading skeleton ปรับ `h-[24dvh]` ให้ตรงกับการ์ดจริง

**บทเรียน:** "shorter by half" + "ต้อง fit ไม่ scroll" คือโจทย์เดียวกัน ไม่ใช่ 2 เรื่อง — ตัวเลขที่แน่นอน (`dvh`-based fixed height + fixed-height container) เชื่อถือได้กว่าการเดา `aspect-[w/h]` ซ้ำไปซ้ำมา เพราะ aspect-ratio ขึ้นกับความกว้าง ซึ่งพึ่งพา layout context ที่ซับซ้อนกว่า

**Verify:** `npx tsc --noEmit` ผ่านสะอาด — ไม่มี browser tool ในเซสชันนี้ ยังไม่ได้ตรวจสอบ UI จริงในเบราว์เซอร์ ควรลองเปิด `/app/swipe` บนมือถือจริง (หรือ DevTools mobile emulation) เพื่อยืนยันว่าไม่ scroll แล้ว

**แก้ไขเพิ่ม (กลับด้าน):** user ส่ง screenshot เดิม (กรอบรูปสูง ~428px) มาอีกครั้ง บอกว่าจริงๆ ชอบสัดส่วนแบบนั้น (ดูสวยกว่า) แค่ไม่ต้องการให้ scroll — ไม่ได้ต้องการให้กรอบรูป "สั้นลงครึ่งหนึ่ง" จริงๆ ตามที่เข้าใจไปก่อนหน้า

**แก้ตาม:** เปลี่ยน photo จาก fixed `h-[24dvh]` กลับไปเป็น `min-h-0 flex-1` (เติมพื้นที่ที่เหลือทั้งหมดหลังหัก info strip) และการ์ด (`PetCard.tsx`) กลับไปใช้ `h-full` เพื่อรับความสูงจาก parent — ทำให้รูปใหญ่/สูงเท่าที่มีพื้นที่เหลือจริง (ตรงกับ screenshot ที่ user ชอบ) **โดยไม่ scroll เพราะ root container ยังคง fixed `h-[calc(100dvh-5rem)] overflow-hidden` ไว้เหมือนเดิม** — ส่วนนี้คือตัวที่การันตีไม่ scroll จริงๆ ไม่ใช่การจำกัดขนาดรูป ปรับ loading skeleton ให้ flex-fill ตรงกันด้วย

**บทเรียนที่แท้จริง:** "ห้าม scroll" ≠ "ต้องลดขนาดรูป" — แก้ที่ root container ให้ fixed height + overflow-hidden ก็พอแล้ว ส่วนรูปให้ flex-1 เติมพื้นที่ที่เหลือได้เต็มที่ตามต้องการ (สวยกว่าและไม่ scroll พร้อมกันได้)

---

## Session 12 — 2026-06-16 (Phase 6 Trust Layer — ปรับ UI/Layout ให้ตรงกับ Wireframe)

### Refactor: ปรับ UI ของ reviews/reports/blocks/badge ให้ตรงกับ `pawmate_wireframe/Trust Overlays Wireframe.dc.html`

**ที่มา:** Phase 6 (Session 7) ทำงานได้ครบฟังก์ชันแล้ว แต่ UI ถูกสร้างก่อนมี wireframe มาเป็น spec — user ขอให้แก้ไข **และเพิ่ม** UI ให้ตรงกับ wireframe (7 frame: pet detail sheet+rating, review modal ใหม่/แก้ไข, report sheet, toast, block dialog, badge reference) ใช้ plan mode เต็มรูปแบบ: อ่าน wireframe เอง + Explore agent ไล่โค้ดปัจจุบัน + Plan agent ออกแบบ implementation + AskUserQuestion ล็อกขอบเขต 2 จุด (ไม่เพิ่ม mode badge บนการ์ด swipe / ทำฟีเจอร์ลบรีวิวเพิ่ม) ก่อนเขียนโค้ดจริง

**สีใหม่:** เพิ่ม `rose: "#E0445A"` ใน `tailwind.config.ts` — ใช้เฉพาะ action ทำลาย/เร่งด่วนของ trust layer (บล็อก, ลบรีวิว) ไม่ใช้ปนกับ coral ที่เป็นสี primary action ทั่วแอป

**Migration ใหม่:** `011_reviews_delete.sql` — เพิ่ม RLS policy `reviews_delete` (`FOR DELETE USING (owns_pet(reviewer_pet_id))`) ตาม pattern เดียวกับ `blocks_delete` ที่มีอยู่แล้ว — ของเดิมไม่มีทางลบรีวิวได้เลย (ไม่มีทั้ง UI และ policy)

**ไฟล์ที่แก้:**
- `components/trust/RatingSummary.tsx` — ปรับโครงจากแนวตั้ง (header + comment ซ้อนล่าง) เป็นการ์ด 2 คอลัมน์ (เลขเฉลี่ย+ดาว+จำนวนซ้าย, เส้นแบ่ง, รีวิวล่าสุด 3 รายการขวา) ตาม Frame ①, แก้สีดาวที่ไม่ filled, ย่อ `timeAgo()` ให้สั้นลง (เพิ่ม tier "สัปดาห์" ที่ไม่มีมาก่อน)
- `components/trust/ReviewModal.tsx` — เพิ่ม prop `petName` (subtitle ใต้หัวข้อ), label ใต้ดาวที่เปลี่ยนตามคะแนน, tag chip เปลี่ยนจาก coral → teal + ไอคอน check + label, label เหนือ textarea, เปลี่ยนข้อความปุ่ม, **เพิ่มฟีเจอร์ลบรีวิวใหม่ทั้งหมด** (ปุ่ม "ลบรีวิวนี้" สี rose + confirm dialog + เรียก migration policy ใหม่)
- `components/trust/ReportSheet.tsx` — หัวข้อ "รายงานโปรไฟล์" → "รายงานน้องนี้", เปลี่ยนรายการเหตุผลจากปุ่มแยกมีกรอบ+check เป็น radio list ในกล่องเดียว (ตรงตาม wireframe), เพิ่ม label เหนือ textarea
- `components/trust/BlockConfirm.tsx` — เพิ่มไอคอน `Ban` วงกลมสี rose, เปลี่ยนหัวข้อ/คำอธิบาย, **ปุ่มยืนยันเปลี่ยนจาก `bg-coral` → `bg-rose`** (จุดสำคัญ — บล็อกเป็น action ทำลาย ไม่ควรใช้สีเดียวกับ "ถูกใจ")
- `components/trust/Toast.tsx` — ปรับ prop จาก `message: string` เดี่ยวเป็น `title`+`subtitle?`+`icon?`, ย้ายจาก pill กลมเต็มจอกึ่งกลางเป็นกล่องขอบซ้ายขวาเว้น 16px ตาม wireframe, default duration 2500→4000ms — แก้ทั้ง 2 จุดเรียกใช้ในหน้าแชทพร้อมกัน (ไม่ทำ backward-compat alias เพราะมีแค่ 2 จุด)
- `components/swipe/PetCard.tsx` — แก้สี badge "ทำหมันแล้ว" บนหน้าการ์ด (compact, ก่อนเปิด detail sheet) จาก teal ผิดๆ (ซ้ำกับ "ฉีดวัคซีนแล้ว") เป็นสีเทากลางตาม Frame ⑦; **จัดลำดับใหม่ใน detail sheet** — ย้าย `RatingSummary` ขึ้นมาอยู่ใต้ชื่อ/ที่อยู่ทันที ตามด้วย badge วัคซีน/ทำหมัน แล้วตามด้วยปุ่มรายงาน/บล็อกแบบ chip ใหม่ (เดิมอยู่ท้ายสุดเป็นปุ่มข้อความเปล่า) ก่อน personality tags/bio/breeding info ที่ขยับลง; เพิ่ม toast หลังส่งรายงานสำเร็จจาก detail sheet นี้ด้วย (เดิมไม่มี toast เลย)
- `app/app/chat/[matchId]/page.tsx` — เปลี่ยน `toast` state เป็น object shape ใหม่, toast รายงานสำเร็จใช้ข้อความ+ไอคอนตาม wireframe เป๊ะ (Frame ⑤), toast รีวิวสำเร็จเก็บง่ายแบบเดิม (wireframe ไม่ระบุ frame สำหรับเคสนี้), ส่ง `petName={otherPet.name}` ให้ `ReviewModal`

**ขอบเขตที่ตัดออกตามที่ user ยืนยัน:**
- ไม่เพิ่ม mode badge (หาเพื่อนเล่น/หาคู่ผสมพันธุ์) บนการ์ด swipe ถึง Frame ⑦ จะมีไว้เป็น reference ก็ตาม เพราะซ้ำซ้อนกับ toggle ด้านบนที่มีอยู่แล้ว

**สิ่งที่พบระหว่างตรวจสอบ (ก่อนเขียนโค้ดจริง):** badge "ทำหมันแล้ว" มี 2 ตำแหน่งใน `PetCard.tsx` — บนหน้าการ์ด (ผิดจริง ใช้ teal) กับใน detail sheet เดิม (ถูกอยู่แล้ว ใช้สีเทา `border-black/15`) ถ้าไม่เช็คโค้ดจริงก่อนอาจจะไปแก้จุดที่ถูกอยู่แล้วซ้ำโดยไม่จำเป็น

**Verify:** `npx tsc --noEmit` ผ่านสะอาด 0 error — ไม่มี browser tool ในเซสชันนี้ ยังไม่ได้ตรวจสอบ UI จริงในเบราว์เซอร์ ควรคลิกทดสอบทั้ง 6 frame ที่แก้ (ดู checklist เต็มในแผนที่บันทึกไว้ที่ `C:\Users\ThanatTamKongchasing\.claude\plans\typed-juggling-yao.md`)

---

### แก้ไขเพิ่ม: "ดูข้อมูลเพิ่ม" (detail sheet) เลื่อนดูไม่ได้

**อาการ:** user ส่ง screenshot มาว่าเนื้อหาใน detail sheet ของการ์ด swipe (เปิดจาก "ดูข้อมูลเพิ่ม") ถูกตัดที่ขอบจอ เลื่อนดูต่อไม่ได้ — เกิดขึ้นหลังจาก reorder เนื้อหาใน Session 12 (เพิ่ม rating card + badge + ปุ่มรายงาน/บล็อก เข้ามาก่อน tags/bio ทำให้เนื้อหายาวขึ้นกว่าเดิมมาก)

**ตรวจสอบ:** ตัว sheet มี `max-h-[85vh] overflow-y-auto` อยู่แล้ว (ไม่เคยถูกแก้ใน Session 12) โครงสร้าง JSX ก็ไม่มีจุดผิด — แต่เจอจุดที่น่าสงสัยจริง: sheet ใส่ inline style `transform: translateY(${dragY}px)` ไว้ตลอดเวลา แม้ตอน `dragY` เป็น 0 (ไม่ได้ลากอยู่) ก็ยังเป็น `translateY(0px)` ซึ่งเป็นปัญหาที่รู้จักกันดีบนมือถือ (เฉพาะ mobile WebKit บางเวอร์ชัน) — element ที่มีทั้ง `overflow-y: auto` และ `transform` (แม้ค่า 0) อยู่บนตัวเดียวกัน อาจทำให้ touch scroll ขัดข้อง/ไม่ลื่น

**วิธีแก้ (รอบ 1 — ไม่ใช่สาเหตุจริง แต่เก็บไว้เป็น robustness):** ใส่ `transform` แค่ตอนกำลังลาก sheet จริงๆ (`dragY > 0`) เท่านั้น ตอนปกติไม่ใส่ transform เลย (เพิ่ม `WebkitOverflowScrolling: "touch"` แทนเพื่อความลื่นบน iOS เก่า) — `components/swipe/PetCard.tsx`

**สาเหตุจริง (รอบ 2 — user ส่ง screenshot ชี้จุดเป๊ะๆ มาอีกรอบ):** ไม่ใช่ scroll ขัดข้อง แต่เป็น **z-index ชนกับ `BottomNav`** — detail sheet ของ `PetCard.tsx` ใช้ `z-50` เท่ากับ `BottomNav` (`components/BottomNav.tsx` ก็ `z-50`) เมื่อ z-index เท่ากัน DOM ที่ render หลังจะวาดทับ DOM ที่ render ก่อนในเลเยอร์เดียวกัน — `BottomNav` render หลัง `{children}` ใน `app/app/layout.tsx` เสมอ จึงวาดทับ detail sheet ส่วนล่างสุด (ข้อความ bio) ไว้ ทำให้ดูเหมือน "ตัดขอบ เลื่อนไม่ได้" ทั้งที่ scroll ทำงานปกติ — แค่มองไม่เห็นเพราะถูกบังอยู่

**ตรวจเจออีกจุดที่บัคเดียวกัน:** `components/swipe/MatchPopup.tsx` ก็ใช้ `z-50` เหมือนกัน ทั้งที่ `CLAUDE.md` ระบุไว้ชัดว่า "match popup ใช้ z-[70]" — โค้ดไม่ตรงกับเอกสารที่เขียนไว้เอง (latent bug ที่ยังไม่มีคนเจอ เพราะการ์ด popup อยู่กึ่งกลางจอ ไม่ค่อยชนขอบล่าง แต่จอเตี้ยๆ อาจชนปุ่ม "ทักเลย"/"ปัดต่อ" ได้)

**วิธีแก้จริง:**
- `components/swipe/PetCard.tsx` — detail sheet `z-50` → `z-[60]` (ตรงตาม convention "bottom sheets/modals เหนือ swipe deck ใช้ z-[60]" ใน `CLAUDE.md`)
- `components/swipe/MatchPopup.tsx` — `z-50` → `z-[70]` (ตรงตามที่ `CLAUDE.md` ระบุไว้แต่โค้ดไม่ตรงมาตั้งแต่แรก)

**Verify:** `npx tsc --noEmit` ผ่านสะอาด — ยังไม่มี browser tool ในเซสชันนี้ ไม่ได้ทดสอบบนมือถือจริง รบกวนลองเปิด detail sheet เลื่อนลงสุดดูว่าเห็น bio/breeding info ครบไม่ถูก nav บังแล้ว และลองให้เกิด match จริงดูว่าปุ่ม "ทักเลย"/"ปัดต่อ" ไม่ถูกบังด้วย

---

## Session 14 — 2026-06-17 (Phase 7 Recheck + Fixes)

### Phase 7 audit และสิ่งที่แก้ไข

**ที่มา:** Session 13 ถูก context limit ตัดก่อนจบ ทำให้ไม่ได้เขียน log และบาง feature ขาดหาย ขอให้ตรวจสอบ Phase 7 ว่าครบ 100% หรือไม่

**สิ่งที่ตรวจพบและแก้ไข:**

1. **BottomNav ยังเป็น 4 tabs — ไม่มี ดูแล tab** (`components/BottomNav.tsx`)
   - เพิ่ม `HeartPulse` icon import จาก lucide-react
   - เพิ่ม tab `{ href: "/app/care", label: "ดูแล", icon: HeartPulse }` ระหว่าง แมตช์ และ โปรไฟล์
   - ลบ logic พิเศษที่ให้ หน้าแรก highlight เมื่ออยู่ใน `/app/care/*` (ตอนนี้ ดูแล tab ทำหน้าที่นั้นแทน)
   - BottomNav ตอนนี้มี 5 tabs ตาม CLAUDE-EXPANSION.md spec

2. **HospitalMap ไม่ re-center เมื่อ geolocation resolve** (`components/care/HospitalMap.tsx`)
   - `MapContainer`'s `center` prop เป็น init-time only ใน react-leaflet v4
   - เพิ่ม component `RecenterMap` ที่ใช้ `useMap()` hook แบบ imperative เรียก `map.setView(center)` เมื่อ `center` prop เปลี่ยน
   - เพิ่ม `<RecenterMap center={center} />` ไว้ภายใน `MapContainer`

3. **CLAUDE.md อัปเดต** — แก้คำอธิบาย BottomNav ให้ตรงกับ 5-tab จริง

**สิ่งที่ตรวจแล้วปกติ:**
- TypeScript `distanceKm` sort — `npx tsc --noEmit` ผ่านสะอาด ไม่มี error
- ไฟล์ Phase 7 ทุกตัวมีครบ (HospitalCard, HospitalDetailSheet, HospitalMap, geo.ts, 012_hospitals.sql, seed-hospitals.ts)
- ConditionalAppHeader ซ่อน header บน `/app/care/*` ถูกต้อง
- HospitalDetailSheet `bottom-[60px]` ทำให้ nav ยังมองเห็นได้ขณะ sheet เปิด

**ยังค้างทำ (ต้องทำเอง):**
- รัน `012_hospitals.sql` ใน Supabase SQL Editor
- รัน `seed-hospitals.ts` หลังจาก migration ผ่าน

---

## Session 15 — 2026-06-17 (Phase 8: Lost Pet Board + Swipe Mode Toggle Fix)

### 1. Phase 8 — ประกาศสัตว์หาย (Lost Pet Board)

#### Migration ใหม่ — `013_lost_pets.sql`

2 ตาราง + RLS:

| ตาราง | คอลัมน์สำคัญ | RLS |
|---|---|---|
| `lost_pets` | reporter_id, pet_name, species, breed, photos[], last_seen_province, last_seen_district, lost_date, distinguishing_marks, contact, reward, status ('lost'\|'found') | **SELECT USING(true) ไม่มี TO authenticated** — anon role ต้องเห็นได้สำหรับ `/lost/[id]` public page |
| `lost_pet_sightings` | lost_pet_id FK, reporter_id FK, detail, seen_at_location | SELECT เหมือน lost_pets (anon), INSERT = authenticated + reporter_id = auth.uid() ไม่มี UPDATE/DELETE (immutable community tips) |

> ⚠️ ยังไม่ได้รันใน Supabase จริง ดูหัวข้อ "ค้างทำ" ด้านบน

#### ไฟล์ที่สร้างใหม่

**`components/lost/LostPetCard.tsx`**
- Feed card สำหรับ `/app/care/lost` — photo (`h-[152px]` object-cover) + status badge top-right + info strip ด้านล่าง
- Status badge: `bg-[#A82040]` ยังตามหา / `bg-teal` พบแล้ว; found cards ได้ `opacity-[0.78]`
- Days lost: `Math.floor((Date.now() - new Date(date + "T00:00:00").getTime()) / 86_400_000)` — ใช้ `"T00:00:00"` suffix เพื่อไม่ให้ timezone offset ทำให้ today = -1

**`components/lost/SightingModal.tsx`**
- Bottom sheet `z-[70]` สำหรับแจ้งเบาะแส, props: `{ lostPetId, petName, onClose, onSubmitted }`
- 2 fields: seen_at_location (required) + detail textarea (required)
- Insert ลง `lost_pet_sightings` แล้วเรียก `onSubmitted` + `onClose`

**`app/app/care/lost/page.tsx`** — Feed (ไม่ต้องใช้ active pet — community feed)
- Header: back → `/app/care` (pattern เดียวกับ hospitals page)
- Fetch: `lost_pets` order by `created_at DESC`
- 3 filter pills (client-side): province (MapPin icon), species, status
- Single-column list + loading skeleton (3 animated cards)
- FAB extended pill: `fixed right-4 bottom-[76px] z-[60]` — coral pill กว้าง (Plus icon + "แจ้งสัตว์หาย") link → `/app/care/lost/new`

**`app/app/care/lost/new/page.tsx`** — Create Form
- Photo upload: Supabase Storage `pet-photos` bucket, path `{userId}/{timestamp}-{random}.{ext}`, สูงสุด 4 รูป
- Fields: photos*, ชื่อน้อง*, ชนิด* (3 chip), สายพันธุ์ (optional), อำเภอ* + จังหวัด*, วันที่หาย*, รายละเอียด (optional), เบอร์ติดต่อ*
- Submit: `INSERT` ลง `lost_pets`
- In-page success screen (แทน redirect): teal check ring + ชื่อน้อง + preview card + coral "ดูประกาศของฉัน" + gray "กลับหน้าประกาศ" + amber share nudge (Web Share API / clipboard fallback)

**`app/app/care/lost/[id]/page.tsx`** — Protected Detail
- Parallel fetch: `lost_pets` + `lost_pet_sightings(profiles(display_name))` + `auth.getUser()`
- Photo carousel: `translateX(-${idx*100}%)` บน flex container ไม่ใช้ library
- Status badge top-LEFT: `bg-[#E0445A]` lost / `bg-teal` found
- Facts card: แถวข้อมูล MapPin/Calendar/Clock/Eye/DollarSign แยก border-b
- Owner row: "คุณเอง" badge (เจ้าของ) หรือ ปุ่ม "ติดต่อ" copy-to-clipboard (คนอื่น)
- Action buttons: non-owner+lost → แจ้งเบาะแส (bg-[#E8724A]) + แชร์; owner+lost → แชร์ + แก้ไข
- Celebration banner เมื่อ found: `bg-[#EDF7F6]` ระหว่างรูปกับเนื้อหา
- Sightings timeline: vertical connector + avatar + display_name + timeAgo + location chip
- Owner-only footer: teal outline "ทำเครื่องหมายว่าพบแล้ว" → center confirm dialog `z-[70]`
- Share: `window.location.origin + "/lost/" + id` ผ่าน Web Share API / clipboard
- Toast integration ผ่าน `components/trust/Toast.tsx`
- TS gotcha: Supabase FK join (`profiles(display_name)`) return type เป็น array → ต้อง cast `as unknown as Sighting[]`

**`app/lost/[id]/page.tsx`** — Public Share Page (Server Component)
- `generateMetadata` export: OG title/description/image สำหรับ LINE/Facebook preview
- Sticky amber login banner top: `"เข้าสู่ระบบเพื่อแจ้งเบาะแส"` link → `/login?redirect=/lost/${id}`
- Photo เดียว (ไม่มี carousel), facts card, sightings timeline read-only
- ไม่มี BottomNav/AppHeader (อยู่ใน root layout เท่านั้น)
- `notFound()` ถ้าไม่มี post

#### ไฟล์ที่แก้ไข

| ไฟล์ | สิ่งที่แก้ |
|---|---|
| `app/app/care/page.tsx` | ประกาศสัตว์หาย: `href:"#"` → `/app/care/lost`, `comingSoon:true` → `false` |
| `app/app/home/page.tsx` | CARE_MENU: แก้ href + comingSoon; ลบ MAIN_MENU tile "แดชบอร์ด" + `LayoutDashboard` import |
| `components/AuthForm.tsx` | เพิ่ม `useSearchParams()` อ่าน `?redirect=` param → redirect หลัง login แทน hardcode `/app/swipe` |
| `app/login/page.tsx` | wrap `<AuthForm>` ใน `<Suspense>` (required สำหรับ `useSearchParams` ใน Next.js 14 server page) |
| `CLAUDE.md` | เพิ่ม 4 routes, migration 013, "next migration → 014", Phase 8 ว่า built |
| `LINK_PATH.md` | สร้างใหม่ — รายการ route ทั้งหมด 14 เส้นทาง แบ่ง Public/Onboarding/App |

#### GitHub Push (3 commits)

```
feat: Phase 8 lost pet board — feed, create form, detail, public share page
fix: mode toggle always visible (disabled styles for unavailable modes)
chore: update CLAUDE.md, DEVLOG.md, CLAUDE-EXPANSION.md for Phase 8
```

---

### 2. Fix: Swipe Mode Toggle หายเมื่อ Pet มีแค่ 1 Mode

**ปัญหา:** condition `availableModes.length > 1` ใน `app/app/swipe/page.tsx` ซ่อน segmented control ทั้งก้อน → user เห็นแค่ว่างเปล่า ไม่รู้ว่าสลับ mode ได้

**วิธีแก้:**
- ลบเงื่อนไข `length > 1` ออก — render toggle เสมอ 2 ปุ่ม
- ปุ่มที่ไม่ available: `disabled` + `cursor-not-allowed text-brown-muted/30` + `title="เปิดโหมดนี้ได้ที่หน้าโปรไฟล์"`
- `onClick` ป้องกันด้วย `availableModes.includes(mode) && setMode(mode)`

---

## Session 16 — 2026-06-17 (Bug Fix: Home Greeting + Favicon)

### 1. Fix: Greeting บน `/app/home` ไม่เปลี่ยนตาม Active Pet

**ปัญหา:** greeting "สวัสดี, {ownerName}" ใช้ `profile.display_name` ซึ่งเป็นชื่อ account ของ user (static ไม่เปลี่ยน) → เมื่อสลับ pet ที่ Profile page แล้วกลับมา home page ชื่อในการทักทายยังคงเดิม แม้ pet card ด้านล่างจะอัปเดตแล้ว

**วิธีแก้ (`app/app/home/page.tsx`):**
- ลบ state `ownerName` + query `profile.display_name` ออกทั้งหมด (ไม่ได้ใช้ที่อื่นในไฟล์)
- เปลี่ยน greeting JSX จาก `สวัสดี, {ownerName}` → `สวัสดี, {activePet?.name}`
- `activePet` compute จาก `pets.find(p => p.id === activePetId)` ซึ่งอัปเดตทันทีที่ `handleSwitchPet` เรียกหรือตอน mount อ่าน localStorage ค่าใหม่
- ผล: สลับไปน้อง "เทาบิ๊ก" → greeting แสดง "สวัสดี, เทาบิ๊ก"; สลับไปน้อง "ถุงเงิน" → "สวัสดี, ถุงเงิน"
- Bonus: ลด 1 DB query ต่อ page load (ไม่ต้อง fetch profiles อีกต่อไป)

### 2. Feat: SVG Favicon

**ไฟล์ใหม่:** `app/icon.svg`

```svg
<!-- Coral rounded-square background (#FF6B5B) + white paw print -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#FF6B5B"/>
  <ellipse cx="50" cy="70" rx="17" ry="14" fill="white"/>  <!-- main pad -->
  <ellipse cx="23" cy="54" rx="8" ry="9" fill="white"/>
  <ellipse cx="38" cy="42" rx="8.5" ry="9.5" fill="white"/>
  <ellipse cx="62" cy="42" rx="8.5" ry="9.5" fill="white"/>
  <ellipse cx="77" cy="54" rx="8" ry="9" fill="white"/>
</svg>
```

Next.js 14 App Router auto-injects `<link rel="icon" type="image/svg+xml" href="/icon.svg">` เมื่อพบไฟล์ `app/icon.svg` — ไม่ต้องแก้ `layout.tsx`

รองรับ: Chrome, Firefox, Safari 14+, Edge (ไม่รองรับ IE แต่ไม่จำเป็นแล้ว)

### Git & Push

```
fix: home page greeting now shows active pet name instead of static owner display_name
feat: add SVG favicon (paw print on coral background)
```

Push ไป `main` — Vercel auto-deploy ทั้ง 2 commits

---

## Session 17 — 2026-06-17 (Phase 9: Blood Donation Center)

### Phase 9 — ศูนย์บริจาคเลือดสัตว์ (Blood Donation Center)

เริ่มต้น Session นี้ด้วยการ verify Phase 6/7/8 (migration 011/012/013 รันครบ + seed hospitals สำเร็จ) แล้วลุยต่อ Phase 9

#### Migration ใหม่ — `014_blood.sql`

3 ตาราง + RLS:

| ตาราง | คอลัมน์สำคัญ | RLS |
|---|---|---|
| `blood_donors` | pet_id (UNIQUE FK), blood_type, weight_kg, eligible (bool), available (bool), last_donation_date | SELECT = ทุก authenticated, INSERT/UPDATE/DELETE = owns_pet(pet_id) |
| `blood_requests` | requester_id FK, species ('dog'/'cat'), blood_type_needed, urgency ('urgent'/'normal'), hospital_name, province, details, contact, status ('open'/'fulfilled') | SELECT = ทุก authenticated, INSERT/UPDATE = requester_id = auth.uid() |
| `blood_responses` | request_id FK, donor_pet_id FK · UNIQUE(request_id, donor_pet_id) | **SELECT เฉพาะ donor owner หรือ request owner** (contact info ต้องไม่เปิดเผยต่อสาธารณะ), INSERT = owns_pet(donor_pet_id) |

> ⚠️ ยังไม่ได้รันใน Supabase จริง — ดูหัวข้อ "ค้างทำ" ด้านบน

#### Library helper ใหม่ — `lib/blood-matching.ts`

Pure functions สำหรับ matching logic (ไม่มี Supabase dependency):

| Function | หน้าที่ |
|---|---|
| `matchDonors(donors, province, bloodTypeNeeded)` | filter eligible+available → แยก exact/crossmatch → sort same-province first |
| `evaluateEligibility(species, weightKg, birthMonth, vaccinated, indoorOnly)` | ประเมิน criteria array → `{ criteria[{label, pass}], allPass }` |
| `monthsSinceLastDonation(lastDate)` | คำนวณเดือนนับจากบริจาคล่าสุด (null = ไม่เคย), ≥3 เดือน = available |

เกณฑ์ eligibility:
- สุนัข: น้ำหนัก ≥20 กก. + อายุ 1-7 ปี + vaccinated = true
- แมว: น้ำหนัก ≥4 กก. + อายุ 1-7 ปี + vaccinated = true + indoor-only

#### ไฟล์ที่สร้างใหม่

**`app/app/care/blood/page.tsx`** — Main Page
- Header: back → `/app/care`
- Disclaimer: "PawMate เป็นสื่อกลางช่วยหาผู้บริจาคเท่านั้น การบริจาคจริงต้องผ่านการตรวจและดูแลโดยสัตวแพทย์"
- **Tab ประกาศขอรับบริจาค**: feed + province/species filters; request cards (species icon + blood type ใหญ่ + urgency badge + hospital + timeAgo); FAB pill "ขอรับบริจาค"
- **Tab เป็นผู้บริจาค**: active pet resolver (localStorage pattern) → donor form (blood type, weight, indoor-only checkbox สำหรับแมว, last donation date) + live eligibility checklist (`evaluateEligibility()`) + status card ถ้า registered แล้ว + toggle available
- Overlay request form (ไม่ใช่ route แยก เป็น state ใน page เดียวกัน): species, blood type, urgency, hospital, province, details, contact → INSERT blood_requests

**`app/app/care/blood/[id]/page.tsx`** — Request Detail Page
- Full request info (species, blood type, urgency, hospital, province, details) + ปุ่มโทร `tel:`
- **Non-owner + open**: matching donors via `matchDonors()` แบ่ง 2 กลุ่ม (กรุ๊ปตรง / ต้องตรวจ crossmatch); donor card มีปุ่ม "แจ้งความสนใจ" + textarea → INSERT blood_responses (UNIQUE constraint ป้องกันซ้ำ)
- **Owner**: list blood_responses (RLS เปิดให้เห็นเฉพาะเจ้าของ request) + ปุ่ม "ทำเครื่องหมายว่าหาได้แล้ว" → UPDATE status='fulfilled'

#### ไฟล์ที่แก้ไข

| ไฟล์ | สิ่งที่แก้ |
|---|---|
| `app/app/care/page.tsx` | ศูนย์บริจาคเลือด: `href:"#"` → `/app/care/blood`, `comingSoon:true` → `false` |
| `app/app/home/page.tsx` | CARE_MENU: ศูนย์บริจาคเลือด `href` + `comingSoon` เหมือนกัน |

#### Git & Push

```
feat: Phase 9 — ศูนย์บริจาคเลือดสัตว์ (Blood Donation Center)
# commit: 0cccc50
# 6 files changed, 1399 insertions(+), 3 deletions(-)
```

Push ไป `main` — Vercel auto-deploy

---

## Ideas สำหรับ Phase ถัดไป (ถ้ามี)

- **Swipe gestures** — drag card ซ้าย/ขวาด้วย framer-motion
- **Push notifications** — แจ้งเตือนเมื่อได้แมตช์ใหม่ (Supabase Edge Functions + Web Push)
- **Photo moderation** — ตรวจรูปก่อนแสดงผล (Supabase Edge Functions)
- **Location-based filter** — คำนวณระยะทางจริงจาก province/district
- **Report/block** — ระบบรายงานโปรไฟล์ที่ไม่เหมาะสม
- **Line notify integration** — ส่ง message ผ่าน LINE เมื่อมีแมตช์
