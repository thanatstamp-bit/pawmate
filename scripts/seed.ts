/**
 * Seed script — creates ~45 fake pets and pre-likes pointing at the demo account's pet.
 *
 * Usage:
 *   1. Copy .env.local to this directory or ensure NEXT_PUBLIC_SUPABASE_URL,
 *      NEXT_PUBLIC_SUPABASE_ANON_KEY, DEMO_EMAIL, and SUPABASE_SERVICE_ROLE_KEY are set.
 *   2. npx ts-node --project tsconfig.json scripts/seed.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (secret key) to bypass RLS for bulk inserts.
 * Never commit the service role key to git.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const demoEmail = process.env.DEMO_EMAIL!;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Data ──────────────────────────────────────────────────────────────────────

const DOG_BREEDS = [
  "ชิวาวา", "ปอมเมอเรเนียน", "ชิสุ (Shih Tzu)", "พุดเดิ้ล",
  "ลาบราดอร์ รีทรีฟเวอร์", "โกลเด้น รีทรีฟเวอร์", "บีเกิ้ล",
  "ฝรั่งเศส บูลด็อก", "คอร์กี้", "มาลทีส", "มิกซ์ (ลูกผสม)",
];

const CAT_BREEDS = [
  "วิเชียรมาศ (Siamese)", "เปอร์เซีย", "บริติช ชอร์ตแฮร์",
  "สก็อตติช โฟลด์", "รัสเซียน บลู", "เบงกอล",
  "เรกดอลล์", "มันชกิ้น", "มิกซ์ (ลูกผสม)",
];

const DOG_NAMES = [
  "น้องลาเต้", "เจ้าถุงเงิน", "มะลิ", "น้องโมจิ", "เจ้าปุย",
  "น้องบัตเตอร์", "เจ้าเค้ก", "น้องวาฟเฟิล", "เจ้าคุกกี้", "น้องบราวนี่",
  "เจ้าชาเขียว", "น้องเฮเซล", "เจ้าโกโก้", "น้องท็อฟฟี่", "เจ้าพุดดิ้ง",
  "น้องไอติม", "เจ้าชีส", "น้องน้ำตาล", "เจ้าแคนดี้", "น้องมาร์ชเมลโล่",
  "เจ้าบิสกิต", "น้องนัท", "เจ้าวานิลา", "น้องกาแฟ", "เจ้าโอรีโอ้",
];

const CAT_NAMES = [
  "น้องหมิว", "เจ้าซากุระ", "น้องพีช", "เจ้าฮานะ", "น้องยูกิ",
  "เจ้าโซระ", "น้องคิริ", "เจ้าอาโอะ", "น้องนาชิ", "เจ้าโมโม่",
  "น้องอิจิโกะ", "เจ้าโทฟุ", "น้องดาวิ", "เจ้าพลอย", "น้องแพรว",
  "เจ้ามุก", "น้องไข่มุก", "เจ้าทับทิม", "น้องมรกต", "เจ้าโอปอล",
];

const TAGS = [
  "ขี้เล่น", "ขี้อ้อน", "ใจดี", "ขี้กลัว", "พลังเยอะ",
  "ชอบนอน", "เข้ากับเด็กได้", "ฉลาด", "ซุกซน", "เชื่อฟัง",
];

const PROVINCES_WEIGHTED = [
  ...Array(12).fill("กรุงเทพมหานคร"),
  ...Array(8).fill("เชียงใหม่"),
  "ชลบุรี", "ภูเก็ต", "ขอนแก่น", "นนทบุรี", "ปทุมธานี",
  "สมุทรปราการ", "นครราชสีมา", "เชียงราย",
];

// Placeholder photo URLs — use placedog / placekitten by varying dimensions
function dogPhoto(seed: number): string {
  return `https://placedog.net/400/500?r=${seed}`;
}
function catPhoto(seed: number): string {
  return `https://cataas.com/cat?width=400&height=500&seed=${seed}`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr].sort(() => Math.random() - 0.5);
  return copy.slice(0, n);
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🐾 PawMate seed script starting...\n");

  // Find demo account's pet (if it exists) for pre-likes
  const { data: demoUser } = await supabase.auth.admin.listUsers();
  const demo = demoUser?.users.find((u) => u.email === demoEmail);
  let demoPetId: string | null = null;

  if (demo) {
    const { data: dp } = await supabase
      .from("pets")
      .select("id, species, breed, sex")
      .eq("owner_id", demo.id)
      .maybeSingle();
    if (dp) {
      demoPetId = dp.id;
      console.log(`✅ Found demo pet: ${dp.id} (${dp.species}, ${dp.breed}, ${dp.sex})`);
    } else {
      console.log("⚠️  Demo account has no pet yet — pre-likes will be skipped");
    }
  }

  // Create a seed user to own fake pets (avoids touching real user accounts)
  const seedEmail = `seed-bot-${Date.now()}@pawmate.internal`;
  const { data: seedAuth, error: seedErr } = await supabase.auth.admin.createUser({
    email: seedEmail,
    password: "seed-password-internal",
    email_confirm: true,
  });

  if (seedErr || !seedAuth.user) {
    console.error("Failed to create seed user:", seedErr);
    process.exit(1);
  }

  const seedUserId = seedAuth.user.id;
  await supabase.from("profiles").insert({ id: seedUserId, display_name: "Seed Bot" });
  console.log(`✅ Created seed user: ${seedUserId}\n`);

  const createdPetIds: string[] = [];

  // ── Dogs (25) ──────────────────────────────────────────────────────────────
  console.log("Creating 25 dogs...");
  for (let i = 0; i < 25; i++) {
    const sex = i % 2 === 0 ? "male" : "female";
    const breed = pick(DOG_BREEDS);
    const province = pick(PROVINCES_WEIGHTED);
    const birthYear = randInt(2018, 2024);
    const birthMonth = randInt(1, 12);
    const modes: string[] = Math.random() > 0.3
      ? (Math.random() > 0.4 ? ["playdate", "breeding"] : ["playdate"])
      : ["breeding"];
    const tags = pickN(TAGS, randInt(2, 5));

    const { data: pet, error } = await supabase
      .from("pets")
      .insert({
        owner_id: seedUserId,
        name: DOG_NAMES[i % DOG_NAMES.length],
        species: "dog",
        breed,
        sex,
        birth_month: `${birthYear}-${String(birthMonth).padStart(2, "0")}-01`,
        photos: [dogPhoto(i + 1), dogPhoto(i + 100)],
        personality_tags: tags,
        province,
        district: null,
        modes,
        vaccinated: Math.random() > 0.3 ? true : false,
        neutered: Math.random() > 0.5 ? false : true,
        bio: `${DOG_NAMES[i % DOG_NAMES.length]} เป็นน้องหมาที่${tags.slice(0, 2).join("และ")} อาศัยอยู่แถว${province}`,
      })
      .select("id")
      .single();

    if (error) { console.error(`Dog ${i} error:`, error.message); continue; }
    createdPetIds.push(pet!.id);
    process.stdout.write("🐕 ");
  }
  console.log("\n");

  // ── Cats (20) ──────────────────────────────────────────────────────────────
  console.log("Creating 20 cats...");
  for (let i = 0; i < 20; i++) {
    const sex = i % 2 === 0 ? "female" : "male";
    const breed = pick(CAT_BREEDS);
    const province = pick(PROVINCES_WEIGHTED);
    const birthYear = randInt(2019, 2024);
    const birthMonth = randInt(1, 12);
    const modes: string[] = Math.random() > 0.3
      ? (Math.random() > 0.4 ? ["playdate", "breeding"] : ["playdate"])
      : ["breeding"];
    const tags = pickN(TAGS, randInt(2, 4));

    const { data: pet, error } = await supabase
      .from("pets")
      .insert({
        owner_id: seedUserId,
        name: CAT_NAMES[i % CAT_NAMES.length],
        species: "cat",
        breed,
        sex,
        birth_month: `${birthYear}-${String(birthMonth).padStart(2, "0")}-01`,
        photos: [catPhoto(i + 1), catPhoto(i + 50)],
        personality_tags: tags,
        province,
        district: null,
        modes,
        vaccinated: Math.random() > 0.4 ? true : false,
        neutered: Math.random() > 0.5 ? false : true,
        bio: `${CAT_NAMES[i % CAT_NAMES.length]} เป็นแมวที่${tags.slice(0, 2).join("และ")} อาศัยอยู่แถว${province}`,
      })
      .select("id")
      .single();

    if (error) { console.error(`Cat ${i} error:`, error.message); continue; }
    createdPetIds.push(pet!.id);
    process.stdout.write("🐱 ");
  }
  console.log("\n");

  // ── Breeding-compatible pets for demo ────────────────────────────────────
  if (demo) {
    const { data: dp } = await supabase
      .from("pets")
      .select("id, species, breed, sex, modes")
      .eq("owner_id", demo.id)
      .maybeSingle();

    if (dp && dp.modes?.includes("breeding")) {
      const oppSex = dp.sex === "male" ? "female" : "male";
      const names = dp.species === "dog" ? DOG_NAMES : CAT_NAMES;
      const photoFn = dp.species === "dog" ? dogPhoto : catPhoto;
      console.log(`Creating 8 breeding-compatible pets (${dp.species}, ${dp.breed}, ${oppSex})...`);

      for (let i = 0; i < 8; i++) {
        const province = pick(PROVINCES_WEIGHTED);
        const tags = pickN(TAGS, randInt(2, 4));
        const name = names[(i + 5) % names.length];
        const { data: bp, error } = await supabase
          .from("pets")
          .insert({
            owner_id: seedUserId,
            name,
            species: dp.species,
            breed: dp.breed,
            sex: oppSex,
            birth_month: `${randInt(2019, 2024)}-${String(randInt(1, 12)).padStart(2, "0")}-01`,
            photos: [photoFn(200 + i), photoFn(250 + i)],
            personality_tags: tags,
            province,
            district: null,
            modes: ["playdate", "breeding"],
            vaccinated: true,
            neutered: false,
            bio: `${name} เป็น${dp.species === "dog" ? "น้องหมา" : "แมว"}สายพันธุ์${dp.breed}ที่${tags[0]} อาศัยอยู่แถว${province}`,
          })
          .select("id")
          .single();

        if (error) { console.error(`Breeding pet ${i} error:`, error.message); continue; }
        createdPetIds.push(bp!.id);

        // Pre-like in breeding mode → demo pet
        await supabase.from("likes").insert({
          from_pet_id: bp!.id,
          to_pet_id: dp.id,
          mode: "breeding",
        });
        process.stdout.write("💕 ");
      }
      console.log("\n✅ Breeding pets + pre-likes created!\n");
      demoPetId = dp.id;
    }
  }

  // ── Pre-likes pointing AT demo's pet (playdate) ───────────────────────────
  if (demoPetId && createdPetIds.length > 0) {
    console.log("Creating 10 pre-likes (playdate) → demo pet...");
    const likers = createdPetIds.slice(0, 10);
    for (const fromId of likers) {
      await supabase.from("likes").insert({
        from_pet_id: fromId,
        to_pet_id: demoPetId,
        mode: "playdate",
      }).then(() => {});  // ignore duplicate errors if re-running
      process.stdout.write("❤️  ");
    }
    console.log("\n✅ Pre-likes created — demo user will match instantly when they like back!\n");
  }

  console.log(`\n🎉 Seed complete! Created ${createdPetIds.length} pets.`);
  console.log(`   Seed user ID: ${seedUserId}`);
  console.log("   To clean up seed data, delete the seed user from Supabase Auth dashboard.\n");
}

main().catch(console.error);
