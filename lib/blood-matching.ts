export type DonorRow = {
  id: string;
  pet_id: string;
  blood_type: string;
  weight_kg: number;
  eligible: boolean;
  available: boolean;
  last_donation_date: string | null;
  pets: {
    id: string;
    name: string;
    photos: string[];
    species: string;
    birth_month: string;
    province: string;
    vaccinated: boolean | null;
    owner_id: string;
    profiles: { display_name: string | null } | { display_name: string | null }[];
  };
};

export type MatchResult = {
  exact: DonorRow[];      // blood type matches exactly — same province first
  crossmatch: DonorRow[]; // blood_type = 'unknown' — need crossmatch before donation
};

/**
 * Filter and rank eligible donors for a blood request.
 *
 * Input example → expected output:
 *   request: species='dog', province='กรุงเทพฯ', blood_type_needed='DEA1.1+'
 *   donors: [
 *     { blood_type:'DEA1.1+', province:'กรุงเทพฯ', eligible:true, available:true }  → exact[0]
 *     { blood_type:'DEA1.1+', province:'เชียงใหม่', eligible:true, available:true }  → exact[1]
 *     { blood_type:'unknown',  province:'กรุงเทพฯ', eligible:true, available:true }  → crossmatch[0]
 *     { blood_type:'DEA1.1-', province:'กรุงเทพฯ', eligible:true, available:true }  → excluded (wrong type)
 *     { blood_type:'DEA1.1+', province:'กรุงเทพฯ', eligible:false, available:true } → excluded (not eligible)
 *   ]
 */
export function matchDonors(
  donors: DonorRow[],
  requestProvince: string,
  bloodTypeNeeded: string,
): MatchResult {
  const eligible = donors.filter((d) => d.eligible && d.available);

  const exact: DonorRow[] = [];
  const crossmatch: DonorRow[] = [];

  for (const d of eligible) {
    if (d.blood_type === "unknown") {
      crossmatch.push(d);
    } else if (d.blood_type === bloodTypeNeeded) {
      exact.push(d);
    }
  }

  // Same province floats to top in each group
  const byProvince = (a: DonorRow, b: DonorRow) => {
    const ap = a.pets.province === requestProvince ? 0 : 1;
    const bp = b.pets.province === requestProvince ? 0 : 1;
    return ap - bp;
  };

  return { exact: exact.sort(byProvince), crossmatch: crossmatch.sort(byProvince) };
}

/** Months since last donation (null = never donated). */
export function monthsSinceLastDonation(lastDate: string | null): number | null {
  if (!lastDate) return null;
  const diff = Date.now() - new Date(lastDate + "T00:00:00").getTime();
  return diff / (1000 * 60 * 60 * 24 * 30.44);
}

export type EligibilityCriterion = { label: string; pass: boolean; hint?: string };

/**
 * Evaluate donor eligibility criteria for display as a checklist.
 * indoorOnly is only relevant for cats (asked separately in the UI).
 */
export function evaluateEligibility(
  species: string,
  weightKg: number,
  birthMonth: string,
  vaccinated: boolean | null,
  indoorOnly: boolean,
): { criteria: EligibilityCriterion[]; allPass: boolean } {
  const ageMonths =
    (Date.now() - new Date(birthMonth).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  const ageYears = ageMonths / 12;

  const minWeight = species === "dog" ? 20 : 4;

  const criteria: EligibilityCriterion[] = [
    {
      label: `น้ำหนัก ≥ ${minWeight} กก. (ปัจจุบัน ${weightKg} กก.)`,
      pass: weightKg >= minWeight,
      hint: weightKg < minWeight ? `ต้องหนักอย่างน้อย ${minWeight} กก.` : undefined,
    },
    {
      label: `อายุ 1–7 ปี (ปัจจุบัน ${ageYears.toFixed(1)} ปี)`,
      pass: ageYears >= 1 && ageYears <= 7,
      hint: ageYears < 1 ? "อายุน้อยเกินไป" : ageYears > 7 ? "อายุมากเกินไป" : undefined,
    },
    {
      label: "ฉีดวัคซีนครบแล้ว",
      pass: vaccinated === true,
      hint: vaccinated !== true ? "ต้องมีประวัติวัคซีนครบ" : undefined,
    },
  ];

  if (species === "cat") {
    criteria.push({
      label: "อยู่ในบ้านเท่านั้น (indoor-only)",
      pass: indoorOnly,
      hint: !indoorOnly ? "แมวต้องเป็น indoor-only" : undefined,
    });
  }

  return { criteria, allPass: criteria.every((c) => c.pass) };
}
