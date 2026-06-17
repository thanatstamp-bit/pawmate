"use client";

import { usePathname } from "next/navigation";
import AppHeader from "./AppHeader";

// Renders the global logo header on all /app/* pages except /app/chat/*
// (own navigation-style header), /app/swipe (needs max vertical space for
// the card deck — see Swipe Feed Wireframe annotations), and /app/care/*
// (Care Hub + its sub-pages each build their own back-arrow header — see
// Care Hub / Hospital Finder Wireframe annotations).
export default function ConditionalAppHeader() {
  const pathname = usePathname();
  if (pathname.startsWith("/app/chat/")) return null;
  if (pathname.startsWith("/app/swipe")) return null;
  if (pathname.startsWith("/app/care")) return null;
  return <AppHeader />;
}
