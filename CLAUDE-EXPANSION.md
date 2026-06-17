# 🐾 PawMate — Expansion Kit: Care & Community Features

> **วิธีใช้:** ไฟล์นี้คือ "ภาคต่อ" ของ Vibe Coding Kit (MVP) — ใช้หลังจากสร้าง MVP (Phase 0-5) เสร็จแล้วเท่านั้น
> วิธีใช้เหมือนเดิม: วาง **EXPANSION CONTEXT** คู่กับ Master Context เดิมเป็นข้อความแรกเสมอ
> (หรือเอา EXPANSION CONTEXT ไปต่อท้ายไฟล์ `CLAUDE.md` ที่ root โปรเจกต์ — Claude Code จะอ่านเองอัตโนมัติทุกครั้ง)
> จากนั้นป้อน **Phase Prompt** ทีละเฟส ตรวจ ✅ ให้ผ่านก่อนค่อยไปเฟสถัดไป
> Prompt เขียนเป็นภาษาอังกฤษเหมือนเดิม เพราะ AI coding tools ตอบสนองแม่นกว่า

**ลำดับที่แนะนำ:** Phase 6 (Trust) → 7 (Care Hub + รพ.สัตว์) → 8 (สัตว์หาย) → 9 (บริจาคเลือด) → 10 (สมุดสุขภาพ) → 11 (Tele-vet demo — ทำหรือไม่ทำก็ได้)
**เหตุผล:** Trust layer ต้องมาก่อนเพราะเฟสอื่นใช้ badge ต่อ, ส่วน Care Hub (Phase 7) เป็น "บ้าน" ของฟีเจอร์ที่เหลือทั้งหมด

> ⚠️ **สถานะ (อัปเดต 2026-06-16):** **Phase 6 ทำเสร็จแล้ว** — แต่ใช้ migration เลข `010_trust.sql` จริง ไม่ใช่ `002_trust.sql` ที่ระบุในแผนเดิม (เลขจริงเรียงตามลำดับที่สร้างขึ้นจริงในโปรเจกต์ ไม่ใช่ตามแผนนี้) รายละเอียดที่ทำไปดูได้ใน `DEVLOG.md` (Session 7 + Session 12 ที่ปรับ UI ให้ตรง wireframe) **เริ่มงานต่อที่ Phase 7 ได้เลย** และ migration ใหม่ของ Phase 7 เป็นต้นไปต้องเริ่มที่ `012_*.sql` (ไม่ใช่ `003_*.sql` ตามที่เขียนไว้ด้านล่าง — เลขในไฟล์นี้ทั้งหมดเป็นแค่ลำดับอ้างอิงตอนเขียนแผน ไม่ใช่เลขที่ต้องใช้จริง)

---

## 🎯 EXPANSION CONTEXT (paste this together with the MVP Master Context, always)

