# PawMate — Screen & State Inventory (สำหรับ Figma Redesign)

> เช็กลิสต์ทุกหน้าจอ ทุก state และทุก overlay ของแอป — ใช้คู่กับ [`figma-design-tokens.md`](./figma-design-tokens.md)
> เป้าหมาย: **visual refresh** (เปลี่ยนหน้าตา โครง/flow เดิม) ออกแบบใน Figma เอง
> สำรวจจากโค้ด ณ Session 27 (2026-06-20)

## วิธีใช้เอกสารนี้

- จัดเป็น **4 หมวด = 4 Figma Pages**: Public · Onboarding · Main App · Care Hub
- แต่ละ **state / overlay = 1 frame** ใน Figma → ติ๊ก `[ ]` เมื่อทำเสร็จ
- **Frame size แนะนำ: 390 × 844** (iPhone, mobile-first) — content จริงกว้างสุด `max-w-[480px]`
- ดู style/component ที่ใช้จาก [`figma-design-tokens.md`](./figma-design-tokens.md)

### Workflow แนะนำ (design-system-first)
1. ตั้ง **Foundation** ก่อน — color variables + text styles + radius/shadow (จาก design-tokens.md)
2. สร้าง **Core Components** — BottomNav, AppHeader, card, button, pill, badge, bottom-sheet shell, input
3. วางหน้า **ทีละหมวด** — ทำ default state ก่อน แล้ว duplicate เป็น empty/loading/error
4. ทำ **Overlay/Modal** เป็น component variant ซ้อนบน frame ที่เกี่ยว
5. **Redesign visual** บน frame ที่ trace มา (เปลี่ยนสี/typography/spacing โดยคงโครง)

### นำหน้าจอเข้า Figma (ประหยัดโควต้า plugin)
- **plugin import** (html.to.design ฯลฯ) free tier จำกัด URL/เดือน → ใช้กับหน้า **public** ก่อน (`/`, `/login`, `/privacy`, `/lost/[id]`)
- **fallback ฟรี — Chrome DevTools:** F12 → Device toolbar (Ctrl+Shift+M) → 390px → ล็อกอินบัญชี demo เข้าหน้า `/app/*` → เปิด modal/sheet ที่ต้องการ → Ctrl+Shift+P → "Capture full size screenshot" → ลาก PNG เข้า Figma เป็น reference แล้ว redraw จาก token spec (ไม่ต้อง trace style)

### Persistent chrome (ทำเป็น component ใช้ซ้ำ)
- **AppHeader** (logo bar) — โชว์เฉพาะ `/app/home`, `/app/matches`, `/app/profile`
- ถูก **suppress** บน: `/app/swipe`, `/app/chat/*`, `/app/care/*` (หน้าเหล่านี้ทำ header เอง)
- **BottomNav** (5 tabs) — โชว์ทุกหน้า `/app/*` (รวม swipe/chat): หน้าแรก · ปัดการ์ด · แมตช์ · ดูแล · โปรไฟล์
  - tab "ดูแล" มี **CareDueBadge** (amber count) เมื่อมี health record ใกล้กำหนด
- BottomNav **ไม่โชว์** บนหน้า public (`/`, `/login`, `/onboarding`, `/privacy`, `/lost/[id]`)

> หมายเหตุ: ไม่มี `loading.tsx`/`error.tsx`/`not-found.tsx` — ทุก state ทำใน component (skeleton + conditional render)

---

## หมวด 1 — Public (Figma Page: "Public")

| # | Route | ไฟล์ | คำอธิบาย |
|---|---|---|---|
| 1 | `/` | `app/page.tsx` | Landing — navbar, hero + phone mockup, how-it-works (3 ขั้น), two-modes, CTA, footer |
| 2 | `/login` | `app/login/page.tsx` + `components/AuthForm.tsx` | Login/Signup card |
| 3 | `/privacy` | `app/privacy/page.tsx` | นโยบายความเป็นส่วนตัว (9 sections) |
| 4 | `/lost/[id]` | `app/lost/[id]/page.tsx` | หน้าแชร์สาธารณะสัตว์หาย (server, OG meta) |
| — | `/auth/callback` | `app/auth/callback/route.ts` | OAuth handler — **ไม่มี UI** (ไม่ต้องทำ frame) |

