/**
 * Seed script — creates ~600 fake pets (≈300 dogs + ≈300 cats) with FULL coverage
 * of every swipe filter dimension, plus breeding-compatible cohorts and pre-likes
 * pointing at real / demo pets.
 *
 * Usage (run from the project root):
 *   npx ts-node --project scripts/tsconfig.json scripts/seed.ts
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * and DEMO_EMAIL. The service role key bypasses RLS — never commit it to git.
 *
 * WHY THE COVERAGE MATTERS: the swipe filter sheet (components/swipe/FilterSheet.tsx)
 * offers every breed / tag / province from lib/data/*. If the seed pool doesn't span
 * those same values, stacking filters returns an empty deck. So this script imports
 * the SAME canonical arrays the UI uses (single source of truth — no drift) and
 * distributes pets deterministically (round-robin) so every single filter value is
 * densely covered and reasonable 2–3 filter combos still return results.
 *
 * Re-running is safe: it deletes the previous seed-bot pets first (see cleanup pass)
 * so the deck doesn't accumulate. It NEVER touches real accounts or the demo-deck bot.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import { DOG_BREEDS, CAT_BREEDS } from "../lib/data/breeds";
import { PERSONALITY_TAGS } from "../lib/data/tags";
import { PROVINCES } from "../lib/data/provinces";

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
// Breeds, tags and provinces are imported from lib/data/* so they always match
// the filter sheet exactly. Only the name pools live here.

const DOG_NAMES = [
  "น้องลาเต้", "เจ้าถุงเงิน", "มะลิ", "น้องโมจิ", "เจ้าปุย",
  "น้องบัตเตอร์", "เจ้าเค้ก", "น้องวาฟเฟิล", "เจ้าคุกกี้", "น้องบราวนี่",
  "เจ้าชาเขียว", "น้องเฮเซล", "เจ้าโกโก้", "น้องท็อฟฟี่", "เจ้าพุดดิ้ง",
  "น้องไอติม", "เจ้าชีส", "น้องน้ำตาล", "เจ้าแคนดี้", "น้องมาร์ชเมลโล่",
  "เจ้าบิสกิต", "น้องนัท", "เจ้าวานิลา", "น้องกาแฟ", "เจ้าโอรีโอ้",
  "น้องเบเกิล", "เจ้าพาย", "น้องวิปครีม", "เจ้าซินนามอน", "น้องมัฟฟิน",
  "เจ้าโดนัท", "น้องทาร์ต", "เจ้าครัวซองต์", "น้องสโคน", "เจ้าเอแคลร์",
  "น้องมาการง", "เจ้าทรัฟเฟิล", "น้องครีมชีส", "เจ้าพีนัทบัตเตอร์", "น้องเจลลี่",
  "เจ้าฟัดจ์", "น้องบรูเล่", "เจ้าแพนเค้ก", "น้องชูครีม", "เจ้าเมลอน",
  "น้องสตรอเบอร์รี่", "เจ้าบลูเบอร์รี่", "น้องราสเบอร์รี่", "เจ้าแบล็กเคอร์แรนท์", "น้องแอปเปิ้ล",
];

const CAT_NAMES = [
  "น้องหมิว", "เจ้าซากุระ", "น้องพีช", "เจ้าฮานะ", "น้องยูกิ",
  "เจ้าโซระ", "น้องคิริ", "เจ้าอาโอะ", "น้องนาชิ", "เจ้าโมโม่",
  "น้องอิจิโกะ", "เจ้าโทฟุ", "น้องดาวิ", "เจ้าพลอย", "น้องแพรว",
  "เจ้ามุก", "น้องไข่มุก", "เจ้าทับทิม", "น้องมรกต", "เจ้าโอปอล",
  "น้องนิล", "เจ้าเพชร", "น้องบุษย์", "เจ้าแก้วตา", "น้องกามิ",
  "เจ้าอุซากิ", "น้องคิสุ", "เจ้าริน", "น้องมิยะ", "เจ้าอาคิ",
  "น้องฮารุ", "เจ้านัตสึ", "น้องฟุยุ", "เจ้าโรส", "น้องลิลลี่",
  "เจ้าเดซี่", "น้องไอริส", "เจ้าไวโอเล็ต", "น้องออร์คิด", "เจ้าแจสมีน",
  "น้องทิวลิป", "เจ้าลาเวนเดอร์", "น้องดาหลา", "เจ้าชมพู่", "น้องมะปราง",
];

// Major provinces — used only to place the small breeding pre-like cohort in
// plausible big cities (the general pool already covers all 77 provinces).
const MAJOR_PROVINCES = [
  "กรุงเทพมหานคร", "เชียงใหม่", "ชลบุรี", "นนทบุรี", "ปทุมธานี",
  "สมุทรปราการ", "ภูเก็ต", "ขอนแก่น", "นครราชสีมา", "เชียงราย",
];

// The general pool is generated as a full province × breed grid, K pets per cell,
// so EVERY (province, breed) combination is populated. This is what makes the
// swipe filters returnable even when province + breed (+ one more) are stacked.
// Per-species total = 77 provinces × (breeds) × K.  dogs: 77×21×2=3234, cats: 77×15×2=2310.
const K_PER_CELL = 2;

// Placeholder photo URLs — use placedog / cataas by varying dimensions
function dogPhoto(seed: number): string {
  return `https://placedog.net/400/500?r=${seed}`;
}
function catPhoto(seed: number): string {
  return `https://cataas.com/cat?width=400&height=500&seed=${seed}`;
}

function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr].sort(() => Math.random() - 0.5);
  return copy.slice(0, n);
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ── Cohort generation ──────────────────────────────────────────────────────────
// Full province × breed grid (K pets per cell). A running counter `n` drives the
// other attributes round-robin so every tag / age is evenly covered, and the two
// pets in each cell always get opposite sexes (n alternates) — which also gives
// breeding mode a same-breed opposite-sex candidate in every single province.

type PetRow = {
  owner_id: string;
  name: string;
  species: "dog" | "cat";
  breed: string;
  sex: "male" | "female";
  birth_month: string;
  photos: string[];
  personality_tags: string[];
  province: string;
  district: null;
  modes: string[];
  vaccinated: boolean;
  neutered: boolean;
  bio: string;
};

function generateCohort(species: "dog" | "cat", ownerId: string): PetRow[] {
  const breeds = species === "dog" ? DOG_BREEDS : CAT_BREEDS;
  const names = species === "dog" ? DOG_NAMES : CAT_NAMES;
  const photoFn = species === "dog" ? dogPhoto : catPhoto;
  const speciesWord = species === "dog" ? "น้องหมา" : "แมว";
  const thisYear = new Date().getFullYear();

  const rows: PetRow[] = [];
  let n = 0;
  for (const province of PROVINCES) {
    for (const breed of breeds) {
      for (let k = 0; k < K_PER_CELL; k++) {
        // Opposite sexes within each cell → breeding has both-sex coverage too.
        const sex: "male" | "female" = n % 2 === 0 ? "male" : "female";
        const primaryTag = PERSONALITY_TAGS[n % PERSONALITY_TAGS.length];
        // Generous tag count (4–6) so province+breed+tag combos hit more often.
        const extras = pickN(
          PERSONALITY_TAGS.filter((t) => t !== primaryTag),
          randInt(3, 5)
        );
        const tags = Array.from(new Set([primaryTag, ...extras]));

        const ageYears = (n % 10) + 1;                       // ages 1..10 evenly
        const birthYear = thisYear - ageYears;
        const birthMonth = randInt(1, 12);

        // k===0 is always vaccinated → every cell has ≥1 vaccinated pet, so
        // province+breed+vaccinated never comes up empty.
        const vaccinated = k === 0 ? true : n % 3 !== 0;
        const neutered = n % 4 < 2;                           // ~50%, decorrelated from sex

        // Keep both modes dense; sprinkle in single-mode pets for realism.
        const modes =
          n % 9 === 0 ? ["playdate"]
          : n % 13 === 0 ? ["breeding"]
          : ["playdate", "breeding"];

        const name = names[n % names.length];
        rows.push({
          owner_id: ownerId,
          name,
          species,
          breed,
          sex,
          birth_month: `${birthYear}-${String(birthMonth).padStart(2, "0")}-01`,
          photos: [photoFn((n % 900) + 1), photoFn(((n * 7) % 900) + 1000)],
          personality_tags: tags,
          province,
          district: null,
          modes,
          vaccinated,
          neutered,
          bio: `${name} เป็น${speciesWord}สายพันธุ์${breed}ที่${tags.slice(0, 2).join("และ")} อาศัยอยู่แถว${province}`,
        });
        n++;
      }
    }
  }
  return rows;
}

// Insert pets in chunks and return their ids (batched → fast even at thousands).
async function insertPets(rows: PetRow[], label: string): Promise<string[]> {
  const ids: string[] = [];
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { data, error } = await supabase.from("pets").insert(chunk).select("id");
    if (error) { console.error(`${label} insert error:`, error.message); continue; }
    for (const r of data ?? []) ids.push(r.id);
    process.stdout.write(`  …${Math.min(i + CHUNK, rows.length)}/${rows.length}\r`);
  }
  console.log(`  ✅ ${label}: ${ids.length} inserted` + " ".repeat(20));
  return ids;
}

// ── Cleanup ──────────────────────────────────────────────────────────────────
// Delete every previous seed-bot account so the deck doesn't accumulate across
// runs. FK cascade (auth.users → profiles → pets → likes/matches/messages) wipes
// each bot's whole footprint. The `seed-bot-` prefix match guarantees we never
// touch the demo-deck bot (demo-deck@pawmate.internal) or any real account.
async function cleanupOldSeedBots() {
  let removed = 0;
  let page = 1;
  // listUsers is paginated (default 50/page); loop until a short page.
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) { console.error("listUsers error:", error.message); break; }
    const users = data?.users ?? [];
    const stale = users.filter((u) =>
      (u.email ?? "").startsWith("seed-bot-") && (u.email ?? "").endsWith("@pawmate.internal")
    );
    for (const u of stale) {
      const { error: delErr } = await supabase.auth.admin.deleteUser(u.id);
      if (delErr) console.error(`  failed to delete ${u.email}:`, delErr.message);
      else removed++;
    }
    if (users.length < 200) break;
    page++;
  }
  console.log(`🧹 Removed ${removed} old seed-bot account(s) and their pets.\n`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🐾 PawMate seed script starting...\n");

  await cleanupOldSeedBots();

  // Find demo account's pet (if it exists) for pre-likes.
  // Keep the full user list around — also used below to find every real
  // (non-seed-bot) pet that needs a breeding-compatible cohort.
  const { data: usersPage } = await supabase.auth.admin.listUsers({ perPage: 200 });
  const allUsers = usersPage?.users ?? [];
  const demo = allUsers.find((u) => u.email === demoEmail);
  let demoPetId: string | null = null;

  if (demo) {
    // limit(1) before maybeSingle() — the demo account can own multiple
    // pets (multi-pet support); a bare maybeSingle() errors on >1 rows and
    // silently looks like "no pet", skipping pre-likes entirely.
    const { data: dp } = await supabase
      .from("pets")
      .select("id, species, breed, sex")
      .eq("owner_id", demo.id)
      .limit(1)
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

  // ── Generate + batch-insert the full province × breed grid for dogs & cats ───
  const dogRows = generateCohort("dog", seedUserId);
  const catRows = generateCohort("cat", seedUserId);
  console.log(`Creating ${dogRows.length} dogs (77 provinces × ${DOG_BREEDS.length} breeds × ${K_PER_CELL})...`);
  createdPetIds.push(...(await insertPets(dogRows, "dogs")));
  console.log(`Creating ${catRows.length} cats (77 provinces × ${CAT_BREEDS.length} breeds × ${K_PER_CELL})...`);
  createdPetIds.push(...(await insertPets(catRows, "cats")));
  console.log("");

  // ── Breeding-compatible pets for every real pet with breeding mode on ───
  // Breeding mode locks candidates to the user's pet's EXACT breed + opposite sex,
  // so the general round-robin pool only lands that breed in ~20 provinces. To make
  // the province filter usable in breeding mode too, generate one opposite-sex,
  // same-breed candidate in EVERY province (per real/demo breeding pet). The first
  // few also pre-like the pet so the demo still gets instant matches; the rest are
  // plain deck candidates (we don't want dozens of instant matches piling up).
  const realUserIds = new Set(
    allUsers.filter((u) => !u.email?.endsWith("@pawmate.internal")).map((u) => u.id)
  );
  const { data: breedingPets } = await supabase
    .from("pets")
    .select("id, owner_id, species, breed, sex, modes")
    .contains("modes", ["breeding"]);
  const realBreedingPets = (breedingPets ?? []).filter((p) => realUserIds.has(p.owner_id));

  // The grid above already puts a same-breed opposite-sex candidate in every
  // province, so here we only add a few that PRE-LIKE the pet → instant matches
  // for the demo. (No need for full province coverage anymore.)
  const COHORT = 6;
  for (const dp of realBreedingPets) {
    const oppSex = dp.sex === "male" ? "female" : "male";
    const names = dp.species === "dog" ? DOG_NAMES : CAT_NAMES;
    const photoFn = dp.species === "dog" ? dogPhoto : catPhoto;
    console.log(`Creating ${COHORT} breeding pre-like pets for ${dp.id} (${dp.species}, ${dp.breed}, ${oppSex})...`);

    for (let i = 0; i < COHORT; i++) {
      const province = pick(MAJOR_PROVINCES);
      const tags = pickN(PERSONALITY_TAGS, randInt(2, 4));
      const name = names[i % names.length];
      const ageYears = (i % 10) + 1;
      const { data: bp, error } = await supabase
        .from("pets")
        .insert({
          owner_id: seedUserId,
          name,
          species: dp.species,
          breed: dp.breed,
          sex: oppSex,
          birth_month: `${new Date().getFullYear() - ageYears}-${String(randInt(1, 12)).padStart(2, "0")}-01`,
          photos: [photoFn(300 + i), photoFn(500 + i)],
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

      if (error) { console.error(`Breeding pet for ${dp.id} error:`, error.message); continue; }
      createdPetIds.push(bp!.id);
      await supabase.from("likes").insert({
        from_pet_id: bp!.id,
        to_pet_id: dp.id,
        mode: "breeding",
      });
      process.stdout.write("💕 ");
    }
    console.log("");
  }
  if (realBreedingPets.length > 0) {
    console.log("\n✅ Breeding pre-like pets created (province coverage handled by the grid)!\n");
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

  console.log(`\n🎉 Seed complete! Created ${createdPetIds.length} pets with full breed/tag/province coverage.`);
  console.log(`   Seed user ID: ${seedUserId}`);
  console.log("   Re-running this script auto-removes this batch first, so the deck won't pile up.\n");
}

main().catch(console.error);
