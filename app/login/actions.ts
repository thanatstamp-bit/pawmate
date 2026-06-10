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
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "เข้าโหมด Demo ไม่สำเร็จ ลองใหม่อีกครั้งนะ" };
  }

  redirect("/app/swipe");
}