**Frames ที่ต้องทำ:**
- [ ] `/` Landing (state เดียว, static)
- [ ] `/login` — tab **Login** (มี checkbox "จดจำอีเมล")
- [ ] `/login` — tab **Signup** (มี field ชื่อที่แสดง)
- [ ] `/login` — state **loading** (spinner ในปุ่ม ปุ่ม disable)
- [ ] `/login` — state **error** banner (coral) / **notice** banner (teal)
- [ ] ปุ่มใน login: Email submit · Google OAuth · Facebook OAuth · Demo
- [ ] `/privacy` (static)
- [ ] `/lost/[id]` — status **lost** (badge แดง, นับวันหาย, ปุ่มโทร, CTA ล็อกอิน, social-proof)
- [ ] `/lost/[id]` — status **found** (badge teal, celebration strip, ไม่มีปุ่มโทร/CTA)
- [ ] `/lost/[id]` — sightings **empty** (กล่อง dashed) vs **timeline**
- [ ] `/lost/[id]` — single photo vs multiple (dot indicators)
- [ ] `/lost/[id]` — **404 / not-found**

---

## หมวด 2 — Onboarding (Figma Page: "Onboarding")

| # | Route | ไฟล์ | คำอธิบาย |
|---|---|---|---|
| 5 | `/onboarding` | `app/onboarding/page.tsx` | Wizard สร้างโปรไฟล์น้อง **4 ขั้น** (ใช้เป็นหน้า edit ด้วย) |

โครง wizard: back arrow · "ขั้นตอน X/4" · title · progress bar · เนื้อหา · ปุ่มล่าง

**Frames (1 frame ต่อขั้น + states):**
- [ ] ขั้น 1 — **รูปและชื่อ** (`Step1Photos`) — 2×2 dashed photo grid + name input
- [ ] ขั้น 2 — **ข้อมูลพื้นฐาน** (`Step2Basic`) — species cards, breed dropdown, sex toggle, month/year
- [ ] ขั้น 3 — **นิสัยและพื้นที่** (`Step3Personality`) — tag chips, province, district, bio
- [ ] ขั้น 4 — **โหมดที่เปิดรับ** (`Step4Modes`) — mode cards (playdate/breeding) + vaccinated/neutered toggles + amber warning
- [ ] state **validation error** banner (coral)
- [ ] state **submitting** (ขั้น 4 — spinner, label "สร้างโปรไฟล์น้อง")

---

## หมวด 3 — Main App (Figma Page: "Main App")

| # | Route | ไฟล์ | Header | คำอธิบาย |
|---|---|---|---|---|
| 6 | `/app/home` | `app/app/home/page.tsx` | AppHeader | greeting, pet hero, stats, เมนูหลัก, เมนูดูแล |
| 7 | `/app/swipe` | `app/app/swipe/page.tsx` | ไม่มี | mode toggle + filter, การ์ดเด็ค, ปุ่ม skip/like |
| 8 | `/app/matches` | `app/app/matches/page.tsx` | AppHeader | tabs แชท/นัดหมาย |
| 9 | `/app/chat/[matchId]` | `app/app/chat/[matchId]/page.tsx` | (เอง) | แชท realtime + นัดหมาย + trust actions |
| 10 | `/app/profile` | `app/app/profile/page.tsx` | AppHeader | active pet preview, น้องตัวอื่น, account |

### 6. Home
- [ ] state **loading** (HomeSkeleton)
- [ ] state **has-pet** — pet hero + stats จริง + CTA "ปัดการ์ดเลย"
- [ ] state **empty (no pet)** — กล่อง dashed + CTA onboarding, stats "—", CTA disabled
- [ ] tile variants: ปกติ · **dimmed** (requiresPet & ไม่มี pet) · **"เร็วๆ นี้"** badge
- [ ] overlay: **Pet switcher bottom sheet** (เมื่อมี >1 pet, มี badge "กำลังใช้อยู่")

