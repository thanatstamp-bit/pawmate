# 🐾 PawMate — Vibe Coding Kit (MVP)

> วิธีใช้: คัดลอก **Master Context** ไปวางเป็นข้อความแรกเสมอ (หรือบันทึกเป็นไฟล์ `CLAUDE.md` / `.cursorrules` ในโปรเจกต์)
> จากนั้นป้อน **Phase Prompt** ทีละเฟส ตรวจผลงานให้ผ่านก่อนค่อยไปเฟสถัดไป
> Prompt ทั้งหมดเขียนเป็นภาษาอังกฤษเพราะ AI coding tools ตอบสนองแม่นกว่า

---

## 🎯 MASTER CONTEXT (paste this first, always)

```
# PROJECT: PawMate — Pet Matchmaking Web App (Portfolio MVP)

## Overview
PawMate is a "Tinder for pets" web app for dogs and cats in Thailand.
Owners create a profile for their pet, then swipe through other pets in two modes:
1. PLAYDATE mode — find pet friends nearby for meetups
2. BREEDING mode — find a mate of the same breed, opposite sex

This is a portfolio project: it must work end-to-end with real auth, database,
and realtime chat, but does not need payment, moderation, or production-scale security.
Polish and visual quality matter more than feature breadth.

## Tech Stack (do not deviate)
- Next.js 14+ (App Router) + TypeScript
- Tailwind CSS
- Supabase: Auth (email/password), Postgres DB, Storage (pet photos), Realtime (chat)
- Deployed on Vercel
- UI language: Thai (all user-facing text in Thai), code/comments in English

## Design System
- Mood: warm, playful, friendly, trustworthy — like a cozy pet café
- Background: warm cream #FFF8F0
- Primary (buttons, likes, highlights): coral #FF6B5B
- Secondary (accents, success, playdate mode): teal #2EC4B6
- Breeding mode accent: soft amber #FFB84C
- Text: warm dark brown #2D2A26, muted #8A8580
- Cards: white #FFFFFF, border-radius 20px, soft shadow (0 4px 16px rgba(0,0,0,0.06))
- Fonts: "Nunito" for Latin, "IBM Plex Sans Thai" for Thai (load via next/font/google)
- Buttons: fully rounded (pill shape), bold labels
- Mobile-first: design for 390px width first, then scale up. Max content width 480px
  for app pages (centered column on desktop), landing page can be full width.
- Use paw/heart motifs sparingly. No emoji as UI icons — use lucide-react icons.

## Database Schema (Supabase Postgres)
- profiles: id (uuid, = auth.users.id), display_name, line_id (nullable), created_at
- pets: id (uuid), owner_id (fk profiles), name, species ('dog'|'cat'), breed,
  sex ('male'|'female'), birth_month (date), photos (text[] of storage URLs),
  personality_tags (text[]), province, district,
  modes (text[] containing 'playdate' and/or 'breeding'),
  vaccinated (bool, nullable), neutered (bool, nullable), bio (text), created_at
- likes: id, from_pet_id, to_pet_id, mode ('playdate'|'breeding'), created_at
  — unique constraint on (from_pet_id, to_pet_id, mode)
- matches: id, pet_a_id, pet_b_id, mode, created_at
  — created automatically when likes exist in both directions for the same mode
- messages: id, match_id (fk matches), sender_pet_id, content (text), created_at

Rules:
- One account = one pet (enforce in UI, not DB)
- Enable Row Level Security on all tables; users can only modify their own rows,
  but can SELECT any pet profile (needed for the swipe feed)
- BREEDING feed filter: same species, same breed (default), opposite sex only
- PLAYDATE feed filter: same species (default), any sex

## Code Style
- App Router with server components where possible, client components for interactivity
- Keep components small, one file per component, in /components
- Supabase client helpers in /lib/supabase
- All user-facing strings in Thai
- Handle loading and empty states for every data fetch — never show a blank screen
```

---

## 🧱 PHASE 0 — Project Setup & Database

```
Using the Master Context above:

Set up the PawMate project from scratch.

1. Create a Next.js 14 App Router project with TypeScript and Tailwind CSS.
2. Configure the design system: extend tailwind.config with the color palette
   (cream, coral, teal, amber, brown) and set up Nunito + IBM Plex Sans Thai
   via next/font/google.
3. Install and configure the Supabase JS client (@supabase/supabase-js and
   @supabase/ssr) with helper files for client/server usage in /lib/supabase.
   Use environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
4. Write a single SQL migration file (supabase/migrations/001_init.sql) that creates
   all tables from the schema in the Master Context, including RLS policies and
   the unique constraint on likes.
5. Create a basic app shell: bottom navigation bar (mobile) with 4 tabs —
   ปัดการ์ด (swipe), แมตช์ (matches), โปรไฟล์ (profile) — using lucide-react icons.
   The nav only shows on authenticated app pages, not on landing/login.
6. Add a root layout with the cream background and font setup.

Explain what each file does as you create it. Do not build any features yet.
```

