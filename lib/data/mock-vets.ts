export type MockVet = {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  fee: number;
  bio: string;
};

export const MOCK_VETS: MockVet[] = [
  {
    id: "vet-001",
    name: "น.สพ.ธนพล สุขใจ",
    specialty: "สัตวแพทย์ทั่วไป",
    rating: 4.8,
    fee: 350,
    bio: "เชี่ยวชาญโรคทั่วไปในสุนัขและแมว ประสบการณ์กว่า 8 ปี",
  },
  {
    id: "vet-002",
    name: "น.สพ.ญ.มาลี วงศ์ดี",
    specialty: "อายุรกรรม",
    rating: 4.9,
    fee: 450,
    bio: "ผู้เชี่ยวชาญด้านอายุรกรรม โรคระบบย่อยอาหาร และโรคไต",
  },
  {
    id: "vet-003",
    name: "น.สพ.ชาญชัย รักสัตว์",
    specialty: "ศัลยกรรม",
    rating: 4.7,
    fee: 500,
    bio: "ศัลยแพทย์สัตว์เลี้ยง เชี่ยวชาญการผ่าตัดกระดูกและเนื้อเยื่ออ่อน",
  },
  {
    id: "vet-004",
    name: "น.สพ.ญ.สุดารัตน์ พิมพ์ดี",
    specialty: "โรคผิวหนัง",
    rating: 4.6,
    fee: 400,
    bio: "ผู้เชี่ยวชาญด้านผิวหนังสัตว์ อาการภูมิแพ้ และโรคเชื้อรา",
  },
  {
    id: "vet-005",
    name: "น.สพ.ปิยะ มีชัย",
    specialty: "โรคหัวใจ",
    rating: 4.9,
    fee: 600,
    bio: "ผู้เชี่ยวชาญด้านโรคหัวใจและระบบไหลเวียนเลือดในสัตว์เลี้ยง",
  },
];

// 8 time slots matching the wireframe
const BASE_TIMES = ["10:30", "11:00", "11:30", "13:00", "14:00", "15:30", "16:00", "17:00"];

// Deterministic taken slots per vet (indices into BASE_TIMES)
const TAKEN_IDX: Record<string, number[]> = {
  "vet-001": [1, 3],  // 11:00, 13:00
  "vet-002": [0, 2],  // 10:30, 11:30
  "vet-003": [4, 7],  // 14:00, 17:00
  "vet-004": [1, 5],  // 11:00, 15:30
  "vet-005": [2, 6],  // 11:30, 16:00
};

export interface SlotInfo {
  time: string;
  taken: boolean;
  slotDate: Date;
  dayOffset: number;
}

export function getSlotsForDay(vetId: string, dayOffset: number): SlotInfo[] {
  const base = new Date();
  base.setDate(base.getDate() + dayOffset);
  base.setHours(0, 0, 0, 0);

  const takenIdx = TAKEN_IDX[vetId] ?? [];

  return BASE_TIMES.map((t, idx) => {
    const [h, m] = t.split(":").map(Number);
    const slotDate = new Date(base);
    slotDate.setHours(h, m, 0, 0);
    return { time: t, taken: takenIdx.includes(idx), slotDate, dayOffset };
  });
}

export function getNextAvailableSlots(vetId: string, count = 2): SlotInfo[] {
  const now = new Date();
  const results: SlotInfo[] = [];

  for (let dayOffset = 0; dayOffset < 3 && results.length < count; dayOffset++) {
    const slots = getSlotsForDay(vetId, dayOffset).filter(
      (s) => !s.taken && s.slotDate > now
    );
    for (const slot of slots) {
      if (results.length >= count) break;
      results.push(slot);
    }
  }

  return results;
}

const MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

const MONTHS_FULL = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

export function thaiDateShort(date: Date): string {
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

export function thaiDateFull(date: Date): string {
  const year = date.getFullYear() + 543;
  return `${date.getDate()} ${MONTHS_FULL[date.getMonth()]} ${year}`;
}

export function thaiDayLabel(dayOffset: number): string {
  if (dayOffset === 0) return "วันนี้";
  if (dayOffset === 1) return "พรุ่งนี้";
  return "มะรืน";
}