```
# PROJECT: PawMate — Expansion: Care & Community Features

## What this is
This expansion adds a "Care & Community" layer on top of the existing PawMate MVP
(Next.js 14 App Router + TypeScript + Tailwind + Supabase, deployed on Vercel).

Strategic goal: matchmaking apps lose users after a successful match.
These features turn PawMate from a one-time matching tool into a daily-use pet
companion app, and add viral acquisition loops (lost-pet posts and blood-donation
requests are highly shareable content in Thai pet communities).

New feature set:
1. TRUST LAYER — vaccination/neuter badges, post-meetup reviews, report & block
2. CARE HUB — new bottom-nav tab "ดูแล" that hosts features 3-6
3. VET HOSPITAL FINDER — map + list of vet hospitals, filter by province / open 24h
4. LOST PET BOARD — report lost pets, community sightings, public shareable pages
5. BLOOD DONATION CENTER — donor registry + blood requests, matched by species,
   blood type, weight, and province (reuses the "matching" mental model of the core app)
6. HEALTH BOOK — vaccine/deworm/checkup records with due-date reminders,
   auto-syncs the `vaccinated` badge on the pet profile
7. (OPTIONAL) TELE-TRIAGE DEMO — mock online vet booking flow, clearly labeled as demo

## Ground rules (brownfield — read carefully)
- All rules from the MVP Master Context still apply: tech stack, design system,
  Thai UI text, English code/comments, mobile-first 390px, max content width 480px,
  loading + empty states for every data fetch.
- DO NOT refactor, restyle, or "improve" existing MVP code unless a phase
  explicitly says so.
- DO NOT edit supabase/migrations/001_init.sql. Every phase that touches the DB
  writes a NEW migration file. The migration numbers shown throughout this doc
  (002_trust.sql, 003_hospitals.sql, ...) are illustrative only — the real
  project already has 001–011 (Trust Layer landed as 010_trust.sql, plus
  011_reviews_delete.sql), so the next real migration is 012_hospitals.sql,
  013_lost_pets.sql, 014_blood.sql, 015_health.sql, 016_vet_bookings.sql.
- Existing tables may only be ALTERed to add columns when a phase says so —
  never rename or drop existing columns.
- Navigation update (done once, in Phase 7): bottom nav becomes 5 tabs —
  หน้าแรก (home, added in an earlier MVP session — keep it), ปัดการ์ด (swipe),
  แมตช์ (matches), ดูแล (care), โปรไฟล์ (profile).
- New semantic color — Urgent/Alert: deep rose #E0445A. Use ONLY for urgent
  blood requests, "lost" status, and due-soon warnings. Found/positive states
  reuse teal #2EC4B6. Everything else stays on the existing palette.
- Lost-pet share pages are PUBLIC (no login). Everything else stays behind auth.
- Disclaimers matter: blood donation and tele-triage screens must carry a short
  Thai disclaimer that the app is a connector/demo, not a medical service.

## New Database Schema (Supabase Postgres)

-- Phase 6 — ✅ DONE, actually shipped as 010_trust.sql (+ 011_reviews_delete.sql)
- reviews: id, match_id (fk matches), reviewer_pet_id (fk pets),
  reviewed_pet_id (fk pets), rating (int 1-5), tags (text[]),
  comment (text, nullable), created_at
  — unique (match_id, reviewer_pet_id); reviewer's pet must belong to the match
- reports: id, reporter_pet_id, reported_pet_id, reason (text),
  details (text, nullable), created_at
- blocks: id, blocker_pet_id, blocked_pet_id, created_at
  — unique (blocker_pet_id, blocked_pet_id)

-- Phase 7 (real next migration: 012_hospitals.sql)
- hospitals: id, name, province, district, address, phone,
  lat (float8), lng (float8), open_24h (bool), services (text[]), created_at
  — seeded reference data, read-only for users

-- Phase 8 (real next migration: 013_lost_pets.sql)
- lost_pets: id, reporter_id (fk profiles), pet_name, species ('dog'|'cat'),
  breed, photos (text[]), last_seen_province, last_seen_district,
  last_seen_detail (text), lost_date (date), distinguishing_marks (text),
  contact (text), reward (text, nullable), status ('lost'|'found'), created_at
- lost_pet_sightings: id, lost_pet_id (fk lost_pets), reporter_id (fk profiles),
  detail (text), seen_at_location (text), created_at

-- Phase 9 (real next migration: 014_blood.sql)
- blood_donors: id, pet_id (fk pets, unique), blood_type (text),
  weight_kg (numeric), eligible (bool), available (bool),
  last_donation_date (date, nullable), created_at
  — blood_type values: dogs 'DEA1.1+' | 'DEA1.1-' | 'unknown';
    cats 'A' | 'B' | 'AB' | 'unknown'
- blood_requests: id, requester_id (fk profiles), species ('dog'|'cat'),
  blood_type_needed (text), urgency ('urgent'|'normal'), hospital_name,
  province, details (text), contact (text), status ('open'|'fulfilled'), created_at
- blood_responses: id, request_id (fk blood_requests), donor_pet_id (fk pets),
  message (text, nullable), created_at
  — unique (request_id, donor_pet_id)

-- Phase 10 (real next migration: 015_health.sql)
- health_records: id, pet_id (fk pets), type ('vaccine'|'deworm'|'checkup'|'other'),
  title, record_date (date), next_due_date (date, nullable), notes (text), created_at

-- Phase 11, optional (real next migration: 016_vet_bookings.sql)
- vet_bookings: id, profile_id (fk profiles), vet_name, slot_at (timestamptz),
  topic (text), status ('booked'|'cancelled'), created_at

## RLS rules for all new tables
- Enable RLS everywhere. Users can INSERT/UPDATE/DELETE only their own rows
  (matched via their profile id or a pet they own). SELECT is authenticated-wide,
  EXCEPT these overrides:
  - hospitals: SELECT only (no user writes — reference data)
  - lost_pets + lost_pet_sightings: SELECT also granted to the anon role
    (needed for the public share page)
  - blood_responses: visible only to the response's donor owner AND the
    request's owner
- Blocking behavior: when a block exists in EITHER direction between two pets,
  exclude the other pet from the swipe feed and hide existing matches/chats
  between them. Implement as a reusable query filter — never delete data.

## Feature rules
- Reviews: one review per match per reviewer, only possible after a match exists.
  Pet detail sheet shows average rating (1 decimal) + count. Quick tag chips:
  ตรงปก, เป็นมิตร, แนะนำเลย (multi-select) + optional free-text comment.
- Donor eligibility checklist (eligible = ALL true):
  dogs — weight >= 20kg, age 1-7 years, vaccinated = true;
  cats — weight >= 4kg, age 1-7 years, vaccinated = true, indoor-only (checkbox).
  Donation spacing: available only if last_donation_date is null or >= 3 months ago.
- Blood matching on a request detail page: same species, province match shown
  first, blood type exact match; donors with blood_type 'unknown' appear in a
  separate group labeled ต้องตรวจ crossmatch ก่อน. Must also pass weight,
  eligible = true, available = true.
- Health Book -> badge sync: when a record with type 'vaccine' and title
  containing 'พิษสุนัขบ้า' has record_date within the last 12 months,
  set pets.vaccinated = true (recompute on every record change).
  Records with next_due_date within 30 days count toward a badge on the ดูแล tab.
```

