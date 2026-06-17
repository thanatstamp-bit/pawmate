import { Suspense } from "react";
import Image from "next/image";
import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Image src="/logo.png" alt="PawMate" width={96} height={96} className="drop-shadow-md" />
          <p className="text-sm text-brown-muted">
            หาเพื่อน หาคู่ ให้เจ้าตัวน้อยของคุณ
          </p>
        </div>
        <Suspense>
          <AuthForm />
        </Suspense>
      </div>
    </main>
  );
}
