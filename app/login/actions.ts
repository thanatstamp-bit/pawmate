"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Signs in with the fixed demo account. Runs on the server because
// DEMO_EMAIL / DEMO_PASSWORD are server-only env vars.
export async function demoLogin(): Promise<{ error: string } | never> {
  const email = process.env.DEMO_EMAIL;
  const password = process.env.DEMO_PASSWORD;

  if (!email || !password) {
    return { error: "ยังไม่ได้ตั้งค่าบัญชี Demo (DEMO_EMAIL / DEMO_PASSWORD)" };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "เข้าโหมด Demo ไม่สำเร็จ ลองใหม่อีกครั้งนะ" };
  }

  // Ensure the demo account has a profiles row (not created by normal signup flow)
  if (data.user) {
    await supabase.from("profiles").upsert(
      { id: data.user.id, display_name: "Demo User" },
      { onConflict: "id", ignoreDuplicates: true }
    );
  }

  // Route by whether the demo account already has a pet
  // (limit(1) before maybeSingle() — the demo account can have multiple
  // pets, and a bare maybeSingle() errors on >1 rows, silently looking
  // like "no pet" and bouncing back to onboarding)
  const { data: pet } = await supabase
    .from("pets")
    .select("id")
    .eq("owner_id", data.user!.id)
    .limit(1)
    .maybeSingle();

  redirect(pet ? "/app/swipe" : "/onboarding");
}
