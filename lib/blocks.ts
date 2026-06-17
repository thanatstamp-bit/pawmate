import { SupabaseClient } from "@supabase/supabase-js";

// Returns pet IDs blocked relative to myPetId in EITHER direction (pets I blocked,
// or pets that blocked me). The swipe feed and matches list use this to hide those
// pets from each other without ever deleting data — a block is fully reversible.
export async function getBlockedPetIds(
  supabase: SupabaseClient,
  myPetId: string
): Promise<Set<string>> {
  const { data } = await supabase
    .from("blocks")
    .select("blocker_pet_id, blocked_pet_id")
    .or(`blocker_pet_id.eq.${myPetId},blocked_pet_id.eq.${myPetId}`);

  const ids = new Set<string>();
  for (const b of data ?? []) {
    // Add the OTHER pet in each block row (the one that isn't me).
    ids.add(b.blocker_pet_id === myPetId ? b.blocked_pet_id : b.blocker_pet_id);
  }
  return ids;
}
