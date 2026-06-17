import Link from "next/link";

export default function AppHeader() {
  return (
    <div className="flex items-center gap-2 px-5 py-3">
      <Link href="/app/home" className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="PawMate"
          className="h-9 w-9 object-contain drop-shadow-sm"
        />
        <span className="text-xl font-medium text-brown">PawMate</span>
      </Link>
    </div>
  );
}