---

## 🛡 PHASE 6 — Trust Layer: Badges, Reviews, Report & Block

> ✅ **DONE** (Session 7, UI rework to match wireframe in Session 12) — shipped as
> `010_trust.sql` + `011_reviews_delete.sql`, not `002_trust.sql` below. Prompt kept
> for reference only; see `DEVLOG.md` for what was actually built.

```
Using the MVP Master Context and the Expansion Context above:

Build the trust layer for PawMate.

1. Migration 002_trust.sql: create reviews, reports, blocks tables with the
   constraints and RLS rules from the Expansion Context.
2. Badges: on swipe cards and the pet detail sheet, show small pill badges —
   ✅ ฉีดวัคซีนแล้ว (teal outline) when pets.vaccinated = true, and ทำหมันแล้ว
   when pets.neutered = true. In BREEDING mode, if vaccinated is false or null,
   show a soft amber warning chip ยังไม่ยืนยันวัคซีน on the card.
3. Reviews: in the chat header menu (⋮), add ให้คะแนนหลังนัดเจอ — opens a modal
   with 1-5 stars, quick tag chips (ตรงปก, เป็นมิตร, แนะนำเลย), and an optional
   comment. One review per match per reviewer (enforced by the unique
   constraint — if already reviewed, show the existing review with an edit option).
4. Show ratings on the pet detail sheet: average (1 decimal) + review count +
   the 3 most recent comments (reviewer pet name + stars + comment + time ago).
5. Report & Block: in the chat header menu and the pet detail sheet, add รายงาน
   (reasons: โปรไฟล์ปลอม, ข้อความไม่เหมาะสม, ผสมพันธุ์แบบไม่รับผิดชอบ, อื่นๆ +
   details textarea) and บล็อก (confirm dialog explaining both sides will stop
   seeing each other). Blocked pets disappear from the swipe feed and the
   matches list in BOTH directions — implement this as a reusable query filter
   helper used by both pages.
6. After reporting, show a thank-you toast. After blocking, navigate back to
   the matches list.

Explain the block-filter helper with a clear comment. All copy in Thai.
```

✅ **เช็คก่อนไปต่อ:** รีวิวจาก 2 ฝั่งแล้วคะแนนเฉลี่ยคำนวณถูก, รีวิวซ้ำใน match เดิมไม่ได้ (ขึ้นของเดิมให้แก้แทน), บล็อกแล้วการ์ด+แชทหายทั้งสองฝั่ง

---

## 🗺 PHASE 7 — Care Hub + Vet Hospital Finder (รพ.สัตว์ใกล้ฉัน)

