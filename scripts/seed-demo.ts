/**
 * Demo seed script — creates ONE self-contained demo account whose every PawMate
 * feature is pre-populated, so any screen shows real data on first open.
 *
 * Usage (run from the project root):
 *   npx ts-node --project scripts/tsconfig.json scripts/seed-demo.ts
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 * The service role key bypasses RLS — never commit it to git.
 *
 * Idempotent: re-running wipes this demo account's pets + posts and rebuilds them.
 * To remove entirely, delete the two users below from the Supabase Auth dashboard.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Accounts ────────────────────────────────────────────────────────────────
const DEMO_EMAIL = "demo-full@pawmate.app";
const DEMO_PASSWORD = "PawMate-Demo-2026!";
const FRIENDS_EMAIL = "demo-friends@pawmate.internal"; // owns the match counterparts

// ── Helpers ───────────────────────────────────────────────────────────────────
function dogPhoto(seed: number): string {
  return `https://placedog.net/400/500?r=${seed}`;
}
function catPhoto(seed: number): string {
  return `https://cataas.com/cat?width=400&height=500&seed=${seed}`;
}
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}
function hoursFromNow(hours: number): Date {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d;
}

/** Get an existing auth user by email, or create one (email pre-confirmed). */
async function getOrCreateUser(email: string, password: string): Promise<string> {
  const { data: page } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existing = (page?.users ?? []).find((u) => u.email === email);
  if (existing) return existing.id;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    console.error(`Failed to create user ${email}:`, error);
    process.exit(1);
  }
  return data.user.id;
}

type PetInput = {
  owner_id: string;
  name: string;
  species: "dog" | "cat";
  breed: string;
  sex: "male" | "female";
  birth_month: string; // YYYY-MM-01
  photos: string[];
  personality_tags: string[];
  province: string;
  district?: string | null;
  modes: ("playdate" | "breeding")[];
  vaccinated?: boolean;
  neutered?: boolean;
  bio?: string;
};

async function createPet(input: PetInput): Promise<string> {
  const { data, error } = await supabase
    .from("pets")
    .insert({ district: null, ...input })
    .select("id")
    .single();
  if (error || !data) {
    console.error(`Failed to create pet ${input.name}:`, error?.message);
    process.exit(1);
  }
  return data.id;
}

/** matches has a plain unique(pet_a,pet_b,mode) — sort the uuids ourselves. */
async function createMatch(
  petX: string,
  petY: string,
  mode: "playdate" | "breeding"
): Promise<string> {
  const [a, b] = [petX, petY].sort();
  const { data, error } = await supabase
    .from("matches")
    .insert({ pet_a_id: a, pet_b_id: b, mode })
    .select("id")
    .single();
  if (error || !data) {
    console.error("Failed to create match:", error?.message);
    process.exit(1);
  }
  return data.id;
}

/** Insert a back-and-forth conversation with ascending timestamps. */
async function seedConversation(
  matchId: string,
  lines: { from: string; text: string }[],
  startDaysAgo: number
) {
  const base = daysFromNow(-startDaysAgo);
  let minute = 0;
  for (const line of lines) {
    const at = new Date(base);
    at.setMinutes(at.getMinutes() + minute);
    minute += 7;
    const { error } = await supabase.from("messages").insert({
      match_id: matchId,
      sender_pet_id: line.from,
      content: line.text,
      created_at: at.toISOString(),
    });
    if (error) console.error("  message error:", error.message);
  }
}

