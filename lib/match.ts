import { SupabaseClient } from "@supabase/supabase-js";

// Checks whether a mutual like exists in both directions for the same mode.
// If yes, inserts a match row and returns the new match id.
// The caller is responsible for inserting the originating like first.
export async function checkAndCreateMatch(
  supabase: SupabaseClient,
  fromPetId: string,
  toPetId: string,
  mode: "playdate" | "breeding"
): Promise<string | null> {
  // Look for the reverse like (to → from) in the same mode
  const { data: reverseLike } = await supabase
    .from("likes")
    .select("id")
    .eq("from_pet_id", toPetId)
    .eq("to_pet_id", fromPetId)
    .eq("mode", mode)
    .maybeSingle();

  if (!reverseLike) return null;

  // Mutual like confirmed — create the match.
  // Store pet_a / pet_b in a consistent order to satisfy the unique constraint.
  const [petA, petB] = [fromPetId, toPetId].sort();

  const { data: match, error } = await supabase
    .from("matches")
    .insert({ pet_a_id: petA, pet_b_id: petB, mode })
    .select("id")
    .single();

  if (error) {
    // unique violation = match already exists (race condition), not a real error
    if (error.code === "23505") return null;
    console.error("match insert error", error);
    return null;
  }

  return match.id;
}
