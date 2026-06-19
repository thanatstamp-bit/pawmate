# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start dev server (localhost:3000)
npm run build     # production build + type-check
npm run lint      # ESLint via next lint
npx tsc --noEmit  # type-check without building (use this to verify changes)

# Seed fake pets into Supabase (requires .env.local with service role key)
npx ts-node --project scripts/tsconfig.json scripts/seed.ts

# Seed pet-friendly playdate spots
npx ts-node --project scripts/tsconfig.json scripts/seed-spots.ts

# Seed vet hospitals (Care Hub → Hospital Finder)
npx ts-node --project scripts/tsconfig.json scripts/seed-hospitals.ts
```

No test suite exists — `npx tsc --noEmit` is the primary correctness check.

## Architecture

**Next.js 14 App Router + Supabase + Tailwind.** All user-facing text is in Thai; code/comments are in English.

### Route layout

| Path | Description |
|---|---|
| `/` | Public landing page — sticky navbar (logo + เข้าสู่ระบบ + สมัครฟรี), hero, how-it-works, two-modes, CTA, footer |
| `/login` | Auth (email/password + demo button + Google & Facebook OAuth); "จดจำอีเมล" checkbox prefills the email from `localStorage["pawmate_remembered_email"]` (email only — never the password) |
| `/auth/callback` | OAuth code-exchange route handler (the project's only `route.ts`) — `exchangeCodeForSession`, upserts a `profiles` row, then routes to `/app/swipe` or `/onboarding` like password login; failure → `/login?error=oauth` |
| `/onboarding` | 4-step pet profile wizard (protected) |
| `/app/home` | Home page — active pet card + quick stats |
| `/app/swipe` | Core swipe feed with mode toggle |
| `/app/matches` | Matches list (chat tab + playdate tab) |
| `/app/chat/[matchId]` | Realtime chat, scheduling, trust actions |
| `/app/profile` | Pet profile preview + edit, multi-pet management, stats, account actions |
| `/app/care` | Care Hub — ดูแล tab in bottom nav; 2×2 grid of care features |
| `/app/care/hospitals` | Vet hospital finder — list/map toggle, filters, geolocation distance sort |
| `/app/care/lost` | Lost pet feed — province/species/status filters, extended pill FAB |
| `/app/care/lost/new` | Create lost pet post — photo upload, in-page success screen |
| `/app/care/lost/[id]` | Lost pet detail — photo carousel, sightings timeline, owner actions |
| `/app/care/blood` | Blood donation center — feed of open requests + donor registration tab |
| `/app/care/blood/[id]` | Blood request detail — matched donors (exact + crossmatch), respond as donor, owner sees responses |
| `/app/care/health` | Health Book — vertical timeline, ใกล้ถึงกำหนด section, pet switcher, add/edit/delete records |
| `/app/care/vet-online` | Tele-vet Demo — vet list (static mock), amber "ระบบสาธิต" badge, emergency disclaimer → hospitals; calendar icon (top-right) + shortcut card → bookings |
| `/app/care/vet-online/book/[vetId]` | Booking wizard — 3-step (เลือกเวลา → อาการ → ยืนยัน), server wrapper + `VetBookingWizard` client component |
| `/app/care/vet-online/bookings` | My bookings + waiting room — list with upcoming/past sections, cancel, countdown timer, disabled video frame |
| `/lost/[id]` | Public share page — server component, OG meta tags, no auth required; logo bar + CTA banner + phone button + share button (client island `PublicShareButton`) |
| `/privacy` | Public privacy policy — server component, no auth; linked from landing footer + set as the OAuth Privacy Policy URL in the Meta/Google dashboards |

The `/app/*` layout (`app/app/layout.tsx`) wraps all authenticated pages with a persistent `ConditionalAppHeader` (logo → /app/home) and `BottomNav` (5 tabs: หน้าแรก, ปัดการ์ด, แมตช์, ดูแล, โปรไฟล์). BottomNav แสดง amber count badge บน tab ดูแล เมื่อมี health record ใกล้ถึงกำหนด (ผ่าน `CareDueBadge` component). The chat page suppresses the global header because it has its own navigation header; the swipe page suppresses it too, to give the card deck maximum vertical space; `/app/care/*` suppresses it too — Care Hub and its sub-pages build their own back-arrow header (back → `/app/home` from the hub, back → `/app/care` from sub-pages).

Middleware (`middleware.ts` → `lib/supabase/middleware.ts`) protects `/app/*` and `/onboarding` with a session check that redirects to `/login`. `/auth/callback` is intentionally outside the matcher (public).

**OAuth profile-creation gotcha**: `profiles.display_name` is `NOT NULL` and there is no DB trigger on `auth.users`, so a profile row is only ever created in app code. Email/password signup inserts it (with the form's display name); the demo login and the Google/Facebook OAuth callback `upsert` it (`onConflict: "id", ignoreDuplicates: true`). Any new auth path must create the `profiles` row itself — OAuth users have no profile until the callback makes one. `handleOAuth(provider)` in `AuthForm.tsx` is provider-agnostic, and `/auth/callback` handles any provider generically, so adding a provider is just enabling it in Supabase + rendering one more button. Provider config (client IDs/secrets, redirect URLs, Meta App Domains/permissions) lives in the Google Cloud / Meta / Supabase dashboards, not the repo — see DEVLOG Sessions 25–26 (incl. Facebook setup gotchas).

### Supabase client usage

- **Client components** → `import { createClient } from "@/lib/supabase/client"` (browser)
- **Server components / actions** → `import { createClient } from "@/lib/supabase/server"` (cookies)
- **Seed scripts only** → service role key (`SUPABASE_SERVICE_ROLE_KEY`), never in frontend

Pet photos (Supabase Storage URLs, seed placeholder URLs) are rendered with plain `<img>` (each with an `eslint-disable-next-line @next/next/no-img-element` comment), not `next/image`. Only static local assets (e.g. `/logo.png`) go through `next/image`; `next.config.mjs`'s `images.remotePatterns` covers that case.

### Supabase query gotcha: bare `.maybeSingle()`

Any query that might match more than one row for an account — e.g. "does this user have a pet?" — must call `.limit(1)` before `.maybeSingle()`. A bare `.maybeSingle()` errors on >1 rows; code that only destructures `data` (ignoring `error`) then sees `null`, indistinguishable from "no result." This has caused real, hard-to-spot bugs after multi-pet support shipped: an onboarding loop on login (`AuthForm.tsx`, `app/login/actions.ts`) and a seed script silently skipping pre-likes (`scripts/seed.ts`). Apply this rule anywhere a pet is looked up by `owner_id` without a specific pet `id`.

### Active pet pattern

All app pages resolve the current user's active pet from `localStorage.getItem("pawmate_active_pet_id")` and fall back to the first pet by `created_at` if the stored ID is invalid. The profile page (`/app/profile`) sets this value when the user switches pets. Every page that queries per-pet data must follow this same two-step resolution:

```ts
const storedId = localStorage.getItem("pawmate_active_pet_id");
// 1. Try stored ID (validate it belongs to this user)
// 2. Fall back to first pet; update localStorage
```

### Key library helpers

- `lib/match.ts` — `checkAndCreateMatch()`: checks mutual likes and inserts a match row; handles the unique-constraint race condition
- `lib/blocks.ts` — `getBlockedPetIds()`: returns a `Set<string>` of pet IDs blocked in either direction; used in swipe feed, matches list, and chat to hide content without deleting data
- `lib/geo.ts` — `haversineKm()`: great-circle distance between two lat/lng points; used by the hospital finder's "ใกล้ฉัน" sort
- `lib/blood-matching.ts` — `matchDonors()` (filter + rank donors by blood type/province), `evaluateEligibility()` (per-species checklist), `monthsSinceLastDonation()` (3-month spacing check)
- `lib/health.ts` — `syncVaccinatedBadge(supabase, petId)`: recomputes `pets.vaccinated` after any health_record change; returns `true` if badge just flipped on (used to show vaccine toast)

### Swipe feed logic (`app/app/swipe/page.tsx`)

The deck fetch always loads `prevLikedIds` from the DB (regardless of recycle mode) so liked cards never reappear. `skippedIds` (session `useRef`) are cleared on recycle so skipped cards cycle back. `likedIds` are never cleared — they mirror the DB. A demo counter (`swipeCount` + `forceNext` refs) triggers `create_demo_match` RPC after 3–7 swipes without a natural match.

**Drag-to-swipe (`components/swipe/PetCard.tsx`)**: native Pointer Events (no framer-motion — kept deps lean). Drag the top card left/right; past `SWIPE_THRESHOLD` (110px) it flies off and calls `onSwipe(dir)`, otherwise it snaps back. The transform is applied to the card *face* only — never an ancestor of the detail sheet, because a `transform` on an ancestor reparents `position: fixed` children to that element instead of the viewport, breaking the full-screen sheet. A post-drag tap is suppressed (`onClickCapture` + `didDrag` ref) so it doesn't open the detail sheet; `touch-none` stops the browser hijacking the horizontal swipe as a back-gesture. The ✕/♥ action buttons drive the same fly-off via the `triggerSwipe` prop, and each card carries `key={pet.id}` so its drag state resets cleanly per card.

### Realtime chat

`/app/chat/[matchId]` subscribes to Supabase Realtime on `messages` filtered by `match_id`. Messages sent by the local user are optimistically appended and de-duplicated by ID when the realtime event arrives.

### Hospital finder map (`components/care/HospitalMap.tsx`)

Uses `leaflet` + `react-leaflet` (pinned to v4 — v5 requires React 19) with free OpenStreetMap tiles, no API key. Loaded via `next/dynamic(() => import(...), { ssr: false })` from `app/app/care/hospitals/page.tsx` because Leaflet touches `window` at import time. Every marker supplies its own `L.divIcon` (a colored circle + number), so the component never falls back to Leaflet's default teardrop icon — sidesteps the well-known "default marker images 404 under webpack" issue without an `L.Icon.Default.mergeOptions()` path rewrite. Unlike the app's other full-screen bottom sheets, `HospitalDetailSheet` stops at `bottom-[60px]` (the bottom nav's height) instead of `inset-0`, so the nav stays visible/usable while the sheet is open — see the Hospital Finder Wireframe.

## Database

Migrations live in `supabase/migrations/` and must be run manually in the Supabase SQL Editor (not via CLI). Never edit `001_init.sql`; add new numbered migration files.

| Migration | Contents |
|---|---|
| `001_init.sql` | profiles, pets, likes, matches, messages + RLS + `owns_pet()` and `is_in_match()` helpers |
| `002_storage_policies.sql` | Storage bucket RLS for pet photos |
| `008_playdates.sql` | `playdate_spots`, `playdate_proposals` tables |
| `009_demo_match.sql` | `create_demo_match()` SECURITY DEFINER RPC |
| `010_trust.sql` | reviews, reports, blocks tables + RLS |
| `011_reviews_delete.sql` | RLS DELETE policy so a reviewer can delete their own review |
| `012_hospitals.sql` | `hospitals` table (Care Hub → Hospital Finder), public read-only RLS |
| `013_lost_pets.sql` | `lost_pets` + `lost_pet_sightings` tables + RLS — anon SELECT for public `/lost/[id]` |
| `014_blood.sql` | `blood_donors`, `blood_requests`, `blood_responses` tables + RLS — `blood_responses` visible only to donor owner or request owner |
| `015_health.sql` | `health_records` table + RLS — SELECT/INSERT/UPDATE/DELETE เฉพาะเจ้าของ (ผ่าน `owns_pet()`) |
| `016_vet_bookings.sql` | `vet_bookings` table + owner-only RLS — Phase 11 Tele-vet demo |

Numbers are non-sequential (no `003`–`007`) — they reflect actual build order, not the phase numbering suggested in the roadmap (`DEVLOG.md`). The next new migration would be `017_*.sql`.

**RLS pattern**: `owns_pet(pet_id)` is a SECURITY DEFINER helper that checks `pets.owner_id = auth.uid()`. Use it in policies instead of inlining the join. `is_in_match(match_id)` checks that the caller's pet is a participant.

**matches uniqueness**: `pet_a_id` and `pet_b_id` are stored in sorted order (`LEAST`/`GREATEST`) to satisfy the unique constraint and prevent `(A,B)` / `(B,A)` duplicates.

**Block semantics**: never delete match or message rows on block. `getBlockedPetIds()` reads both directions and the caller filters in memory.

## Design system (Tailwind)

Custom tokens in `tailwind.config.ts`:

| Token | Value | Usage |
|---|---|---|
| `bg-cream` | `#FFF8F0` | Page backgrounds |
| `coral` / `coral-dark` | `#FF6B5B` / `#E85647` | Primary actions, likes |
| `teal` / `teal-dark` | `#2EC4B6` / `#26A89C` | Playdate mode accent |
| `amber` / `amber-dark` | `#FFB84C` / `#F0A636` | Breeding mode accent |
| `brown` / `brown-muted` | `#2D2A26` / `#8A8580` | Body text / secondary text |
| `rounded-card` | `20px` | Card border radius |
| `shadow-card` | `0 4px 16px rgba(0,0,0,0.06)` | Card elevation |

Font: Prompt (covers Thai + Latin) via `var(--font-prompt)`. Icons: `lucide-react` only — no emoji as UI icons.

Bottom sheets and modals above the swipe deck use `z-[60]`; match popup uses `z-[70]`. Bottom sheets use `env(safe-area-inset-bottom)` for safe area padding.

## Future phases (not yet built)

`DEVLOG.md` holds the prompt-kit roadmap for Phases 6–11. Phases 6–10 are built:
- Phase 6 — Trust Layer (`010_trust.sql`/`011_reviews_delete.sql`, `components/trust/*`)
- Phase 7 — Care Hub + Vet Hospital Finder (`012_hospitals.sql`, `app/app/care/*`, `components/care/*`)
- Phase 8 — Lost Pet Board (`013_lost_pets.sql`, `app/app/care/lost/*`, `app/lost/[id]`, `components/lost/*`)
- Phase 9 — Blood Donation Center (`014_blood.sql`, `lib/blood-matching.ts`, `app/app/care/blood/*`)
- Phase 10 — Health Book (`015_health.sql`, `lib/health.ts`, `app/app/care/health/page.tsx`, `components/care/HealthRecordForm.tsx`, `components/care/CareDueBadge.tsx`)
- Phase 11 — Tele-vet Demo (`016_vet_bookings.sql`, `lib/data/mock-vets.ts`, `app/app/care/vet-online/*`, `components/care/VetBookingWizard.tsx`)

All phases 0–11 are now complete. `DEVLOG.md` holds the full roadmap history.

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Supabase anon/public key
DEMO_EMAIL                     # Fixed demo account email (server-only)
DEMO_PASSWORD                  # Fixed demo account password (server-only)
SUPABASE_SERVICE_ROLE_KEY      # Seed scripts only — never expose to browser
```
