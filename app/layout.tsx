import type { Metadata } from "next";
import { Nunito, IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";

// Nunito handles Latin text and numbers
const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

// IBM Plex Sans Thai handles Thai glyphs (not a variable font, so weights are explicit)
const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-thai",
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
    <html lang="th" className={`${nunito.variable} ${ibmPlexSansThai.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
