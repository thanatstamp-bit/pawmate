# PawMate — Route Paths

## Public (ไม่ต้องล็อกอิน)

| Path | คำอธิบาย |
|---|---|
| `/` | Landing page |
| `/login` | เข้าสู่ระบบ / สมัครสมาชิก |
| `/lost/[id]` | Public share page สัตว์หาย (OG meta สำหรับ LINE/FB) |

## Onboarding

| Path | คำอธิบาย |
|---|---|
| `/onboarding` | 4-step wizard สร้างโปรไฟล์น้อง |

## App (ต้อง login — protected by middleware)

| Path | คำอธิบาย |
|---|---|
| `/app/home` | หน้าแรก — pet card + stats + เมนู |
| `/app/swipe` | ปัดการ์ด (mode toggle: playdate / breeding) |
| `/app/matches` | รายการแมตช์ (tab: แชท / นัดเล่น) |
| `/app/chat/[matchId]` | Realtime chat + นัดเล่น |
| `/app/profile` | โปรไฟล์น้อง + สลับน้อง + stats + logout |
| `/app/care` | Care Hub — grid 2×2 |
| `/app/care/hospitals` | ค้นหาโรงพยาบาลสัตว์ (list / map toggle) |
| `/app/care/lost` | Feed ประกาศสัตว์หาย |
| `/app/care/lost/new` | ฟอร์มแจ้งสัตว์หาย |
| `/app/care/lost/[id]` | รายละเอียดประกาศ + แจ้งเบาะแส |
