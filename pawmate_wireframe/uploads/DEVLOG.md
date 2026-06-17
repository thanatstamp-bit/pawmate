# PawMate — Developer Log & Handoff Notes

> บันทึกสิ่งที่ทำไปใน MVP session (Phase 0–5) เพื่อ reference สำหรับ Phase ถัดไป
> อัปเดตล่าสุด: 2026-06-12 (session 4)

---

## สถานะปัจจุบัน

✅ Phase 0 — Project Setup & Database  
✅ Phase 1 — Auth + Demo Account  
✅ Phase 2 — Onboarding (Create Pet Profile)  
✅ Phase 3 — Swipe Page + Match Logic  
✅ Phase 4 — Matches List + Realtime Chat  
✅ Phase 5 — Landing Page, Profile Page & Seed Data  
✅ Deploy ไป Vercel — ผ่านสมบูรณ์ (2026-06-12)

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
| breeding mode มีการ์ดแค่ใบเดียว | seed รันก่อน demo pet มี breeding mode → ไม่ได้สร้าง compatible pets + swipe feed ไม่ exclude likes จาก session เก่า | แก้ `fetchCards` ให้ query `likes` table ก่อนแสดงการ์ด + รัน seed ใหม่ (ดู Session 3) |
| GitHub Push Protection บล็อก push | DEVLOG.md มี `SUPABASE_SERVICE_ROLE_KEY` จริง | แก้ DEVLOG เป็น placeholder แล้ว `git commit --amend --no-edit` (safe เพราะยังไม่ได้ push) |
| Vercel deploy ล้มเหลว | Vercel ไม่ detect Next.js framework อัตโนมัติ → หา output dir `public` แทน `.next` | ไปที่ Vercel → Project Settings → General → Framework Preset → เลือก "Next.js" → Save → Redeploy ✅ |

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

## Ideas สำหรับ Phase ถัดไป (ถ้ามี)

- **Swipe gestures** — drag card ซ้าย/ขวาด้วย framer-motion
- **Push notifications** — แจ้งเตือนเมื่อได้แมตช์ใหม่ (Supabase Edge Functions + Web Push)
- **Photo moderation** — ตรวจรูปก่อนแสดงผล (Supabase Edge Functions)
- **Location-based filter** — คำนวณระยะทางจริงจาก province/district
- **Report/block** — ระบบรายงานโปรไฟล์ที่ไม่เหมาะสม
- **Line notify integration** — ส่ง message ผ่าน LINE เมื่อมีแมตช์
