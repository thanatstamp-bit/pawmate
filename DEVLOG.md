# PawMate — Developer Log & Handoff Notes

> บันทึกสิ่งที่ทำไปใน MVP session (Phase 0–5) เพื่อ reference สำหรับ Phase ถัดไป
> อัปเดตล่าสุด: 2026-06-11

---

## สถานะปัจจุบัน

✅ Phase 0 — Project Setup & Database  
✅ Phase 1 — Auth + Demo Account  
✅ Phase 2 — Onboarding (Create Pet Profile)  
✅ Phase 3 — Swipe Page + Match Logic  
✅ Phase 4 — Matches List + Realtime Chat  
✅ Phase 5 — Landing Page, Profile Page & Seed Data  
⏳ Deploy ไป Vercel — ยังไม่ได้ทำ

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
| Deploy | Vercel (ยังไม่ได้ deploy) |

### Design System (Tailwind custom values)
```
cream:       #FFF8F0  (background)
coral:       #FF6B5B  (primary, like button)
teal:        #2EC4B6  (playdate mode)
amber:       #FFB84C  (breeding mode)
brown:       #2D2A26  (text)
brown-muted: #8A8580  (muted text)
teal-dark:   #1a9e96
amber-dark:  #cc8f00
rounded-card: 20px
shadow-card:  0 4px 16px rgba(0,0,0,0.06)
```

### Fonts
- Nunito (Latin) + IBM Plex Sans Thai — โหลดผ่าน `next/font/google`
- CSS vars: `--font-nunito`, `--font-ibm-plex-thai`
- ตั้งใน `app/layout.tsx`, inject ผ่าน `<html className>`

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
```

### Migration Files
- `supabase/migrations/001_init.sql` — สร้างทุก table + RLS policies + helper functions
- `supabase/migrations/002_storage_policies.sql` — Storage policies สำหรับ pet-photos bucket

### RLS Rules
- ทุก table เปิด RLS
- `profiles`, `pets`: SELECT ได้ทุกคน, INSERT/UPDATE เฉพาะเจ้าของ
- `likes`: INSERT เฉพาะเจ้าของสัตว์ตัว from_pet_id
- `matches`: SELECT เฉพาะคู่ที่ user เป็นเจ้าของ pet_a หรือ pet_b
- `messages`: SELECT/INSERT เฉพาะคนที่อยู่ใน match

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
  layout.tsx                    — Root layout, fonts, cream background
  page.tsx                      — Landing page (public)
  login/
    page.tsx                    — Login/signup form
    actions.ts                  — Server actions: login, signup, demoLogin
  onboarding/
    page.tsx                    — 4-step wizard
  app/
    layout.tsx                  — App shell + BottomNav
    swipe/page.tsx              — Swipe cards + match logic
    matches/page.tsx            — Matches list
    chat/[matchId]/page.tsx     — Realtime chat
    profile/page.tsx            — Profile view + edit + logout + delete

components/
  AuthForm.tsx                  — Login/signup tabs + Demo button
  BottomNav.tsx                 — Bottom navigation (3 tabs)
  LogoutButton.tsx              — Logout button (client component)
  onboarding/
    Step1Photos.tsx             — Photo upload (Supabase Storage)
    Step2Basic.tsx              — Species, breed, sex, birth month
    Step3Personality.tsx        — Tags, province, district, bio
    Step4Modes.tsx              — Playdate/breeding toggles + vaccinated/neutered
  swipe/
    PetCard.tsx                 — Card UI + detail bottom sheet
    MatchPopup.tsx              — Match popup with animation
    FilterSheet.tsx             — Province filter bottom sheet

lib/
  supabase/
    client.ts                   — createBrowserClient (client components)
    server.ts                   — createServerClient (server components/actions)
    middleware.ts               — updateSession
  match.ts                      — checkAndCreateMatch() helper
  data/
    breeds.ts                   — DOG_BREEDS, CAT_BREEDS arrays
    provinces.ts                — Thai provinces array (77 จังหวัด)
    tags.ts                     — Personality tags array

middleware.ts                   — Route protection: redirect /app/* → /login if unauth

scripts/
  seed.ts                       — Seed script (45 pets + breeding-compatible + pre-likes)
  tsconfig.json                 — Separate tsconfig for scripts (commonjs)

supabase/
  migrations/
    001_init.sql
    002_storage_policies.sql

tsconfig.json                   — "scripts" อยู่ใน exclude เพื่อไม่ให้ Next.js compile seed
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
3. ตรวจว่ามี pet ไหม → ถ้ามีไป `/app/swipe`, ถ้าไม่มีไป `/onboarding`

### Route Protection (`middleware.ts`)
- `/app/*` และ `/onboarding` → redirect ไป `/login` ถ้าไม่มี session
- `/login` → redirect ไป `/app/swipe` ถ้ามี session อยู่แล้ว

---

## Seed Script

### รัน
```bash
cd C:\dev\pawmate
npx ts-node --project scripts/tsconfig.json scripts/seed.ts
```

### ทำอะไร
1. หา demo account ใน Supabase Auth
2. สร้าง seed user ใหม่ (email: `seed-bot-{timestamp}@pawmate.internal`)
3. สร้าง 25 dogs + 20 cats (random breed/sex/province)
4. สร้าง 8 pets ที่ตรงสายพันธุ์กับ demo pet โดยเฉพาะ (สำหรับ breeding mode)
5. สร้าง pre-likes ไปที่ demo pet (10 ใน playdate + 8 ใน breeding)
6. รันซ้ำได้ — จะสร้าง seed user ใหม่ทุกครั้ง (ไม่มี duplicate error)

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

---

## สิ่งที่ต้องทำก่อน Deploy

- [ ] เปลี่ยน `DEMO_PASSWORD` เป็น password จริง (ทั้งใน .env.local และ Supabase Auth)
- [ ] ใส่ชื่อจริงและลิงก์ใน footer ของ landing page (`app/page.tsx` ค้นหา `[NAME]`)
- [ ] ตรวจ `.gitignore` ว่ามี `.env.local` อยู่แล้ว
- [ ] สร้าง project ใน Vercel และใส่ env vars ทั้งหมด

### Deploy ไป Vercel
```bash
npm install -g vercel
vercel --prod
```
ใส่ env vars ใน Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DEMO_EMAIL`
- `DEMO_PASSWORD`
> ไม่ต้องใส่ `SUPABASE_SERVICE_ROLE_KEY` บน Vercel (ใช้เฉพาะ seed script local)

---

## Ideas สำหรับ Phase ถัดไป (ถ้ามี)

- **Swipe gestures** — drag card ซ้าย/ขวาด้วย framer-motion
- **Push notifications** — แจ้งเตือนเมื่อได้แมตช์ใหม่ (Supabase Edge Functions + Web Push)
- **Photo moderation** — ตรวจรูปก่อนแสดงผล (Supabase Edge Functions)
- **Location-based filter** — คำนวณระยะทางจริงจาก province/district
- **Multiple pets per account** — ปลดล็อก UI ให้ 1 account มีหลายตัวได้
- **Report/block** — ระบบรายงานโปรไฟล์ที่ไม่เหมาะสม
- **Line notify integration** — ส่ง message ผ่าน LINE เมื่อมีแมตช์