✅ **เช็คก่อนไปต่อ:** โปรเจกต์รันได้ (`npm run dev`), เห็น app shell + nav, รัน SQL ใน Supabase dashboard ผ่านไม่มี error

---

## 🔐 PHASE 1 — Auth + Demo Account

```
Using the Master Context above:

Build authentication for PawMate.

1. Create /login page with two tabs: เข้าสู่ระบบ (login) and สมัครสมาชิก (signup),
   using Supabase email/password auth. Thai labels, coral primary button,
   card-style form centered on cream background.
2. On signup success: create a row in `profiles`, then redirect to /onboarding.
3. On login success: if the user has a pet, go to /app/swipe; if not, go to /onboarding.
4. Add a prominent secondary button "🐾 ลองเล่นโหมด Demo" that signs in with a
   fixed demo account (email/password from env vars DEMO_EMAIL / DEMO_PASSWORD)
   and goes straight to /app/swipe. This is the most important button on the page.
5. Protect all /app/* and /onboarding routes with middleware that redirects
   unauthenticated users to /login.
6. Add logout functionality (button placed in the profile page placeholder for now).

Handle error states in Thai (wrong password, email already used, etc.)
```

✅ **เช็คก่อนไปต่อ:** สมัคร/ล็อกอิน/ล็อกเอาต์ได้จริง, เข้า /app โดยไม่ล็อกอินแล้วโดนเด้งไป /login

---

## 🐶 PHASE 2 — Onboarding (Create Pet Profile)

```
Using the Master Context above:

Build the /onboarding flow — a 4-step wizard to create a pet profile.
Show a progress indicator (step 1/4) at the top. Each step is one screen
with a large "ถัดไป" button. Allow going back. Mobile-first.

Step 1 — รูปและชื่อ: upload 1-4 photos to Supabase Storage (bucket: pet-photos,
  public). Show upload previews in a 2x2 grid with the first photo marked as
  รูปหลัก. Then a name input.
Step 2 — ข้อมูลพื้นฐาน: species (หมา/แมว as two big selectable cards),
  breed (searchable select — include ~20 common dog breeds and ~15 cat breeds
  in Thai), sex (ผู้/เมีย), birth month+year picker (display age automatically).
Step 3 — นิสัยและพื้นที่: personality tags as selectable chips (at least 12 options
  e.g. ขี้เล่น ขี้อ้อน ใจดี ขี้กลัว พลังเยอะ ชอบนอน เข้ากับเด็กได้ ดุกับแปลกหน้า),
  province dropdown (all 77 Thai provinces), district text input. Short bio textarea.
Step 4 — โหมดที่เปิดรับ: two toggle cards — หาเพื่อนเล่น (teal) and หาคู่ผสมพันธุ์ (amber).
  At least one required. If breeding is on, show extra fields: ฉีดวัคซีนแล้ว (yes/no),
  ทำหมันแล้ว (yes/no — warn that neutered pets can't use breeding mode).

On submit: insert into `pets`, then redirect to /app/swipe.
Validate every step before allowing ถัดไป. All copy in Thai, friendly tone.
```

✅ **เช็คก่อนไปต่อ:** สร้างโปรไฟล์ครบ 4 ขั้นได้, รูปขึ้น Storage จริง, ข้อมูลลงตาราง pets ถูกต้อง

---

## 💘 PHASE 3 — Swipe Page + Match Logic

```
Using the Master Context above:

Build /app/swipe — the core page of PawMate.

1. Mode toggle at the top: two pills — 🐕 หาเพื่อนเล่น (teal active state) and
   ❤️ หาคู่ (amber active state). Only show modes that the user's pet has enabled.
2. Card stack: fetch pets that (a) match the current mode's filter rules from
   Master Context, (b) the user hasn't liked/skipped yet in this mode, (c) aren't
   the user's own pet. Show one card at a time with the next card peeking behind.
3. Card design: full-bleed main photo, gradient overlay at the bottom with
   name, age, breed, province. Personality tags as small chips. Tap card to
   expand a detail sheet showing all photos, bio, and breeding info (vaccinated/
   neutered) when in breeding mode.
4. Action buttons below the card: big circular ✖️ (skip, white with border) and
   ❤️ (like, coral). Record skips locally (or in a `skips` table) so cards
   don't repeat within the session.
5. On like: insert into `likes`. Then check if the other pet already liked us
   in the same mode — if yes, insert into `matches` and show a full-screen
   match popup: "เป็นเพื่อนกันแล้ว! 🎉" (playdate) or "แมตช์กันแล้ว! 💕" (breeding),
   with both pet photos side by side, a "ทักเลย" button (goes to chat) and
   "ปัดต่อ" button. Add a fun scale/bounce animation with CSS or framer-motion.
6. Filter button (top right): bottom sheet with species and province filters.
7. Empty state when no cards remain: cute illustration placeholder + message
   "การ์ดหมดแล้ว ลองเปลี่ยน filter หรือกลับมาใหม่นะ" + button to open filters.

Match creation logic must be in a single helper function with a clear comment
explaining the mutual-like check.
```