// ── Idempotent reset ──────────────────────────────────────────────────────────
async function wipeAccount(demoId: string, friendsId: string) {
  // Deleting pets cascades to likes/matches/messages/reviews/reports/blocks/
  // playdate_proposals/health_records/blood_donors/blood_responses.
  await supabase.from("pets").delete().in("owner_id", [demoId, friendsId]);
  // These key off the profile directly, not a pet — delete explicitly.
  await supabase.from("lost_pets").delete().eq("reporter_id", demoId);
  await supabase.from("blood_requests").delete().eq("requester_id", demoId);
  await supabase.from("vet_bookings").delete().eq("user_id", demoId);
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🐾 PawMate full-option demo seed starting...\n");

  const demoId = await getOrCreateUser(DEMO_EMAIL, DEMO_PASSWORD);
  const friendsId = await getOrCreateUser(FRIENDS_EMAIL, "friends-password-internal");
  console.log(`✅ demo user:    ${demoId}`);
  console.log(`✅ friends user: ${friendsId}\n`);

  await supabase.from("profiles").upsert(
    { id: demoId, display_name: "เจ้าของน้องเดโม่" },
    { onConflict: "id" }
  );
  await supabase.from("profiles").upsert(
    { id: friendsId, display_name: "เพื่อนน้องเดโม่" },
    { onConflict: "id" }
  );

  console.log("🧹 Wiping previous demo data (idempotent re-run)...");
  await wipeAccount(demoId, friendsId);

  // ── Demo's own pets (2 → multi-pet + active-pet switching) ────────────────
  console.log("🐕 Creating demo pets...");
  const mochi = await createPet({
    owner_id: demoId,
    name: "เจ้าโมจิ",
    species: "dog",
    breed: "โกลเด้น รีทรีฟเวอร์",
    sex: "male",
    birth_month: "2022-03-01",
    photos: [dogPhoto(11), dogPhoto(12)],
    personality_tags: ["ขี้เล่น", "ใจดี", "ฉลาด", "เข้ากับเด็กได้"],
    province: "กรุงเทพมหานคร",
    modes: ["playdate", "breeding"],
    vaccinated: true,
    neutered: false,
    bio: "เจ้าโมจิเป็นโกลเด้นสุดน่ารัก ขี้เล่นและเป็นมิตรกับทุกคน ชอบวิ่งเล่นในสวนและว่ายน้ำ 🐶",
  });
  const noon = await createPet({
    owner_id: demoId,
    name: "น้องนุ่น",
    species: "cat",
    breed: "สก็อตติช โฟลด์",
    sex: "female",
    birth_month: "2023-06-01",
    photos: [catPhoto(21), catPhoto(22)],
    personality_tags: ["ขี้อ้อน", "ชอบนอน", "ใจดี"],
    province: "กรุงเทพมหานคร",
    modes: ["playdate"],
    vaccinated: true,
    neutered: true,
    bio: "น้องนุ่นเป็นแมวหูพับขี้อ้อน ชอบนอนตักและกอด อ้อนเก่งมาก 🐱",
  });
  console.log(`   เจ้าโมจิ=${mochi}\n   น้องนุ่น=${noon}\n`);

  // ── Counterpart pets (owned by the friends bot) ───────────────────────────
  console.log("🐾 Creating counterpart pets...");
  // Matched partners
  const max = await createPet({
    owner_id: friendsId, name: "เจ้าแม็กซ์", species: "dog", breed: "บีเกิ้ล",
    sex: "male", birth_month: "2021-08-01", photos: [dogPhoto(31), dogPhoto(32)],
    personality_tags: ["พลังเยอะ", "ขี้เล่น", "ชอบเดินเล่น"], province: "กรุงเทพมหานคร",
    modes: ["playdate"], vaccinated: true, neutered: true,
    bio: "เจ้าแม็กซ์พลังเยอะมาก ชอบวิ่งเล่นตอนเช้า",
  });
  const lady = await createPet({
    owner_id: friendsId, name: "เลดี้", species: "dog", breed: "โกลเด้น รีทรีฟเวอร์",
    sex: "female", birth_month: "2021-11-01", photos: [dogPhoto(33), dogPhoto(34)],
    personality_tags: ["ใจดี", "เชื่อฟัง", "ขี้อ้อน"], province: "กรุงเทพมหานคร",
    modes: ["playdate", "breeding"], vaccinated: true, neutered: false,
    bio: "เลดี้เป็นโกลเด้นสาวนิสัยดี เรียบร้อย รักเด็ก",
  });
  const luna = await createPet({
    owner_id: friendsId, name: "ลูน่า", species: "cat", breed: "เปอร์เซีย",
    sex: "female", birth_month: "2022-05-01", photos: [catPhoto(35), catPhoto(36)],
    personality_tags: ["ขี้อ้อน", "ชอบนอน"], province: "กรุงเทพมหานคร",
    modes: ["playdate"], vaccinated: true, neutered: true,
    bio: "ลูน่าเป็นแมวเปอร์เซียขนฟู ชอบนอนกลางวัน",
  });
  // Deck candidates (pre-like → demo's เจ้าโมจิ, so swiping right matches instantly)
  const bella = await createPet({
    owner_id: friendsId, name: "เบลล่า", species: "dog", breed: "โกลเด้น รีทรีฟเวอร์",
    sex: "female", birth_month: "2022-01-01", photos: [dogPhoto(37), dogPhoto(38)],
    personality_tags: ["ขี้เล่น", "พลังเยอะ"], province: "นนทบุรี",
    modes: ["playdate", "breeding"], vaccinated: true, neutered: false,
    bio: "เบลล่าโกลเด้นสาวร่าเริง มองหาเพื่อนเล่นและคู่ที่ใช่",
  });
  const cocco = await createPet({
    owner_id: friendsId, name: "ค็อกโก้", species: "dog", breed: "คอร์กี้",
    sex: "female", birth_month: "2023-02-01", photos: [dogPhoto(39), dogPhoto(40)],
    personality_tags: ["ขี้อ้อน", "ซุกซน"], province: "กรุงเทพมหานคร",
    modes: ["playdate"], vaccinated: true, neutered: false,
    bio: "ค็อกโก้คอร์กี้ขาสั้นน่ารัก ชอบหาเพื่อนเดินเล่น",
  });
  // Blood donors (also respond to demo's blood request)
  const tiger = await createPet({
    owner_id: friendsId, name: "ไทเกอร์", species: "dog", breed: "ลาบราดอร์ รีทรีฟเวอร์",
    sex: "male", birth_month: "2020-04-01", photos: [dogPhoto(41), dogPhoto(42)],
    personality_tags: ["ใจดี", "เชื่อฟัง"], province: "กรุงเทพมหานคร",
    modes: ["playdate"], vaccinated: true, neutered: true,
    bio: "ไทเกอร์ลาบราดอร์ตัวใหญ่ใจดี พร้อมเป็นผู้ให้เลือด",
  });
  // Spam pet → blocked + reported (kept out of the deck via the block)
  const spam = await createPet({
    owner_id: friendsId, name: "บัญชีแปลก", species: "dog", breed: "มิกซ์ (ลูกผสม)",
    sex: "male", birth_month: "2021-01-01", photos: [dogPhoto(43), dogPhoto(44)],
    personality_tags: ["ดุกับแปลกหน้า"], province: "ชลบุรี",
    modes: ["playdate"], vaccinated: false, neutered: false,
    bio: "โปรไฟล์ที่ถูกรายงาน",
  });
  console.log("   max, lady, luna, bella, cocco, tiger, spam created\n");

  // ── Likes ─────────────────────────────────────────────────────────────────
  console.log("❤️  Creating likes (deck + history)...");
  // Pre-likes pointing AT เจ้าโมจิ → instant match on swipe-right
  await supabase.from("likes").insert([
    { from_pet_id: bella, to_pet_id: mochi, mode: "breeding" },
    { from_pet_id: cocco, to_pet_id: mochi, mode: "playdate" },
  ]);
  // เจ้าโมจิ already swiped these (won't reappear in deck)
  await supabase.from("likes").insert([
    { from_pet_id: mochi, to_pet_id: max, mode: "playdate" },
    { from_pet_id: mochi, to_pet_id: lady, mode: "breeding" },
  ]);

  // ── Matches + conversations ───────────────────────────────────────────────
  console.log("💬 Creating matches + chat history...");
  // Match 1: เจ้าโมจิ × เจ้าแม็กซ์ (playdate)
  await supabase.from("likes").insert([
    { from_pet_id: max, to_pet_id: mochi, mode: "playdate" },
  ]);
  const matchMax = await createMatch(mochi, max, "playdate");
  await seedConversation(matchMax, [
    { from: max, text: "สวัสดีครับ เจ้าโมจิน่ารักมากเลย! 🐶" },
    { from: mochi, text: "ขอบคุณครับ เจ้าแม็กซ์ก็หล่อมากเลย" },
    { from: max, text: "ว่างไปวิ่งเล่นที่สวนกันไหมครับ?" },
    { from: mochi, text: "ได้เลยครับ เสาร์นี้สะดวกไหม?" },
    { from: max, text: "สะดวกครับ เจอกันที่สวนวชิรเบญจทัศ 9 โมงนะ" },
    { from: mochi, text: "โอเคครับ แล้วเจอกัน! 🎾" },
  ], 3);

  // Match 2: เจ้าโมจิ × เลดี้ (breeding)
  await supabase.from("likes").insert([
    { from_pet_id: lady, to_pet_id: mochi, mode: "breeding" },
  ]);
  const matchLady = await createMatch(mochi, lady, "breeding");
  await seedConversation(matchLady, [
    { from: lady, text: "สวัสดีค่ะ เลดี้เป็นโกลเด้นเหมือนกันเลย" },
    { from: mochi, text: "ว้าว ดีจังเลยครับ สายพันธุ์เดียวกัน" },
    { from: lady, text: "โมจิฉีดวัคซีนครบไหมคะ?" },
    { from: mochi, text: "ครบแล้วครับ มีสมุดสุขภาพด้วย" },
    { from: lady, text: "เยี่ยมเลยค่ะ นัดเจอกันคุยรายละเอียดดีไหม" },
  ], 2);

  // Match 3: น้องนุ่น × ลูน่า (playdate)
  await supabase.from("likes").insert([
    { from_pet_id: luna, to_pet_id: noon, mode: "playdate" },
    { from_pet_id: noon, to_pet_id: luna, mode: "playdate" },
  ]);
  const matchLuna = await createMatch(noon, luna, "playdate");
  await seedConversation(matchLuna, [
    { from: luna, text: "เมี้ยว~ น้องนุ่นหูพับน่ารักจัง 🐱" },
    { from: noon, text: "ลูน่าขนฟูน่ากอดมากเลยค่า" },
    { from: luna, text: "มา playdate ที่ cat cafe กันไหม" },
    { from: noon, text: "ชอบบบ ไปกันน้า" },
  ], 1);

  // ── Playdate proposals ────────────────────────────────────────────────────
  console.log("📅 Creating playdate proposals...");
  const { data: spots } = await supabase
    .from("playdate_spots")
    .select("id, name")
    .limit(2);
  const spotA = spots?.[0] ?? null;
  const spotB = spots?.[1] ?? null;
  // Accepted proposal in the เจ้าแม็กซ์ match
  await supabase.from("playdate_proposals").insert({
    match_id: matchMax,
    proposer_pet_id: max,
    proposed_at: daysFromNow(3).toISOString(),
    spot_id: spotA?.id ?? null,
    custom_location: spotA ? null : "สวนวชิรเบญจทัศ (สวนรถไฟ)",
    note: "เจอกันหน้าทางเข้าฝั่งสวนสุนัขนะครับ",
    status: "accepted",
  });
  // Pending proposal in the เลดี้ match
  await supabase.from("playdate_proposals").insert({
    match_id: matchLady,
    proposer_pet_id: lady,
    proposed_at: daysFromNow(6).toISOString(),
    spot_id: spotB?.id ?? null,
    custom_location: spotB ? null : "Bark & Brew Pet Cafe ทองหล่อ",
    note: "นัดคุยเรื่องผสมพันธุ์ค่ะ",
    status: "pending",
  });

  // ── Reviews ───────────────────────────────────────────────────────────────
  console.log("⭐ Creating reviews...");
  await supabase.from("reviews").insert([
    {
      match_id: matchMax, reviewer_pet_id: max, reviewed_pet_id: mochi,
      rating: 5, tags: ["ตรงเวลา", "เป็นมิตร", "น้องน่ารัก"],
      comment: "เจ้าโมจิน่ารักและเล่นด้วยสนุกมาก เจ้าของก็ใจดีมากครับ",
    },
    {
      match_id: matchMax, reviewer_pet_id: mochi, reviewed_pet_id: max,
      rating: 5, tags: ["ตรงเวลา", "ขี้เล่น"],
      comment: "เจ้าแม็กซ์พลังเยอะ เล่นกันสนุกมาก นัดเจอง่าย",
    },
  ]);

  // ── Trust: block + report the spam pet ────────────────────────────────────
  console.log("🛡️  Creating block + report...");
  await supabase.from("blocks").insert({
    blocker_pet_id: mochi, blocked_pet_id: spam,
  });
  await supabase.from("reports").insert({
    reporter_pet_id: mochi, reported_pet_id: spam,
    reason: "โปรไฟล์ปลอม / สแปม",
    details: "ส่งข้อความโฆษณาขายของซ้ำ ๆ ไม่เกี่ยวกับสัตว์เลี้ยง",
  });

  // ── Health records ────────────────────────────────────────────────────────
  console.log("💉 Creating health records...");
  await supabase.from("health_records").insert([
    // เจ้าโมจิ — rabies within 12mo keeps the "ฉีดวัคซีนแล้ว" badge on
    {
      pet_id: mochi, type: "vaccine", title: "วัคซีนพิษสุนัขบ้า",
      record_date: isoDate(daysFromNow(-90)), next_due_date: isoDate(daysFromNow(275)),
      notes: "เข็มประจำปี ที่ รพ.สัตว์ทองหล่อ",
    },
    // Due soon (+5 days) → "ใกล้ถึงกำหนด" + amber CareDueBadge on the ดูแล tab
    {
      pet_id: mochi, type: "vaccine", title: "วัคซีนรวม 5 โรค",
      record_date: isoDate(daysFromNow(-360)), next_due_date: isoDate(daysFromNow(5)),
      notes: "ใกล้ครบกำหนดเข็มถัดไป",
    },
    {
      pet_id: mochi, type: "deworm", title: "ถ่ายพยาธิ",
      record_date: isoDate(daysFromNow(-30)), next_due_date: isoDate(daysFromNow(60)),
      notes: "ยาถ่ายพยาธิแบบเม็ด",
    },
    {
      pet_id: mochi, type: "checkup", title: "ตรวจสุขภาพประจำปี",
      record_date: isoDate(daysFromNow(-14)), next_due_date: null,
      notes: "สุขภาพแข็งแรงดี น้ำหนัก 28 กก.",
    },
    // น้องนุ่น
    {
      pet_id: noon, type: "vaccine", title: "วัคซีนพิษสุนัขบ้า",
      record_date: isoDate(daysFromNow(-120)), next_due_date: isoDate(daysFromNow(245)),
      notes: null,
    },
    {
      pet_id: noon, type: "checkup", title: "ตรวจสุขภาพ + ทำหมัน",
      record_date: isoDate(daysFromNow(-200)), next_due_date: null,
      notes: "ทำหมันเรียบร้อย พักฟื้นดี",
    },
  ]);

  // ── Lost pets ─────────────────────────────────────────────────────────────
  console.log("🔎 Creating lost-pet posts + sightings...");
  const { data: lost1 } = await supabase.from("lost_pets").insert({
    reporter_id: demoId, pet_name: "เจ้าข้าวตัง", species: "dog", breed: "ชิบะ อินุ",
    photos: [dogPhoto(61), dogPhoto(62)],
    last_seen_province: "กรุงเทพมหานคร", last_seen_district: "จตุจักร",
    last_seen_detail: "หลุดจากบ้านแถวตลาดนัดจตุจักร ช่วงเย็น",
    lost_date: isoDate(daysFromNow(-3)),
    distinguishing_marks: "ขนสีน้ำตาลทอง ใส่ปลอกคอสีแดง มีจุดขาวที่อก",
    contact: "08x-xxx-xxxx", reward: "มีรางวัลสำหรับผู้พบเห็น 3,000 บาท",
    status: "lost",
  }).select("id").single();
  await supabase.from("lost_pets").insert({
    reporter_id: demoId, pet_name: "น้องส้ม", species: "cat", breed: "ส้มลายสลิด",
    photos: [catPhoto(63), catPhoto(64)],
    last_seen_province: "กรุงเทพมหานคร", last_seen_district: "ห้วยขวาง",
    last_seen_detail: "พบกลับบ้านแล้ว ขอบคุณทุกคนที่ช่วยตามหา 🙏",
    lost_date: isoDate(daysFromNow(-12)),
    distinguishing_marks: "แมวส้มลาย หางยาว",
    contact: "08x-xxx-xxxx", reward: null,
    status: "found",
  });
  if (lost1) {
    await supabase.from("lost_pet_sightings").insert([
      { lost_pet_id: lost1.id, reporter_id: friendsId, detail: "เห็นน้องวิ่งแถวสวนรถไฟเมื่อเช้านี้ค่ะ ดูตกใจ ๆ", seen_at_location: "สวนวชิรเบญจทัศ ฝั่งประตู 2" },
      { lost_pet_id: lost1.id, reporter_id: friendsId, detail: "เมื่อวานเห็นหมาหน้าตาคล้ายกันแถวตลาด อ.ต.ก.", seen_at_location: "ตลาด อ.ต.ก. จตุจักร" },
    ]);
  }

  // ── Blood donation ────────────────────────────────────────────────────────
  console.log("🩸 Creating blood requests + donors + responses...");
  // เจ้าโมจิ registered as an eligible donor
  await supabase.from("blood_donors").insert({
    pet_id: mochi, blood_type: "DEA 1.1 Pos", weight_kg: 28,
    eligible: true, available: true, last_donation_date: isoDate(daysFromNow(-120)),
  });
  // Counterpart donors (eligible) so requests show matched donors
  await supabase.from("blood_donors").insert([
    { pet_id: tiger, blood_type: "DEA 1.1 Neg", weight_kg: 32, eligible: true, available: true, last_donation_date: null },
    { pet_id: max, blood_type: "DEA 1.1 Pos", weight_kg: 14, eligible: true, available: true, last_donation_date: isoDate(daysFromNow(-200)) },
  ]);
  // Demo posts an urgent open request + a fulfilled one
  const { data: req1 } = await supabase.from("blood_requests").insert({
    requester_id: demoId, species: "dog", blood_type_needed: "DEA 1.1 Neg",
    urgency: "urgent", hospital_name: "โรงพยาบาลสัตว์ทองหล่อ", province: "กรุงเทพมหานคร",
    details: "สุนัขประสบอุบัติเหตุ ต้องการเลือดด่วนภายใน 24 ชม.", contact: "08x-xxx-xxxx",
    status: "open",
  }).select("id").single();
  await supabase.from("blood_requests").insert({
    requester_id: demoId, species: "cat", blood_type_needed: "A",
    urgency: "normal", hospital_name: "โรงพยาบาลสัตว์เกษตร", province: "กรุงเทพมหานคร",
    details: "ต้องการเลือดสำหรับแมวผ่าตัด นัดล่วงหน้าได้", contact: "08x-xxx-xxxx",
    status: "fulfilled",
  });
  // Donors respond to the urgent request
  if (req1) {
    await supabase.from("blood_responses").insert([
      { request_id: req1.id, donor_pet_id: tiger, message: "ไทเกอร์พร้อมบริจาคครับ เลือดตรงกลุ่มพอดี ติดต่อกลับได้เลย" },
      { request_id: req1.id, donor_pet_id: max, message: "ยินดีช่วยครับ สะดวกพรุ่งนี้เช้า" },
    ]);
  }

  // ── Vet bookings ──────────────────────────────────────────────────────────
  console.log("🩺 Creating vet bookings...");
  await supabase.from("vet_bookings").insert([
    // Upcoming soon → waiting-room countdown
    { user_id: demoId, vet_id: "vet-002", slot_time: hoursFromNow(3).toISOString(), topic: "ปรึกษาเรื่องอาหารและโภชนาการของเจ้าโมจิ", status: "upcoming" },
    // Upcoming later
    { user_id: demoId, vet_id: "vet-005", slot_time: daysFromNow(2).toISOString(), topic: "ตรวจติดตามอาการเบื้องต้น", status: "upcoming" },
    // Cancelled
    { user_id: demoId, vet_id: "vet-001", slot_time: daysFromNow(1).toISOString(), topic: "สอบถามเรื่องวัคซีน", status: "cancelled" },
    // Past
    { user_id: demoId, vet_id: "vet-003", slot_time: daysFromNow(-4).toISOString(), topic: "ปรึกษาอาการผิวหนังของน้องนุ่น", status: "upcoming" },
  ]);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n🎉 Full-option demo seed complete!");
  console.log("─────────────────────────────────────────────");
  console.log(`  Login:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log("─────────────────────────────────────────────");
  console.log("  Demo pets: เจ้าโมจิ (dog), น้องนุ่น (cat)");
  console.log("  3 matches + chat, 2 playdate proposals, 2 reviews");
  console.log("  1 block + 1 report, 6 health records");
  console.log("  2 lost-pet posts (lost + found) + 2 sightings");
  console.log("  2 blood requests + 3 donors + 2 responses");
  console.log("  4 vet bookings, 2 deck candidates (swipe → instant match)");
  console.log("  To remove: delete both users from Supabase Auth dashboard.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
