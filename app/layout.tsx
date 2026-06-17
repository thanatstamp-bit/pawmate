import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";

// Prompt covers both Thai and Latin in one family — clean, modern, widely used in Thai apps
const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-prompt",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PawMate — หาเพื่อน หาคู่ ให้เจ้าตัวน้อยของคุณ",
  description:
    "แอปจับคู่สำหรับหมาและแมวในไทย หาเพื่อนเล่นใกล้บ้าน หรือหาคู่ผสมพันธุ์สายพันธุ์เดียวกัน",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={prompt.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
