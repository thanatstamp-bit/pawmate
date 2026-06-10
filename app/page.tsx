import { PawPrint } from "lucide-react";

// Placeholder landing page — the real landing page is built in Phase 5
export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-coral text-white">
        <PawPrint size={40} />
      </div>
      <h1 className="text-3xl font-bold">PawMate</h1>
      <p className="text-brown-muted">
        หาเพื่อน หาคู่ ให้เจ้าตัวน้อยของคุณ — เร็วๆ นี้
      </p>
    </main>
  );
}
