# PawMate — Design Tokens & Component Spec (สำหรับ Figma Redesign)

> สเปกพร้อมแปลงเป็น **Figma Variables (Styles) + Component library** — ใช้คู่กับ [`figma-screen-inventory.md`](./figma-screen-inventory.md)
> ค่าจริงดึงจาก `tailwind.config.ts` + className ที่ใช้จริงในโค้ด (Session 27, 2026-06-20)
> **หมายเหตุ:** นี่คือสเปก "ของเดิม" ไว้ตั้ง baseline ใน Figma ก่อน redesign — visual refresh จะปรับค่าเหล่านี้ต่อ

---

## 1. Colors → Figma Color Variables

### 1.1 Brand tokens (จาก `tailwind.config.ts` — เป็น source of truth)

| Figma variable | Tailwind | Hex | ใช้ทำอะไร |
|---|---|---|---|
| `cream` | `bg-cream` | `#FFF8F0` | พื้นหลังทุกหน้า |
| `coral` | `coral` | `#FF6B5B` | Primary action, ปุ่ม like, แท็บ active |
| `coral/dark` | `coral-dark` | `#E85647` | hover ของ coral |
| `teal` | `teal` | `#2EC4B6` | โหมด playdate, สถานะ found/positive |
| `teal/dark` | `teal-dark` | `#26A89C` | hover ของ teal |
| `amber` | `amber` | `#FFB84C` | โหมด breeding, เตือนใกล้กำหนด |
| `amber/dark` | `amber-dark` | `#F0A636` | hover ของ amber |
| `rose` | `rose` | `#E0445A` | **destructive/urgent เท่านั้น** (block, ลบรีวิว, lost status, urgent blood) — ห้ามใช้แทน primary |
| `brown` | `brown` | `#2D2A26` | body text หลัก |
| `brown/muted` | `brown-muted` | `#8A8580` | text รอง |

> ใน Tailwind ยังใช้ opacity เยอะ (เช่น `bg-coral/10`, `border-teal/30`, `bg-black/50`) — ใน Figma ทำเป็น fill + opacity หรือ variable เพิ่มเฉดอ่อนก็ได้

### 1.2 Gray ramp + semantic (ยัง **ไม่อยู่ใน config** — เป็น hex ดิบในโค้ด)

> แนะนำตั้งชื่อ token ให้ครบ จะ reproduce ของเดิมได้ 100% และทำให้ design system สมบูรณ์

| ชื่อ token ที่แนะนำ | Hex | ใช้ทำอะไร (พบในโค้ด) |
|---|---|---|
| `gray-700` | `#5A5650` | text เข้มรอง (neutered badge) |
| `gray-400` | `#B5B0AA` | icon/placeholder อ่อน |
| `gray-300` | `#C5C1BC` | เส้นขอบอ่อน |
| `gray-250` | `#D5D1CC` | border badge |
| `gray-200` | `#EDEAE6` | พื้น segmented control / track |
| `gray-150` | `#F0EEEB` | พื้น badge อ่อน |
| `gray-100` | `#F5F3F0` | พื้น section อ่อน |
| `gray-50` | `#F9F8F6` | พื้นอ่อนสุด |
| `success` | `#1A8A6A` | สีเขียวสำเร็จ (เข้มกว่า teal) |
| `danger` | `#8B1A1A` | แดงเข้ม destructive |
| `info` | `#5A8FD4` | น้ำเงิน info |

---

## 2. Typography → Figma Text Styles