✅ **เช็คก่อนไปต่อ:** ปัดได้ ไลก์แล้วลง DB, ลอง 2 บัญชีไลก์กัน → popup เด้ง + matches มีแถวใหม่

---

## 💬 PHASE 4 — Matches List + Realtime Chat

```
Using the Master Context above:

Build /app/matches and the chat experience.

1. /app/matches: list all matches for the user's pet, newest first.
   Each row: pet photo (circular), pet name, mode badge (เพื่อนเล่น teal /
   หาคู่ amber), last message preview (or "เริ่มคุยกันเลย!"), and an unread dot
   if the last message is from the other side and newer than the user's last visit.
2. Tapping a match opens /app/chat/[matchId]: header with the other pet's
   photo + name, message bubbles (mine: coral, right; theirs: white, left),
   timestamps grouped by day in Thai (วันนี้, เมื่อวาน, or date).
3. Message input: text only, send on Enter or button. Insert into `messages`.
4. Realtime: subscribe to Supabase Realtime on the messages table filtered by
   match_id so new messages appear instantly without refresh.
5. Guard: users can only open chats for matches that include their own pet.
6. Empty states: no matches yet → "ยังไม่มีแมตช์ ไปปัดการ์ดกันเถอะ!" with a button
   to /app/swipe; empty chat → show the matched pets' photos and a prompt
   suggestion like "ลองชวนนัดเดทที่สวนใกล้ๆ ดูสิ".
```

✅ **เช็คก่อนไปต่อ:** เปิด 2 browser คุยกัน ข้อความเด้ง realtime ทั้งสองฝั่ง

---

## 🏠 PHASE 5 — Landing Page, Profile Page & Seed Data

```
Using the Master Context above:

Finish the MVP with three tasks.

TASK 1 — Landing page at / (public, full width, can be more expressive than app pages):
- Hero: headline "หาเพื่อน หาคู่ ให้เจ้าตัวน้อยของคุณ", subheadline explaining the
  two modes in one sentence, primary CTA "ลองเล่นเลย" (→ demo login) and secondary
  "สมัครฟรี". Include a phone mockup frame showing a swipe card screenshot/illustration.
- Section "ใช้งานยังไง" — 3 steps with icons: สร้างโปรไฟล์ → ปัดเลือก → แมตช์แล้วนัดเจอ
- Section showing both modes side by side (teal card vs amber card) with playful copy
- Footer: "Portfolio project by [NAME]" + links (GitHub, portfolio site)
- Smooth scroll animations (intersection observer fade-ups), but keep it tasteful

TASK 2 — /app/profile:
- Show the user's pet profile as a preview card (same design as swipe card)
- Edit button → reuse onboarding step components to edit each section
- Mode toggles, logout button, and a "ลบบัญชี" link (with confirm dialog)

TASK 3 — Seed data script:
- Write a Node script (scripts/seed.ts) that creates ~45 fake pets:
  25 dogs and 20 cats, mixed breeds/sexes/provinces (weight toward กรุงเทพฯ
  and เชียงใหม่), realistic Thai pet names (น้องลาเต้, เจ้าถุงเงิน, มะลิ...),
  varied personality tags and bios with personality, both modes represented.
  Use https://placedog.net and https://placekitten.com style placeholder URLs
  or a /public/seed-photos folder. Also create 8-10 likes pointing AT the demo
  account's pet so the demo user gets instant matches when they like back.
- Document how to run it in README.
```

✅ **เช็คงานจบ:** กดปุ่ม demo จาก landing → เจอการ์ดเพียบ → ไลก์ไม่กี่ทีก็ได้แมตช์ → คุยแชทได้ ครบ loop ใน 1 นาที

---

## 🛠 เทคนิคการ Vibe Code ให้รอด

1. **ทีละเฟส อย่าใจร้อน** — ตรวจ ✅ checkpoint ให้ผ่านก่อนไปเฟสถัดไปเสมอ ถ้าฐานพังแล้วสร้างต่อ จะพังทบต้น
2. **เก็บ Master Context ไว้ในไฟล์ `CLAUDE.md`** ที่ root ของโปรเจกต์ — Claude Code จะอ่านอัตโนมัติทุกครั้ง ไม่ต้อง paste ซ้ำ
3. **เจอ error ให้ paste error message ตรงๆ ทั้งก้อน** พร้อมบอกว่ากำลังทำอะไรอยู่ อย่าสรุปเอง
4. **ขอให้มันอธิบาย** — พิมพ์ต่อท้ายว่า "explain what you changed and why" จะได้เรียนรู้ไปด้วย ไม่ใช่แค่ได้โค้ด
5. **Commit ทุกครั้งที่จบเฟส** (`git commit`) — เป็น save point เหมือนเกม ถ้าเฟสถัดไปพังยับ ย้อนกลับได้
6. **อย่าให้ AI แก้หลายอย่างพร้อมกัน** — บั๊ก 3 จุด ให้แก้ทีละจุด ไม่งั้นมันจะแก้จุดหนึ่งแล้วพังอีกจุด
