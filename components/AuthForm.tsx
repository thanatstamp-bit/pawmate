"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { demoLogin } from "@/app/login/actions";
import GoogleLogo from "@/components/icons/GoogleLogo";
import FacebookLogo from "@/components/icons/FacebookLogo";

type Tab = "login" | "signup";

// Maps Supabase auth error messages to friendly Thai copy
function thaiAuthError(message: string): string {
  if (message.includes("Invalid login credentials"))
    return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
  if (message.includes("already registered"))
    return "อีเมลนี้ถูกสมัครไว้แล้ว ลองเข้าสู่ระบบแทนนะ";
  if (message.includes("Password should be at least"))
    return "รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร";
  if (message.includes("Email not confirmed"))
    return "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ (เช็คกล่องจดหมายนะ)";
  if (message.includes("valid email")) return "รูปแบบอีเมลไม่ถูกต้อง";
  if (message.toLowerCase().includes("rate limit") || message.toLowerCase().includes("rate_limit"))
    return "ส่งอีเมลบ่อยเกินไป รอสักครู่แล้วลองใหม่ หรือปิด Email Confirmation ใน Supabase Dashboard";
  return "เกิดข้อผิดพลาด ลองใหม่อีกครั้งนะ";
}

// Remembers only the email (never the password) so the login field
// pre-fills on return visits without storing a credential in the browser.
const REMEMBER_EMAIL_KEY = "pawmate_remembered_email";

const inputClass =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm " +
  "placeholder:text-brown-muted/60 focus:border-coral focus:outline-none " +
  "focus:ring-2 focus:ring-coral/30";

export default function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const supabase = createClient();

  const [tab, setTab] = useState<Tab>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const [demoPending, startDemo] = useTransition();

  // Pre-fill the email field from a previous "remember email" choice.
  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
  }, []);

  // Surface a failed OAuth round-trip (the callback route bounces back here
  // with ?error=oauth when the code exchange fails or the user cancels).
  useEffect(() => {
    if (searchParams.get("error") === "oauth") {
      setError("เข้าสู่ระบบด้วยบัญชีโซเชียลไม่สำเร็จ ลองใหม่อีกครั้งนะ");
    }
  }, [searchParams]);

  function switchTab(next: Tab) {
    setTab(next);
    setError(null);
    setNotice(null);
  }

  async function handleLogin() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(thaiAuthError(error.message));
      return;
    }
    // Remember (or forget) the email for next time — never the password.
    if (remember) localStorage.setItem(REMEMBER_EMAIL_KEY, email);
    else localStorage.removeItem(REMEMBER_EMAIL_KEY);
    // Route by whether this account already has a pet profile
    // (limit(1) before maybeSingle() — accounts can own multiple pets,
    // and a bare maybeSingle() errors on >1 rows, silently looking like
    // "no pet" and bouncing the user back into onboarding)
    const { data: pet } = await supabase
      .from("pets")
      .select("id")
      .eq("owner_id", data.user.id)
      .limit(1)
      .maybeSingle();
    router.push(redirectTo ?? (pet ? "/app/swipe" : "/onboarding"));
    router.refresh();
  }

  async function handleSignup() {
    if (!displayName.trim()) {
      setError("กรุณากรอกชื่อที่ใช้แสดง");
      return;
    }
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(thaiAuthError(error.message));
      return;
    }
    // If email confirmation is enabled in Supabase there is no session yet
    if (!data.session || !data.user) {
      setNotice("สมัครสำเร็จ! กรุณายืนยันอีเมลก่อนเข้าสู่ระบบนะ");
      return;
    }
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({ id: data.user.id, display_name: displayName.trim() });
    if (profileError) {
      setError("สร้างโปรไฟล์ไม่สำเร็จ ลองใหม่อีกครั้งนะ");
      return;
    }
    router.push("/onboarding");
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      if (tab === "login") await handleLogin();
      else await handleSignup();
    } finally {
      setLoading(false);
    }
  }

  function handleDemo() {
    setError(null);
    setNotice(null);
    startDemo(async () => {
      const result = await demoLogin();
      if (result?.error) setError(result.error);
    });
  }

  // Social login — redirects to the provider, which returns to /auth/callback
  // (works for both login and signup; OAuth is sign-in-or-up in one step).
  async function handleOAuth(provider: "google" | "facebook") {
    setError(null);
    setNotice(null);
    const next = redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : "";
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback${next}` },
    });
    if (error) setError("เริ่มการเข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้งนะ");
  }

  const busy = loading || demoPending;

  return (
    <div className="rounded-card bg-white p-6 shadow-card">
      {/* Tab switcher */}
      <div className="mb-6 flex rounded-full bg-cream p-1">
        {(
          [
            { key: "login", label: "เข้าสู่ระบบ" },
            { key: "signup", label: "สมัครสมาชิก" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => switchTab(key)}
            className={`flex-1 rounded-full py-2 text-sm font-bold transition-colors ${
              tab === key
                ? "bg-coral text-white"
                : "text-brown-muted hover:text-brown"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {tab === "signup" && (
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="ชื่อที่ใช้แสดง เช่น แม่น้องลาเต้"
            className={inputClass}
            maxLength={50}
          />
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="อีเมล"
          required
          className={inputClass}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
          required
          minLength={6}
          className={inputClass}
        />

        {tab === "login" && (
          <label className="flex cursor-pointer select-none items-center gap-2 px-1 text-sm text-brown-muted">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-black/20 accent-coral"
            />
            จดจำอีเมล
          </label>
        )}

        {error && (
          <p className="rounded-xl bg-coral/10 px-4 py-2 text-sm text-coral-dark">
            {error}
          </p>
        )}
        {notice && (
          <p className="rounded-xl bg-teal/10 px-4 py-2 text-sm text-teal-dark">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-1 flex items-center justify-center gap-2 rounded-full bg-coral py-3 font-bold text-white transition-colors hover:bg-coral-dark disabled:opacity-60"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {tab === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
        </button>
      </form>

      <div className="my-4 flex items-center gap-3 text-xs text-brown-muted">
        <div className="h-px flex-1 bg-black/10" />
        หรือ
        <div className="h-px flex-1 bg-black/10" />
      </div>

      {/* Social login — Google + Facebook */}
      <button
        type="button"
        onClick={() => handleOAuth("google")}
        disabled={busy}
        className="mb-3 flex w-full items-center justify-center gap-2.5 rounded-full border border-black/10 bg-white py-3 font-bold text-brown transition-colors hover:bg-cream disabled:opacity-60"
      >
        <GoogleLogo size={18} />
        เข้าสู่ระบบด้วย Google
      </button>
      <button
        type="button"
        onClick={() => handleOAuth("facebook")}
        disabled={busy}
        className="mb-3 flex w-full items-center justify-center gap-2.5 rounded-full border border-black/10 bg-white py-3 font-bold text-brown transition-colors hover:bg-cream disabled:opacity-60"
      >
        <FacebookLogo size={18} />
        เข้าสู่ระบบด้วย Facebook
      </button>

      {/* Demo login — the most important button on this page */}
      <button
        type="button"
        onClick={handleDemo}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-teal py-3 font-bold text-white transition-colors hover:bg-teal-dark disabled:opacity-60"
      >
        {demoPending && <Loader2 size={18} className="animate-spin" />}
        🐾 ลองเล่นโหมด Demo
      </button>
      <p className="mt-2 text-center text-xs text-brown-muted">
        ไม่ต้องสมัคร เข้าไปลองปัดการ์ดได้เลย
      </p>
    </div>
  );
}
