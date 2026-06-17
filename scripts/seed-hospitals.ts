/**
 * Seed script — inserts ~30 vet hospitals/clinics into hospitals.
 *
 * Usage (run from project root):
 *   npx ts-node --project scripts/tsconfig.json scripts/seed-hospitals.ts
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 * Run AFTER 012_hospitals.sql has been applied in the Supabase dashboard.
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

const VAX = "ฉีดวัคซีน";
const SURGERY = "ผ่าตัด";
const NEUTER = "ทำหมัน";
const CHECKUP = "ตรวจสุขภาพ";
const ER = "ห้องฉุกเฉิน";
const MEDICINE = "อายุรกรรม";
const ICU = "ICU";
const DENTAL = "ทันตกรรม";
const PHYSIO = "กายภาพ";
const LAB = "ห้องปฏิบัติการ";
const BLOOD = "ตรวจเลือด";

const HOSPITALS = [
  // ── กรุงเทพมหานคร (12) ──────────────────────────────────────────────────
  { name: "โรงพยาบาลสัตว์กรุงเทพ", province: "กรุงเทพมหานคร", district: "บางรัก", address: "123 ถ.สีลม แขวงสีลม เขตบางรัก กรุงเทพฯ 10500", phone: "02-234-5678", lat: 13.7244, lng: 100.5298, open_24h: true, services: [SURGERY, MEDICINE, ICU] },
  { name: "คลินิกสัตว์เลี้ยงนานา", province: "กรุงเทพมหานคร", district: "พระโขนง", address: "45 ซ.สุขุมวิท 71 แขวงพระโขนง เขตพระโขนง กรุงเทพฯ 10110", phone: "02-381-2233", lat: 13.7196, lng: 100.5853, open_24h: false, services: [VAX, NEUTER, BLOOD] },
  { name: "รพ.สัตว์ลาดพร้าว 71", province: "กรุงเทพมหานคร", district: "ลาดพร้าว", address: "88 ถ.ลาดพร้าว ซ.71 แขวงลาดพร้าว เขตลาดพร้าว กรุงเทพฯ 10230", phone: "02-907-4455", lat: 13.8126, lng: 100.5973, open_24h: true, services: [LAB, DENTAL, PHYSIO] },
  { name: "โรงพยาบาลสัตว์จตุจักร", province: "กรุงเทพมหานคร", district: "จตุจักร", address: "12 ถ.กำแพงเพชร 3 แขวงลาดยาว เขตจตุจักร กรุงเทพฯ 10900", phone: "02-579-8821", lat: 13.8285, lng: 100.5566, open_24h: true, services: [SURGERY, ER, ICU, CHECKUP] },
  { name: "คลินิกรักษ์สัตว์ทองหล่อ", province: "กรุงเทพมหานคร", district: "วัฒนา", address: "9 ซ.ทองหล่อ 10 แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพฯ 10110", phone: "02-185-3399", lat: 13.7320, lng: 100.5797, open_24h: false, services: [VAX, CHECKUP, DENTAL] },
  { name: "โรงพยาบาลสัตว์ปทุมวัน", province: "กรุงเทพมหานคร", district: "ปทุมวัน", address: "199 ถ.พระราม 1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ 10330", phone: "02-251-7744", lat: 13.7466, lng: 100.5331, open_24h: true, services: [MEDICINE, SURGERY, LAB] },
  { name: "คลินิกสัตว์ห้วยขวาง", province: "กรุงเทพมหานคร", district: "ห้วยขวาง", address: "55 ถ.ประชาราษฎร์บำเพ็ญ แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310", phone: "02-693-1122", lat: 13.7765, lng: 100.5780, open_24h: false, services: [VAX, NEUTER, CHECKUP] },
  { name: "โรงพยาบาลสัตว์บางนา", province: "กรุงเทพมหานคร", district: "บางนา", address: "321 ถ.บางนา-ตราด แขวงบางนา เขตบางนา กรุงเทพฯ 10260", phone: "02-398-6677", lat: 13.6685, lng: 100.6051, open_24h: true, services: [ER, ICU, BLOOD] },
  { name: "คลินิกสัตว์ดินแดง", province: "กรุงเทพมหานคร", district: "ดินแดง", address: "77 ถ.ดินแดง แขวงดินแดง เขตดินแดง กรุงเทพฯ 10400", phone: "02-245-9988", lat: 13.7689, lng: 100.5527, open_24h: false, services: [VAX, CHECKUP, PHYSIO] },
  { name: "โรงพยาบาลสัตว์สาทร", province: "กรุงเทพมหานคร", district: "สาทร", address: "168 ถ.นราธิวาสราชนครินทร์ แขวงทุ่งวัดดอน เขตสาทร กรุงเทพฯ 10120", phone: "02-678-2211", lat: 13.7106, lng: 100.5288, open_24h: true, services: [SURGERY, DENTAL, LAB] },
  { name: "คลินิกรักสัตว์คลองเตย", province: "กรุงเทพมหานคร", district: "คลองเตย", address: "30 ถ.รัชดาภิเษก แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110", phone: "02-712-4400", lat: 13.7220, lng: 100.5660, open_24h: false, services: [VAX, NEUTER, BLOOD] },
  { name: "โรงพยาบาลสัตว์บางกะปิ", province: "กรุงเทพมหานคร", district: "บางกะปิ", address: "210 ถ.ลาดพร้าว แขวงบางกะปิ เขตบางกะปิ กรุงเทพฯ 10240", phone: "02-731-5566", lat: 13.7656, lng: 100.6478, open_24h: true, services: [MEDICINE, ER, CHECKUP] },

  // ── เชียงใหม่ (6) ────────────────────────────────────────────────────────
  { name: "โรงพยาบาลสัตว์เชียงใหม่", province: "เชียงใหม่", district: "เมืองเชียงใหม่", address: "55 ถ.นิมมานเหมินท์ ต.สุเทพ อ.เมืองเชียงใหม่ เชียงใหม่ 50200", phone: "053-221-456", lat: 18.7964, lng: 98.9692, open_24h: true, services: [SURGERY, ER, ICU] },
  { name: "คลินิกสัตว์เลี้ยงนิมมาน", province: "เชียงใหม่", district: "เมืองเชียงใหม่", address: "12 ถ.นิมมานเหมินท์ ซ.9 ต.สุเทพ อ.เมืองเชียงใหม่ เชียงใหม่ 50200", phone: "053-895-321", lat: 18.7990, lng: 98.9670, open_24h: false, services: [VAX, CHECKUP, DENTAL] },
  { name: "รพ.สัตว์สันทราย", province: "เชียงใหม่", district: "สันทราย", address: "88 ถ.เชียงใหม่-พร้าว ต.สันทรายหลวง อ.สันทราย เชียงใหม่ 50210", phone: "053-491-877", lat: 18.8460, lng: 99.0337, open_24h: false, services: [VAX, NEUTER, CHECKUP] },
  { name: "คลินิกรักษ์สัตว์หางดง", province: "เชียงใหม่", district: "หางดง", address: "21 ถ.เชียงใหม่-หางดง ต.หางดง อ.หางดง เชียงใหม่ 50230", phone: "053-441-122", lat: 18.7167, lng: 98.9230, open_24h: false, services: [VAX, BLOOD, PHYSIO] },
  { name: "โรงพยาบาลสัตว์แม่ริม", province: "เชียงใหม่", district: "แม่ริม", address: "5 ถ.เชียงใหม่-ฝาง ต.แม่ริม อ.แม่ริม เชียงใหม่ 50180", phone: "053-299-654", lat: 18.9080, lng: 98.9486, open_24h: true, services: [SURGERY, MEDICINE, LAB] },
  { name: "คลินิกสัตว์สารภี", province: "เชียงใหม่", district: "สารภี", address: "67 ถ.เชียงใหม่-ลำพูน ต.สารภี อ.สารภี เชียงใหม่ 50140", phone: "053-321-998", lat: 18.7180, lng: 99.0470, open_24h: false, services: [VAX, NEUTER, DENTAL] },

  // ── ภูเก็ต (5) ───────────────────────────────────────────────────────────
  { name: "โรงพยาบาลสัตว์ภูเก็ต", province: "ภูเก็ต", district: "เมืองภูเก็ต", address: "99 ถ.เจ้าฟ้า ต.ตลาดใหญ่ อ.เมืองภูเก็ต ภูเก็ต 83000", phone: "076-225-678", lat: 7.8833, lng: 98.3899, open_24h: true, services: [SURGERY, ER, ICU] },
  { name: "คลินิกสัตว์เลี้ยงป่าตอง", province: "ภูเก็ต", district: "กะทู้", address: "14 ถ.ราษฎร์อุทิศ 200 ปี ต.ป่าตอง อ.กะทู้ ภูเก็ต 83150", phone: "076-340-211", lat: 7.8965, lng: 98.2965, open_24h: false, services: [VAX, CHECKUP, BLOOD] },
  { name: "รพ.สัตว์ราไวย์", province: "ภูเก็ต", district: "ราไวย์", address: "33 ถ.วิเศษ ต.ราไวย์ อ.เมืองภูเก็ต ภูเก็ต 83130", phone: "076-381-455", lat: 7.7780, lng: 98.3280, open_24h: false, services: [VAX, NEUTER, DENTAL] },
  { name: "คลินิกสัตว์ถลาง", province: "ภูเก็ต", district: "ถลาง", address: "8 ถ.เทพกระษัตรี ต.เทพกระษัตรี อ.ถลาง ภูเก็ต 83110", phone: "076-311-987", lat: 8.0150, lng: 98.3290, open_24h: false, services: [VAX, CHECKUP, PHYSIO] },
  { name: "โรงพยาบาลสัตว์ฉลอง", province: "ภูเก็ต", district: "ฉลอง", address: "21 ถ.เจ้าฟ้าตะวันออก ต.ฉลอง อ.เมืองภูเก็ต ภูเก็ต 83130", phone: "076-381-090", lat: 7.8420, lng: 98.3550, open_24h: true, services: [SURGERY, MEDICINE, LAB] },

  // ── ชลบุรี (4) ───────────────────────────────────────────────────────────
  { name: "โรงพยาบาลสัตว์ชลบุรี", province: "ชลบุรี", district: "เมืองชลบุรี", address: "150 ถ.สุขุมวิท ต.บางปลาสร้อย อ.เมืองชลบุรี ชลบุรี 20000", phone: "038-275-321", lat: 13.3611, lng: 100.9847, open_24h: true, services: [SURGERY, ER, ICU] },
  { name: "คลินิกสัตว์เลี้ยงพัทยา", province: "ชลบุรี", district: "บางละมุง", address: "60 ถ.พัทยาสาย 2 ต.หนองปรือ อ.บางละมุง ชลบุรี 20150", phone: "038-411-654", lat: 12.9236, lng: 100.8825, open_24h: false, services: [VAX, CHECKUP, BLOOD] },
  { name: "รพ.สัตว์ศรีราชา", province: "ชลบุรี", district: "ศรีราชา", address: "25 ถ.สุรศักดิ์ 1 ต.ศรีราชา อ.ศรีราชา ชลบุรี 20110", phone: "038-322-887", lat: 13.1726, lng: 100.9332, open_24h: false, services: [VAX, NEUTER, DENTAL] },
  { name: "คลินิกสัตว์สัตหีบ", province: "ชลบุรี", district: "สัตหีบ", address: "9 ถ.สุขุมวิท ต.สัตหีบ อ.สัตหีบ ชลบุรี 20180", phone: "038-437-119", lat: 12.6500, lng: 100.9050, open_24h: false, services: [VAX, CHECKUP, PHYSIO] },

  // ── ขอนแก่น (3) ──────────────────────────────────────────────────────────
  { name: "โรงพยาบาลสัตว์ขอนแก่น", province: "ขอนแก่น", district: "เมืองขอนแก่น", address: "77 ถ.มิตรภาพ ต.ในเมือง อ.เมืองขอนแก่น ขอนแก่น 40000", phone: "043-225-643", lat: 16.4419, lng: 102.8360, open_24h: true, services: [SURGERY, MEDICINE, ICU] },
  { name: "คลินิกสัตว์เลี้ยงบึงแก่นนคร", province: "ขอนแก่น", district: "เมืองขอนแก่น", address: "18 ถ.รอบบึงแก่นนคร ต.ในเมือง อ.เมืองขอนแก่น ขอนแก่น 40000", phone: "043-322-198", lat: 16.4180, lng: 102.8260, open_24h: false, services: [VAX, NEUTER, BLOOD] },
  { name: "รพ.สัตว์น้ำพอง", province: "ขอนแก่น", district: "น้ำพอง", address: "5 ถ.มิตรภาพ ต.น้ำพอง อ.น้ำพอง ขอนแก่น 40140", phone: "043-441-276", lat: 16.6900, lng: 102.7700, open_24h: false, services: [VAX, CHECKUP, DENTAL] },
];

async function main() {
  console.log(`🐾 Seeding ${HOSPITALS.length} vet hospitals...`);
  const { error } = await supabase.from("hospitals").insert(HOSPITALS);
  if (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
  console.log(`✅ Done! Inserted ${HOSPITALS.length} hospitals.`);
  console.log("   Run again? Hospitals will duplicate — clear the table first if re-running.");
}

main();