**Font:** [Prompt](https://fonts.google.com/specimen/Prompt) (Google Fonts) — ครอบคลุมไทย+ละตินในฟอนต์เดียว
weights ที่ใช้: **300, 400, 500, 600, 700** · `<html lang="th">`

| Figma text style | Tailwind | ใช้ทำอะไร |
|---|---|---|
| `Title/L` | `text-2xl font-bold text-brown` (24/700) | หัวข้อใน detail sheet |
| `Title/M` | `text-xl font-bold text-brown` (20/700) | หัวการ์ด/section |
| `Heading/S` | `text-base/[17px] font-bold text-brown` | หัว bottom-sheet |
| `Label` | `text-sm font-bold text-brown` (14/700) | label ฟอร์ม |
| `Body` | `text-sm text-brown-muted` (14/400) | เนื้อหา/text รอง |
| `Caption` | `text-xs text-brown-muted` (12/400) | meta/helper |
| `Caption/XS` | `text-[10px]–[11px] ...` | stat caption, badge เล็ก |
| `Button` | `font-bold text-white` (บน coral) | ป้ายปุ่ม primary |
| `Chip` | `text-xs font-bold` (สีตามบริบท) | chip/badge |
| `Stat` | `text-base/[28px] font-bold text-brown` | ตัวเลข stat / คะแนนเฉลี่ย |

---

## 3. Radius / Shadow / Spacing

| Token | ค่า | หมายเหตุ |
|---|---|---|
| `radius/card` | **20px** (`rounded-card`) | การ์ดหลัก |
| `radius/sheet` | **28px** (`rounded-t-[28px]`) | bottom sheet มุมบน |
| `radius/input` | 12px (`rounded-xl`) | input/select |
| `radius/pill` | 9999px (`rounded-full`) | ปุ่ม/chip |
| `radius/sm` | 11–16px (`rounded-[11px]`/`[14px]`/`[16px]`) | element ย่อย (ใช้กระจาย) |
| `shadow/card` | **`0 4px 16px rgba(0,0,0,0.06)`** (`shadow-card`) | ยกการ์ด |

- **Layout:** mobile-first, frame **390 × 844**, content container `max-w-[480px]` จัดกึ่งกลาง
- **z-index convention** (เผื่อจัด layer ใน Figma): dropdown `z-50` · bottom sheet/detail sheet `z-[60]` · modal สำคัญ `z-[70]` · toast `z-[80]`
- ไม่มี custom spacing scale — ใช้ Tailwind default (4px base): gap/padding ที่พบบ่อย `gap-1.5 / 2 / 3`, `px-4 py-3`, `p-5 / p-6`

---

## 4. Component Spec → Figma Components

> className จริงไว้ดูค่า (สี/รัศมี/ระยะ) ตอนสร้าง component — redesign แล้วค่อยปรับ

### Cards
- **Card มาตรฐาน:** `rounded-card bg-white shadow-card`
- **Card ขอบอ่อน (care/lost):** `rounded-2xl border border-black/5 bg-white shadow-card` (lost ใช้ `border-[#EDEAE6]`)

### Buttons
- **Primary (coral pill):** `rounded-full bg-coral py-3 font-bold text-white hover:bg-coral-dark disabled:opacity-40`
- **Secondary (outline pill):** `rounded-full border-2 border-black/10 py-3 font-bold text-brown-muted hover:border-coral/40`
- **Destructive (rose):** `rounded-full bg-rose py-2.5 font-bold text-white disabled:opacity-60`
- **OAuth/social:** `rounded-full border border-black/10 bg-white py-3 font-bold text-brown hover:bg-cream` + โลโก้ inline SVG

### Pills / Chips / Badges
- **Selectable pill** — inactive: `rounded-full border-2 border-black/10 px-3 py-1 text-sm font-bold text-brown-muted hover:border-coral/40` → active: `border-coral bg-coral text-white` (teal variant: `border-teal bg-teal`) → ทำเป็น Figma **variant** (default/active × coral/teal)
- **Static tag chip:** `rounded-full bg-cream px-2.5 py-1 text-xs font-bold text-brown-muted` (coral variant: `bg-coral/10 text-coral`)
- **Trust/status badge (tinted):** `flex items-center gap-1 rounded-full border border-teal/30 bg-teal/10 px-2.5 py-1 text-xs font-bold text-teal-dark` → variants: vaccinated (teal) · neutered (gray) · warning (amber)
- **Mode chip:** `rounded-full bg-amber/20 px-2 py-0.5 text-[10px] font-bold text-amber-dark`
- **Rect badge (24h/status):** `rounded-lg bg-coral/10 px-2 py-0.5 text-[11px] font-bold text-coral`

### Overlays
- **Bottom-sheet shell:** overlay `fixed inset-0 z-[60] flex flex-col bg-black/50` → scrim `flex-1` → panel `mx-auto w-full max-w-[480px] rounded-t-[28px] bg-white` (มักมี `maxHeight: 88vh`)
  - **drag handle:** `mx-auto mb-4 h-1 w-9 rounded-full bg-black/10` (หรือ `h-1.5 w-12 bg-black/15`)
  - ⚠️ ข้อยกเว้น: **HospitalDetailSheet** หยุดที่ `bottom-[60px]` (เหนือ BottomNav) ไม่ใช่ `inset-0`
- **Centered modal/dialog:** overlay `fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-6` → panel `w-full max-w-[320px] rounded-card bg-white p-6 text-center shadow-2xl`

### Inputs
- **Text input:** `w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm placeholder:text-brown-muted/60 focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30`
- **Select:** เหมือน input + `appearance-none` + `pr-10` + `ChevronDown` วาง absolute ขวา

### Misc
- **Icon medallion:** `flex h-10 w-10 items-center justify-center rounded-full bg-{tint}` (block dialog ใช้ `h-[52px] w-[52px] bg-rose/10`)
- **Toast:** กล่อง dark ลอยเหนือ BottomNav + icon medallion + title/subtitle (`z-[80]`)

---

## 5. Icons

- Library: **lucide-react** — ใน Figma หา plugin **"Lucide Icons"** มาวางให้ตรง
- **ไม่มี brand icon** ใน lucide → Google/Facebook เป็น inline SVG (`components/icons/GoogleLogo.tsx`, `FacebookLogo.tsx`) — copy SVG ไปใช้ใน Figma ได้เลย
- **Icon ที่ใช้บ่อย:** `X` (ปิด) · `MapPin` (location) · `Check` (เลือก/ยืนยัน) · `ChevronDown/Left/Right` · `Star` (rating) · `Heart`/`Users`/`Send` · `PawPrint`/`Home`/`HeartPulse`/`User` (BottomNav) · `ShieldCheck`/`Scissors` (trust) · `Loader2` (spinner)
- อื่นๆ: `AlertTriangle`, `Ban`, `Megaphone`, `Flag`, `Calendar`/`CalendarDays`, `Clock`, `Phone`, `Navigation`, `ZoomIn`, `Info`, `Edit2`, `Plus`, `Trash2`, `Coffee`/`Trees`/`Waves`/`Hotel` (spot types), `Dog`/`Cat`, `SlidersHorizontal`, `Search`, `RefreshCw`, `Share2`, `MoreVertical`, `Monitor`, `DollarSign`

---

## ลำดับสร้างใน Figma (แนะนำ)
1. **Color variables** (§1.1 + §1.2) → 2. **Text styles** (§2) → 3. **Radius/Shadow** (§3)
4. **Core components** (§4): Card → Button → Pill/Chip/Badge → Input → Bottom-sheet shell → Modal → Icon medallion → BottomNav → AppHeader
5. จากนั้นไปประกอบหน้าตาม [`figma-screen-inventory.md`](./figma-screen-inventory.md)
