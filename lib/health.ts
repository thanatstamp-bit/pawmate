import type { SupabaseClient } from "@supabase/supabase-js";

// Recompute pets.vaccinated after any health_record change for this pet.
// Returns true if the badge just flipped on (was false/null → now true).
export async function syncVaccinatedBadge(
  supabase: SupabaseClient,
  petId: string
): Promise<boolean> {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
  const cutoff = twelveMonthsAgo.toISOString().slice(0, 10);

  const { count } = await supabase
    .from("health_records")
    .select("id", { count: "exact", head: true })
    .eq("pet_id", petId)
    .eq("type", "vaccine")
    .ilike("title", "%พิษสุนัขบ้า%")
    .gte("record_date", cutoff);

  const hasRabies = (count ?? 0) > 0;

  const { data: pet } = await supabase
    .from("pets")
    .select("vaccinated")
    .eq("id", petId)
    .maybeSingle();

  const wasVaccinated = pet?.vaccinated ?? false;

  await supabase
    .from("pets")
    .update({ vaccinated: hasRabies })
    .eq("id", petId);

  return !wasVaccinated && hasRabies;
}