```
Using the MVP Master Context and the Expansion Context above:

Build the Care Hub and the vet hospital finder.

1. Update the bottom nav to 5 tabs: หน้าแรก, ปัดการ์ด, แมตช์, ดูแล (lucide
   HeartPulse icon), โปรไฟล์. Do not restyle the existing tabs.
2. /app/care — the Care Hub: a friendly 2x2 grid of menu cards with icons:
   🏥 โรงพยาบาลสัตว์ใกล้ฉัน, 📣 ประกาศสัตว์หาย, 🩸 ศูนย์บริจาคเลือด, 📒 สมุดสุขภาพ.
   Cards link to their pages (build hospitals in this phase; the other three
   pages can show a cute "เร็วๆ นี้" placeholder until their phases are built).
   Reserve a slot at the top for a reminder banner (wired up in Phase 10).
3. Migration 012_hospitals.sql: hospitals table + read-only RLS.
   Seed script scripts/seed-hospitals.ts inserting ~30 realistic vet hospitals
   across กรุงเทพฯ, เชียงใหม่, ขอนแก่น, ภูเก็ต, ชลบุรี with plausible coordinates,
   Thai names, phone numbers, services, and several open_24h = true entries.
   Document how to run it in README.
4. /app/care/hospitals: segment toggle at the top — รายการ | แผนที่.
   - List view: hospital cards (name, district + province, distance when
     location permission is granted, 24 ชม. badge in coral, services chips).
     Filters: province dropdown, เปิด 24 ชม. toggle, and name search.
   - Map view: react-leaflet + OpenStreetMap tiles (free, no API key).
     Markers for the currently filtered hospitals; tapping a marker opens a
     bottom card with that hospital's details.
5. Hospital detail bottom sheet: address, phone (tap = tel: link), services,
   and a นำทาง button opening a Google Maps directions URL in a new tab.
6. ใกล้ฉัน sorting: request browser geolocation with a graceful fallback if
   denied — fall back to sorting by match with the user's pet's province.
   Compute distance with a small haversine util in /lib/geo.ts and add a
   comment explaining the formula in plain words.

Install react-leaflet and leaflet. Handle the Next.js SSR issue with Leaflet
(dynamic import with ssr: false) and explain why in a comment.
```

✅ **เช็คก่อนไปต่อ:** แผนที่ขึ้นหมุดครบตาม filter, กดโทร/นำทางได้จริง, filter จังหวัด + 24 ชม. ทำงาน, ปฏิเสธ location permission แล้วแอปไม่พัง

---

## 📣 PHASE 8 — Lost Pet Board (ประกาศสัตว์หาย)

```
Using the MVP Master Context and the Expansion Context above:

Build the lost pet board.

1. Migration 013_lost_pets.sql: lost_pets + lost_pet_sightings with RLS,
   including SELECT for the anon role (public share pages need it).
2. /app/care/lost: feed of lost pet posts, newest first. Each card: main
   photo, pet name, species/breed, หายแถว {district}, {province}, days since
   lost_date (หายมาแล้ว X วัน), and a status badge — ยังตามหา (deep rose
   #E0445A) or พบแล้ว (teal). Filters: province, species, status.
   Floating ➕ แจ้งสัตว์หาย button (coral FAB).
3. Create form at /app/care/lost/new: photos (1-4, reuse the existing Storage
   upload component from onboarding), pet name, species, breed, last seen
   province + district + จุดสังเกต (free text), lost_date, ลักษณะเด่น,
   contact, reward (optional).
4. Post detail at /app/care/lost/[id]: photo carousel + all info + two actions:
   - 📍 แจ้งเบาะแส: modal with detail + สถานที่ที่พบเห็น → inserts a sighting.
     Sightings render under the post as a timeline (reporter display_name,
     time ago in Thai, detail, location).
   - 🔗 แชร์: Web Share API with copy-link fallback, linking to the PUBLIC page.
5. Public share page at /lost/[id] (NO auth, lives outside /app): same detail
   view, read-only, plus a banner: พบเห็นน้องตัวนี้? เข้าสู่ระบบเพื่อแจ้งเบาะแส
   (CTA to /login with redirect back to this post). Add OpenGraph meta tags
   (pet photo + headline ตามหา{pet_name} หายแถว{district}) so shared links
   preview well in LINE and Facebook.
6. The post owner can mark พบแล้ว — confirm dialog, then show a celebration
   state on the post (🎉 น้องกลับบ้านแล้ว) and move it under the พบแล้ว filter.

All copy in Thai — warm and hopeful in tone; this feature deals with worried
owners.
```

✅ **เช็คก่อนไปต่อ:** โพสต์ + แจ้งเบาะแสได้, ลิงก์แชร์เปิดได้แบบไม่ล็อกอิน, OG preview ขึ้นรูปน้อง (ทดสอบด้วย LINE/FB debugger), กดพบแล้ว → สถานะเปลี่ยน

---

## 🩸 PHASE 9 — Blood Donation Center (ศูนย์บริจาคเลือด)

