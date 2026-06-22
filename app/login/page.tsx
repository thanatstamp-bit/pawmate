import { Suspense } from "react";
import { PawPrint } from "lucide-react";
import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 flex flex-col items-center gap-3">
          <span className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-gradient-logo shadow-cta">
            <PawPrint size={40} className="text-white" fill="currentColor" />
          </span>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-title text-ink">PawMate</h1>
            <p className="mt-0.5 text-sm text-ink-2">หาเพื่อน หาคู่ ให้เจ้าตัวน้อยของคุณ</p>
          </div>
        </div>
        <Suspense>
          <AuthForm />
        </Suspense>
      </div>
    </main>
  );
}
