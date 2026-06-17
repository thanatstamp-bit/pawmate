/**
 * Seed script — inserts ~25 pet-friendly spots into playdate_spots.
 *
 * Usage (run from project root):
 *   npx ts-node --project scripts/tsconfig.json scripts/seed-spots.ts
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 * Run AFTER 008_playdates.sql has been applied in the Supabase dashboard.
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

const SPOTS = [
  // ── กรุงเทพมหานคร — สวนสาธารณะ ─────────────────────────────────────────
  { name: "สวนลุมพินี",             type: "park",   province: "กรุงเทพมหานคร", district: "ปทุมวัน",        address: "ถนนพระราม 4",             description: "สวนกลางเมืองขนาดใหญ่ ทางเดินร่มรื่น เปิดรับสัตว์เลี้ยงใส่สาย" },
  { name: "สวนเบญจกิตติ์",          type: "park",   province: "กรุงเทพมหานคร", district: "คลองเตย",         address: "ถนนรัชดาภิเษก",            description: "สวนริมทะเลสาบ วิวดีมาก เหมาะเดินเล่นยามเช้า" },
  { name: "สวนวชิรเบญจทัศ",         type: "park",   province: "กรุงเทพมหานคร", district: "จตุจักร",         address: "ถนนกำแพงเพชร 3",           description: "สวนขนาดใหญ่ใกล้ตลาดจตุจักร เหมาะออกกำลังกายตอนเช้า" },
  { name: "สวนหลวง ร.9",            type: "park",   province: "กรุงเทพมหานคร", district: "ประเวศ",          address: "ถนนศรีนครินทร์",           description: "พื้นที่สีเขียวกว้างขวาง น้องหมาวิ่งเล่นได้สนุก" },
  { name: "สวนธนบุรีรมย์",          type: "park",   province: "กรุงเทพมหานคร", district: "ธนบุรี",          address: "ถนนรัชดาภิเษก ฝั่งธน",    description: "สวนเงียบสงบฝั่งธนบุรี ไม่แออัด บรรยากาศดี" },
  // ── กรุงเทพมหานคร — คาเฟ่ ───────────────────────────────────────────────
  { name: "Bark & Brew Pet Cafe",    type: "cafe",   province: "กรุงเทพมหานคร", district: "วัฒนา",           address: "ซอยทองหล่อ 10",            description: "คาเฟ่ pet-friendly บรรยากาศอบอุ่น มีน้ำดื่มให้สัตว์เลี้ยงฟรี" },
  { name: "Paws & Coffee",           type: "cafe",   province: "กรุงเทพมหานคร", district: "พระโขนง",         address: "ซอยสุขุมวิท 71",           description: "ร้านกาแฟน่ารัก เปิดรับน้องหมา-แมวทั้งใน-นอก" },
  { name: "The Pet Corner Cafe",     type: "cafe",   province: "กรุงเทพมหานคร", district: "อารีย์",          address: "ซอยอารีย์ 4",              description: "คาเฟ่ย่านอารีย์ มีลานกลางแจ้งสำหรับน้องเล่น" },
  { name: "Hug Cafe Silom",          type: "cafe",   province: "กรุงเทพมหานคร", district: "บางรัก",          address: "ถนนสีลม ซอย 3",           description: "ร้านกาแฟใจกลางสีลม ต้อนรับสัตว์เลี้ยง" },
  { name: "Furry Friends Roastery",  type: "cafe",   province: "กรุงเทพมหานคร", district: "ลาดพร้าว",        address: "ซอยลาดพร้าว 81",          description: "คาเฟ่สายสัตว์เลี้ยง มีขนมสำหรับน้องหมาด้วย" },
  // ── เชียงใหม่ ────────────────────────────────────────────────────────────
  { name: "สวนบวกหาด",              type: "park",   province: "เชียงใหม่",      district: "เมืองเชียงใหม่", address: "ถนนนิมมานเหมินท์",         description: "สวนกลางเมืองเชียงใหม่ ร่มรื่น เย็นสบาย" },
  { name: "อุทยานหลวงราชพฤกษ์",    type: "park",   province: "เชียงใหม่",      district: "หางดง",           address: "ถนนเชียงใหม่–หางดง",       description: "พื้นที่กว้างมาก เหมาะเดินเล่นและถ่ายรูปน้อง" },
  { name: "Nimman Paws Cafe",        type: "cafe",   province: "เชียงใหม่",      district: "สุเทพ",           address: "ถนนนิมมานเหมินท์ ซอย 9",  description: "คาเฟ่สไตล์วินเทจ ต้อนรับน้องหมา-แมว" },
  { name: "Doi Suthep Pet Retreat",  type: "cafe",   province: "เชียงใหม่",      district: "เมืองเชียงใหม่", address: "ถนนห้วยแก้ว",              description: "คาเฟ่วิวดอยสุเทพ อากาศดีมากในช่วงเช้า" },
  { name: "The Woofing Ground",      type: "cafe",   province: "เชียงใหม่",      district: "สันกำแพง",        address: "ถนนสันกำแพง",              description: "คาเฟ่นอกเมือง สนามเปิดโล่งสำหรับน้องวิ่งเล่น" },
  // ── ภูเก็ต ───────────────────────────────────────────────────────────────
  { name: "หาดในหาน",               type: "beach",  province: "ภูเก็ต",         district: "ราไวย์",          address: "หาดในหาน ราไวย์",          description: "หาดสวยงาม สัตว์เลี้ยงเล่นน้ำได้ช่วงเช้า-เย็น" },
  { name: "หาดป่าตอง (โซนเหนือ)",   type: "beach",  province: "ภูเก็ต",         district: "กะทู้",           address: "หาดป่าตอง โซนเหนือ",       description: "หาดทราย เหมาะพาน้องวิ่งเล่น ควรมาช่วงเช้า" },
  { name: "สวนสาธารณะภูเก็ต",       type: "park",   province: "ภูเก็ต",         district: "เมืองภูเก็ต",    address: "ถนนดำรง เมืองภูเก็ต",     description: "สวนเล็กๆ ใจกลางเมือง เหมาะแวะพักระหว่างทาง" },
  { name: "Pawna Coffee Phuket",     type: "cafe",   province: "ภูเก็ต",         district: "เมืองภูเก็ต",    address: "ถนนภูเก็ต",                description: "คาเฟ่ pet-friendly บรรยากาศเกาะ ต้อนรับสัตว์เลี้ยง" },
  // ── ชลบุรี ───────────────────────────────────────────────────────────────
  { name: "หาดจอมเทียน",            type: "beach",  province: "ชลบุรี",         district: "สัตหีบ",          address: "หาดจอมเทียน พัทยา",        description: "หาดยาว เหมาะเดินเล่นกับน้องตอนเช้า-เย็น" },
  { name: "สวนนงนุช",               type: "resort", province: "ชลบุรี",         district: "สัตหีบ",          address: "ถนนสุขุมวิท กม.163",       description: "สวนพฤกษศาสตร์ขนาดใหญ่ รับสัตว์เลี้ยงในบางโซน" },
  { name: "Paws Corner Chonburi",    type: "cafe",   province: "ชลบุรี",         district: "เมืองชลบุรี",    address: "ถนนสุขุมวิท ชลบุรี",       description: "คาเฟ่ pet-friendly ริมถนนสุขุมวิท" },
  // ── ขอนแก่น ──────────────────────────────────────────────────────────────
  { name: "สวนสาธารณะบึงแก่นนคร",  type: "park",   province: "ขอนแก่น",        district: "เมืองขอนแก่น",   address: "ถนนรอบบึงแก่นนคร",         description: "สวนริมบึงน้ำ ทางเดินรอบบึงยาว 3 กม." },
  { name: "Moo Moo Pet Cafe",        type: "cafe",   province: "ขอนแก่น",        district: "เมืองขอนแก่น",   address: "ถนนมิตรภาพ ขอนแก่น",       description: "คาเฟ่สัตว์เลี้ยงอีสาน บรรยากาศชิลล์ ราคาเป็นมิตร" },
];

async function main() {
  console.log(`🐾 Seeding ${SPOTS.length} pet-friendly spots...`);
  const { error } = await supabase.from("playdate_spots").insert(SPOTS);
  if (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
  console.log(`✅ Done! Inserted ${SPOTS.length} spots.`);
  console.log("   Run again? Spots will duplicate — clear the table first if re-running.");
}

main();
