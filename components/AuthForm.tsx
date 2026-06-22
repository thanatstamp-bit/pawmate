"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { demoLogin } from "@/app/login/actions";
import GoogleLogo from "@/components/icons/GoogleLogo";
import FacebookLogo from "@/components/icons/FacebookLogo";
import { SegmentedControl } from "@/components/ui";

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

// Icon-prefixed input. Children (e.g. a password reveal toggle) render on the right.
function Field({
  icon: Icon,
  children,
  ...props
}: { icon: typeof Mail } & React.InputHTMLAttributes<HTMLInputElement> & { children?: React.ReactNode }) {
  return (
    <div className="relative">
      <Icon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
      <input
        {...props}
        className="w-full rounded-2xl border border-black/10 bg-white py-3 pl-11 pr-11 text-sm text-ink placeholder:text-ink-3 focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30"
      />
      {children}
    </div>
  );
}

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
  const [showPassword, setShowPassword] = useState(false);
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
      <div className="mb-6">
        <SegmentedControl
          tone="coral"
          value={tab}
          onChange={(next) => switchTab(next)}
          segments={[
            { value: "login", label: "เข้าสู่ระบบ" },
            { value: "signup", label: "สมัครสมาชิก" },
          ]}
        />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {tab === "signup" && (
          <Field
            icon={User}
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="ชื่อที่ใช้แสดง เช่น แม่น้องลาเต้"
            maxLength={50}
          />
        )}
        <Field
          icon={Mail}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="อีเมล"
          required
        />
        <Field
          icon={Lock}
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
          required
          minLength={6}
        >
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-3 transition-colors hover:text-ink-2"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </Field>

        {tab === "login" && (
          <label className="flex cursor-pointer select-none items-center gap-2 px-1 text-sm text-ink-2">
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
          <p className="rounded-2xl bg-coral-soft px-4 py-2.5 text-sm text-coral-ink">
            {error}
          </p>
        )}
        {notice && (
          <p className="rounded-2xl bg-teal-soft px-4 py-2.5 text-sm text-teal-ink">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-1 flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-cta font-bold tracking-tight2 text-white shadow-cta transition-transform active:scale-[.98] disabled:opacity-60 disabled:active:scale-100"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {tab === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
        </button>
      </form>

      <div className="my-4 flex items-center gap-3 text-xs text-ink-3">
        <div className="h-px flex-1 bg-line" />
        หรือ
        <div className="h-px flex-1 bg-line" />
      </div>

      {/* Social login — Google + Facebook */}
      <button
        type="button"
        onClick={() => handleOAuth("google")}
        disabled={busy}
        className="mb-3 flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border border-black/10 bg-white font-bold text-ink transition-colors hover:bg-fill-1 disabled:opacity-60"
      >
        <GoogleLogo size={18} />
        เข้าสู่ระบบด้วย Google
      </button>
      <button
        type="button"
        onClick={() => handleOAuth("facebook")}
        disabled={busy}
        className="mb-3 flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border border-black/10 bg-white font-bold text-ink transition-colors hover:bg-fill-1 disabled:opacity-60"
      >
        <FacebookLogo size={18} />
        เข้าสู่ระบบด้วย Facebook
      </button>

      {/* Demo login — the most important button on this page */}
      <button
        type="button"
        onClick={handleDemo}
        disabled={busy}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-teal font-bold text-white shadow-card transition-colors hover:bg-teal-dark disabled:opacity-60"
      >
        {demoPending && <Loader2 size={18} className="animate-spin" />}
        🐾 ลองเล่นโหมด Demo
      </button>
      <p className="mt-2 text-center text-xs text-ink-2">
        ไม่ต้องสมัคร เข้าไปลองปัดการ์ดได้เลย
      </p>
    </div>
  );
}