### 7. Swipe
- [ ] state **initial loading** (paw-print pulse เต็มจอ)
- [ ] state **no-pet** ("ยังไม่มีโปรไฟล์น้อง" + CTA)
- [ ] state **card loading skeleton**
- [ ] state **empty deck** ("ดูครบแล้ว!" + ปุ่ม "ดูใหม่อีกครั้ง")
- [ ] state **active deck** — top card + peek card หลัง
- [ ] mode toggle: playdate (teal) / breeding (amber) / mode **disabled** (greyed + tooltip)
- [ ] filter button + **active-filter count badge**
- [ ] gesture overlay บนการ์ด: label **"ถูกใจ"** (ซ้าย) / **"ผ่าน"** (ขวา) จางตามลาก
- [ ] overlay: **FilterSheet** (province, breed [ซ่อนใน breeding], size, age, tags, health toggles, reset + "ดูผลลัพธ์")
- [ ] overlay: **MatchPopup** — playdate ("เป็นเพื่อนกันแล้ว! 🎉") vs breeding ("แมตช์กันแล้ว! 💕"), ปุ่ม "ทักเลย"/"ปัดต่อ"
- [ ] overlay: **PetCard detail sheet** (drag-to-dismiss)
- [ ] overlay: **photo lightbox** (prev/next/dots)
- [ ] PetCard trust badge variants: vaccinated · neutered · breeding warning "ยังไม่ยืนยันวัคซีน"
- [ ] overlay (จาก PetCard): ReportSheet · BlockConfirm · Toast

### 8. Matches
- [ ] state **loading** (message-circle pulse)
- [ ] state **empty (ไม่มีแมตช์เลย)** — "ยังไม่มีแมตช์" + CTA "ไปปัดการ์ด"
- [ ] tab **แชท** — รายการ match (avatar, ชื่อ, mode badge, preview ข้อความ/“เริ่มคุยกันเลย!”, unread dot)
- [ ] tab **นัดหมาย** — มี pending-count badge บน tab
- [ ] นัดหมาย: **empty** ("ยังไม่มีนัดหมาย")
- [ ] นัดหมาย: section **Upcoming** + **Past**
- [ ] `PlaydateCard` variants: accepted (teal) · pending-proposer (amber) · pending-receiver (coral) · past (greyed)

### 9. Chat (full-height, header เอง)
- [ ] state **loading** (spinner เต็มจอ)
- [ ] state **empty conversation** (avatar + "ลองชวนนัดเดท..." + ปุ่มนัดหมาย)
- [ ] state **populated** — day dividers (วันนี้/เมื่อวาน/วันที่), bubble ของเรา (coral ขวา) vs เขา (white ซ้าย)
- [ ] state **sending** (input + ปุ่ม disable)
- [ ] header: avatar + ชื่อ + ปุ่มปฏิทิน + ปุ่ม ⋮
- [ ] overlay: **overflow menu popover** (ดูโปรไฟล์/ให้คะแนน/รายงาน/บล็อก)
- [ ] overlay: **ScheduleSheet** (date strip, time select, spot picker + **empty "ไม่มีสถานที่"**, custom location, note)
- [ ] overlay: **PetProfileSheet** (read-only profile + lightbox)
- [ ] overlay: **ReviewModal** — new vs **edit "แก้ไขรีวิว"** + **nested delete-confirm**
- [ ] overlay: **ReportSheet** · **BlockConfirm** · **Toast**
- [ ] inline: **ProposalBanner** 3 states (accepted teal / pending-proposer amber + cancel / pending-receiver coral + ยืนยัน/ปฏิเสธ)