```
Using the MVP Master Context and the Expansion Context above:

Build the blood donation center. This feature reuses PawMate's core idea —
matching two parties by criteria — applied to blood donors and requests.

1. Migration 014_blood.sql: blood_donors, blood_requests, blood_responses with
   the constraints and the RLS visibility rules from the Expansion Context.
2. /app/care/blood: a one-line header explainer + a muted disclaimer line:
   PawMate เป็นสื่อกลางช่วยหาผู้บริจาคเท่านั้น การบริจาคจริงต้องผ่านการตรวจ
   และดูแลโดยสัตวแพทย์ — then two tabs:
   - ประกาศขอรับบริจาค (default): feed of open requests. Card: species icon,
     blood type needed (large), urgency badge (ด่วนมาก in deep rose / ทั่วไป),
     hospital + province, time ago. Filters: province, species.
     FAB ➕ ขอรับบริจาค.
   - เป็นผู้บริจาค: donor registration for the user's pet — blood type select
     (options per species, with ไม่ทราบ option + helper text ตรวจกรุ๊ปเลือดได้ที่
     รพ.สัตว์), weight input, eligibility checklist auto-evaluated from the
     rules in the Expansion Context (render each criterion with ✓/✗ and the
     reason), availability toggle, last donation date. When registered, show
     the pet's donor status card (พร้อมบริจาค / พักการบริจาคถึงวันที่ X).
3. Request form: species, blood type needed, urgency, hospital name, province,
   details, contact. Insert with status 'open'.
4. Request detail page:
   - For everyone: full info + ผู้บริจาคที่เข้าเกณฑ์ในจังหวัดนี้: X ตัว
     (computed with the matching rules; show the 'unknown' blood type group
     separately as ต้องตรวจ crossmatch ก่อน).
   - For an eligible donor viewing it: a big coral button ยินดีช่วยเหลือ 🩸 →
     optional message → inserts into blood_responses (once per request).
   - For the request owner: list of responses showing donor pet name, photo,
     blood type, weight, owner display_name + contact, and a ปิดประกาศ
     (ได้รับความช่วยเหลือแล้ว) action → status 'fulfilled' + thank-you state.
5. Put the matching logic in /lib/blood-matching.ts as a pure function with
   example comments showing input → expected output for 3 cases.

All copy in Thai. Keep the tone calm and supportive, not alarming.
```

✅ **เช็คก่อนไปต่อ:** สมัครผู้บริจาคแล้ว checklist ประเมินถูกตามเกณฑ์, โพสต์ขอเลือดจากบัญชีหนึ่ง → อีกบัญชีที่เข้าเกณฑ์กดช่วย → เจ้าของประกาศเห็น contact, ปิดประกาศได้

---

## 📒 PHASE 10 — Health Book + Reminders (สมุดสุขภาพ)

```
Using the MVP Master Context and the Expansion Context above:

Build the health book.

1. Migration 015_health.sql: health_records with owner-only RLS.
2. /app/care/health: the user's pet header (photo, name, age) + a vertical
   timeline of records grouped by year, newest first. Each entry: type icon
   (💉 วัคซีน, 🪱 ถ่ายพยาธิ, 🩺 ตรวจสุขภาพ, 📌 อื่นๆ), title, date in Thai
   format, notes, and a next_due_date chip when present.
3. Add record: FAB ➕ → bottom sheet form (type, title with quick suggestions
   per type e.g. วัคซีนพิษสุนัขบ้า / วัคซีนรวม / หยดยากันเห็บหมัด, record_date,
   next_due_date optional, notes). Allow editing and deleting existing records
   (confirm dialog on delete).
4. ใกล้ถึงกำหนด section at the top: records with next_due_date within 30 days,
   sorted soonest first, each with a chip อีก X วัน (deep rose when <= 7 days).
5. Badge sync: implement the rabies rule from the Expansion Context as a
   helper — after any record insert/update/delete, recompute and update
   pets.vaccinated. Show a toast when the badge flips on:
   ปักป้ายฉีดวัคซีนแล้วให้บนโปรไฟล์เรียบร้อย 🎉
6. Care Hub integration: reminder banner on /app/care when any record is due
   within 30 days (มี X รายการใกล้ถึงกำหนด → links here) + a small count badge
   on the ดูแล nav tab.

All copy in Thai.
```

✅ **เช็คก่อนไปต่อ:** เพิ่ม/แก้/ลบ record ได้, บันทึกวัคซีนพิษสุนัขบ้า → badge ✅ ไปขึ้นที่การ์ดปัด (Phase 6) อัตโนมัติ, banner เตือน + ตัวเลขบน tab ดูแล ขึ้นเมื่อใกล้กำหนด

