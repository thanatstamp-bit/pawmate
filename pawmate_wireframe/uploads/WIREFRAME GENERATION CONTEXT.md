# PAWMATE — WIREFRAME GENERATION CONTEXT

## What I want
Generate a MID-FIDELITY WIREFRAME for ONE mobile screen of "PawMate" — a pet
matchmaking + pet-care web app for the Thai market ("Tinder for pets", dogs & cats).
Output a clean layout blueprint: structure, hierarchy, and real Thai content.
This is a WIREFRAME, not final UI. Prioritize WHERE things go and HOW the user
moves through the screen — not visual polish.

## Fidelity rules (important)
- Show REAL layout, spacing, and Thai copy, drawn with simple boxes and lines.
- Photos/avatars = gray placeholder blocks with a small centered line-icon. No real images.
- Use color ONLY to signal meaning, never as decoration:
  - Coral  -> the single PRIMARY action / "like".
  - Teal   -> playdate mode + positive / "found" states.
  - Amber  -> breeding mode accents + soft warnings + "demo" badge.
  - Deep rose #E0445A -> URGENT only (urgent blood request, "lost" status, due in <=7 days).
  - Everything else -> grayscale (text, borders, surfaces).
- NO gradients, illustrations, decorative shadows, or flourishes. That is the hi-fi stage.

## Canvas & layout
- Mobile-first. Design at 390px wide. Max content width 480px, centered.
- Spacing on a 4/8px rhythm. Card corner radius ~20px. Comfortable, never cramped.
- Every tappable target >= 44px. ONE primary action per screen; secondary actions are lighter.
- Respect safe areas: a fixed top header and fixed bottom nav reserve space so content
  is never hidden underneath them.

## Type & icons
- Font: "Prompt" (covers Thai + Latin). Body 16px. Headings heavier (600-700), labels medium (500).
- Icons: a single line-icon family (lucide style) ONLY. NEVER use emoji as a UI icon.

## States (always include where data loads)
- Loading: skeleton placeholders that mirror the final layout (not a spinner).
- Empty: a short friendly Thai message + an icon + the next action.
- Error (for network actions): a short Thai message + a "ลองใหม่" retry.

## Navigation shell
- Persistent top header: "PawMate" logo on the left, links to Home.
  (The chat screen and the public share page do NOT use this header.)
- Persistent bottom nav — ALWAYS the SAME 5 tabs on every screen, every phase, no swaps:
  หน้าแรก · ปัดการ์ด · แมตช์ · แดชบอร์ด · โปรไฟล์
- "ดูแล"/Care is NOT a nav tab. It is a menu entry on the HOME screen, which acts as a SUPER-APP hub
  that launches every feature. Care pages (Care Hub, hospitals, lost pets, blood, health, vet-online)
  are reached from Home, so on those pages the active tab is "หน้าแรก".
- Active tab is highlighted (color + weight). Icons + Thai labels. Always exactly 5 tabs.

## Output
- ONE screen per generation. Add brief section annotations if the tool supports notes.
- All user-facing text in Thai. Keep structural notes in English if needed.