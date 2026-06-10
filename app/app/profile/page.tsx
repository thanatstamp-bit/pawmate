import LogoutButton from "@/components/LogoutButton";

// Placeholder — the full profile page is built in Phase 5.
// The logout button lives here from Phase 1.
export default function ProfilePage() {
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-bold">โปรไฟล์</h1>
      <p className="text-brown-muted">เร็วๆ นี้ — Phase 5</p>
      <LogoutButton />
    </main>
  );
}
