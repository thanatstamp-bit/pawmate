import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Protected areas + login (so the session cookie stays fresh there too)
  matcher: ["/app/:path*", "/onboarding/:path*", "/login"],
};
