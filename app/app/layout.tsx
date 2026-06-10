import BottomNav from "@/components/BottomNav";

// Shell for all authenticated pages (/app/*): centered mobile-width
// column with the bottom navigation. Auth protection is added via
// middleware in Phase 1.
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[480px] pb-20">
      {children}
      <BottomNav />
    </div>
  );
}
