import { Suspense } from "react";
import Link from "next/link";
import { PawPrint } from "lucide-react";
import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-[400px]">
        <Link
          href="/"
          aria-label="กลับไปหน้าแรก"
          className="mb-6 flex flex-col items-center gap-3 rounded-card transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2"
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-gradient-logo shadow-cta">
            <PawPrint size={40} className="text-white" fill="currentColor" />
          </span>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-title text-ink">PawMate</h1>
            <p className="mt-0.5 text-sm text-ink-2">หาเพื่อน หาคู่ ให้เจ้าตัวน้อยของคุณ</p>
          </div>
        </Link>
        <Suspense>
          <AuthForm />
        </Suspense>
      </div>
    </main>
  );
}