### 10. Profile
- [ ] state **loading** (paw-print pulse)
- [ ] state **empty (no pet)** — "ยังไม่มีน้องในระบบ" + CTA
- [ ] active pet preview (photo, photo strip [ถ้า >1], location, tags, bio, modes, edit link, stats)
- [ ] section **"น้องตัวอื่นของฉัน"** (เมื่อ >1 pet — `PetStatCard` + switch/edit)
- [ ] account section (LogoutButton, ปุ่มลบบัญชี)
- [ ] overlay: **delete-account confirm dialog** ("ลบบัญชีใช่ไหม?" + deleting state)

---

## หมวด 4 — Care Hub (Figma Page: "Care Hub")

> ทุกหน้า care ทำ **back-arrow header เอง** (AppHeader suppressed), auth-protected

| # | Route | ไฟล์ |
|---|---|---|
| 11 | `/app/care` | `app/app/care/page.tsx` |
| 12 | `/app/care/hospitals` | `app/app/care/hospitals/page.tsx` |
| 13 | `/app/care/health` | `app/app/care/health/page.tsx` |
| 14 | `/app/care/lost` | `app/app/care/lost/page.tsx` |
| 15 | `/app/care/lost/new` | `app/app/care/lost/new/page.tsx` |
| 16 | `/app/care/lost/[id]` | `app/app/care/lost/[id]/page.tsx` |
| 17 | `/app/care/blood` | `app/app/care/blood/page.tsx` |
| 18 | `/app/care/blood/[id]` | `app/app/care/blood/[id]/page.tsx` |
| 19 | `/app/care/vet-online` | `app/app/care/vet-online/page.tsx` |
| 20 | `/app/care/vet-online/book/[vetId]` | `.../book/[vetId]/page.tsx` + `VetBookingWizard.tsx` |
| 21 | `/app/care/vet-online/bookings` | `.../bookings/page.tsx` |

### 11. Care Hub home
- [ ] grid 2 คอลัมน์ 5 การ์ด (Hospitals, Lost, Blood, Health, Vet online)
- [ ] **reminder banner** (เมื่อ dueCount > 0)
- [ ] health card variant: **due-count badge / amber border** (เมื่อ dueCount > 0)

### 12. Hospital finder
- [ ] state **loading skeleton** (ListSkeleton)
- [ ] state **empty** ("ไม่พบโรงพยาบาล" + clear filters)
- [ ] **list view** vs **map view** (Leaflet, custom markers + legend)
- [ ] geolocation: pending / granted (เรียงระยะทาง) / denied (fallback note)
- [ ] filter row: province select, 24h toggle, name search
- [ ] overlay: **HospitalDetailSheet** (สำคัญ: หยุดเหนือ BottomNav ไม่ใช่ inset-0; 24h badge, address, tel, services, "นำทาง")

### 13. Health book
- [ ] state **loading skeleton** (header + due + timeline + FAB)
- [ ] state **empty** ("ยังไม่มีบันทึกสุขภาพ" + "เพิ่มบันทึกแรก"; FAB ซ่อน)
- [ ] **ใกล้ถึงกำหนด** section (≤7 วัน แดง / อื่นๆ amber)
- [ ] **timeline** จัดกลุ่มตามปี, dot สีตาม type (vaccine/deworm/checkup/other), next-due chip (overdue แดง/≤30d amber/future teal)
- [ ] pet header + chevron สลับ pet (เมื่อ >1)
- [ ] overlay: **Pet switcher sheet**
- [ ] overlay: **HealthRecordForm** — add vs **edit**, type selector, suggestion chips, date, collapsible next-due, notes, saving + **inline delete-confirm banner** + Toast vaccine sync

### 14. Lost feed
- [ ] state **loading skeleton** (3 cards)
- [ ] state **empty** (paw-prints SVG + CTA)
- [ ] **populated** (`LostPetCard`)
- [ ] filter row (province/species/status) + **extended FAB "แจ้งสัตว์หาย"**