---

## 🩺 PHASE 11 (OPTIONAL) — Tele-Triage Demo (ปรึกษาสัตวแพทย์ออนไลน์ — ระบบสาธิต)

```
Using the MVP Master Context and the Expansion Context above:

Build a clearly-labeled DEMO of an online vet consultation flow. There are no
real vets — this exists to show product vision in the portfolio. Every screen
in this flow must show a small amber badge: ระบบสาธิต (Demo).

1. Migration 016_vet_bookings.sql: vet_bookings with owner-only RLS.
2. /app/care/vet-online: intro card explaining tele-triage in one Thai
   sentence (ปรึกษาอาการเบื้องต้นกับสัตวแพทย์ เพื่อประเมินว่าควรไป รพ. ด่วน
   แค่ไหน — ไม่ใช่การวินิจฉัยหรือสั่งยา) + an emergency disclaimer:
   หากฉุกเฉิน โทรหรือพาน้องไป รพ.สัตว์ทันที (link to the Phase 7 hospitals page).
3. Mock vet list: 4-5 vet profiles as hardcoded constants (no DB) — avatar
   placeholder, name, specialty (อายุรกรรมทั่วไป, โรคผิวหนัง, เฉพาะทางแมว, ...),
   rating, ค่าปรึกษา (mock price), and next available slots.
4. Booking flow: pick a vet → pick a time slot (next 3 days, generated
   client-side) → topic textarea (อาการเบื้องต้นของน้อง) → confirmation screen
   with a booking summary → insert into vet_bookings.
5. My bookings list with cancel (status 'cancelled'). A mock ห้องรอ (waiting
   room) page reachable from a booking: the vet card, a countdown to the slot
   time, and a disabled video-call frame carrying the Demo badge and the copy:
   ฟีเจอร์วิดีโอคอลจะเปิดใช้งานเมื่อเชื่อมต่อกับพาร์ทเนอร์สัตวแพทย์.

Keep this phase visually polished — it is a storytelling feature for the
portfolio, not a functional medical service.
```

✅ **เช็คงานจบ:** จองคิวได้ → เห็นหน้า confirmation + ห้องรอ, ทุกหน้าในโฟลว์มีป้าย ระบบสาธิต, ลิงก์ฉุกเฉินพาไปหน้า รพ.สัตว์ของ Phase 7

---

## 🛠 เทคนิคการ Vibe Code "งานต่อยอด" ให้รอด (brownfield ไม่เหมือนเริ่มใหม่)

1. **อย่าปล่อยให้ AI "ปรับปรุง" ของเดิมเอง** — งานต่อยอดต่างจากเริ่มจากศูนย์ ถ้าเห็นมันเริ่มรื้อโค้ด MVP ที่ใช้ได้อยู่แล้ว ให้หยุดแล้วพิมพ์ว่า "do not modify existing code, only add new files" — กฎข้อนี้เขียนไว้ใน Expansion Context แล้ว แต่ย้ำซ้ำได้เสมอ
2. **Migration ใหม่เท่านั้น ห้ามแก้ไฟล์เก่า** — 001_init.sql คือประวัติศาสตร์ แตะไม่ได้ ทุกเฟสสร้างไฟล์ 002, 003, ... ของตัวเอง ถ้า AI พยายามแก้ไฟล์เก่า = สัญญาณอันตราย
3. **ทดสอบด้วย 2 บัญชีเสมอ** — ฟีเจอร์ในชุดนี้เกือบทั้งหมดมี "สองฝั่ง" (รีวิว, บล็อก, แจ้งเบาะแส, ขอเลือด-ให้เลือด) เปิด browser ปกติ + incognito คู่กันตอนเช็ค checkpoint ทุกครั้ง
4. **Commit ทุกครั้งที่จบเฟส** — เหมือนเดิม คือ save point ถ้าเฟสถัดไปพังยับ ย้อนกลับได้
5. **ถ้า AI เริ่มหลุด context** (เช่น ใช้สีนอก palette, ลืม RLS) ให้ paste Expansion Context ซ้ำแล้วบอกว่า "re-read the ground rules" — อาการนี้เจอบ่อยใน session ยาวๆ
6. **เช็ค RLS ทุกเฟสที่มีตารางใหม่** — ลอง query ข้อมูลคนอื่นจากบัญชีที่ไม่ใช่เจ้าของใน Supabase SQL editor ถ้าดึงได้ = RLS รั่ว ต้องแก้ก่อนไปต่อ
