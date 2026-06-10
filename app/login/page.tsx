import { PawPrint } from "lucide-react";
import AuthForm from "@/components/AuthForm";

// Login / signup page. The form itself is a client component;
// this wrapper just lays out the centered card on the cream background.
export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-coral text-white">
            <PawPrint size={32} />
          </div>
          <h1 className="text-2xl font-bold">PawMate</h1>
          <p className="text-sm text-brown-muted">
            หาเพื่อน หาคู่ ให้เจ้าตัวน้อยของคุณ
          </p>
        </div>
        <AuthForm />
      </div>
    </main>
  );
}