### 15. New lost report
- [ ] **form** default
- [ ] photo uploader: **empty dropzone** vs **grid (≤4 + remove)** vs **uploading** vs error
- [ ] submit disabled/enabled + **saving** spinner + error banner
- [ ] **success screen** (check ring, "ส่งประกาศแล้ว!", LostPetCard preview, actions, share-nudge)

### 16. In-app lost detail
- [ ] state **loading skeleton**
- [ ] state **not-found** ("ไม่พบประกาศนี้")
- [ ] status **lost** vs **found** (badge + celebration banner)
- [ ] photo carousel: single vs multiple (arrows + dots)
- [ ] role variants: owner ("คุณเอง" badge) vs non-owner (แจ้งเบาะแส + แชร์)
- [ ] sightings: **empty** vs timeline
- [ ] overlay: **SightingModal** (location + detail + saving)
- [ ] overlay: **mark-as-found confirm dialog**
- [ ] overlay: **Toast** (copy link/contact, sighting thanks)

### 17. Blood hub
- [ ] state **loading** (droplet pulse)
- [ ] disclaimer strip + sticky tab bar (ขอรับบริจาค / เป็นผู้บริจาค)
- [ ] tab **Feed**: filters + **empty** vs RequestCard list (urgent = "ด่วนมาก" badge) + FAB
- [ ] tab **Donor**: **no-pet** state · donor status variants (ไม่ผ่านเกณฑ์/พักการบริจาค/หยุดพัก/พร้อม) · donor status card (+available toggle) · registration form + **eligibility checklist** (pass/fail) + cat-only indoor checkbox + saving
- [ ] overlay: **Create-request bottom sheet** (species, blood type, urgency, hospital, province, details, contact)

### 18. Blood request detail
- [ ] state **loading** (spinner) · **not-found**
- [ ] status **open** ("เปิดรับ") vs **fulfilled** ("ปิดแล้ว")
- [ ] non-owner: matched donors "กรุ๊ปตรง" + "ต้องตรวจ crossmatch" + **empty "ไม่มีผู้บริจาคที่ตรง"**
- [ ] owner: responses list + **empty** + ปุ่ม "ทำเครื่องหมายว่าหาได้แล้ว"
- [ ] inline: **DonorCard response form** (textarea + send + "แจ้งแล้ว" done)

### 19. Vet-online hub (static)
- [ ] Demo badge + intro card + shortcut "การจองของฉัน" + emergency disclaimer + vet list
- [ ] vet slot chips: "ว่าง" vs **"ไม่มีช่องว่าง"**

### 20. Vet booking wizard (3 ขั้น)
- [ ] ขั้น 1 — **เลือกเวลา** (day selector +2, slot grid, taken struck-through, legend, ปุ่ม disabled จนเลือก)
- [ ] ขั้น 2 — **อาการ** (recap chip, textarea 500 ตัว, suggestions, disabled จนกรอก, loading)
- [ ] ขั้น 3 — **ยืนยัน/success** (check hero, ref "#DEMO-XXXX", booking card, disclaimer, CTA)
- [ ] **not-found** (vetId ผิด)

### 21. Vet bookings list
- [ ] state **loading** (spinner) · **empty** ("ยังไม่มีการจอง" + CTA)
- [ ] section **Upcoming** (cards: เข้าห้องรอ/ยกเลิก; cancelled = greyed + strikethrough + badge)
- [ ] section **Past** (compact, badge เสร็จสิ้น/ยกเลิกแล้ว)
- [ ] **cancellation toast** (teal)
- [ ] **Waiting room takeover** (full-screen) — vet card, appointment info, countdown mm:ss, disabled/demo video frame

---

## สรุปจำนวน (ไว้ตั้งเป้า)
- **หน้า:** ~21 หน้า (+ 1 route handler ไม่มี UI)
- **Overlay/sheet/modal/popup:** ~20 ตัว
- **Multi-step:** Onboarding 4 ขั้น · Vet booking 3 ขั้น
- รวม frame ทั้ง state ย่อย **ประมาณ 80–100 frames**
