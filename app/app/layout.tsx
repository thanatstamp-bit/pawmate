import BottomNav from "@/components/BottomNav";
import ConditionalAppHeader from "@/components/ConditionalAppHeader";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[480px] pb-20">
      <ConditionalAppHeader />
      {children}
      <BottomNav />
    </div>
  );
}
