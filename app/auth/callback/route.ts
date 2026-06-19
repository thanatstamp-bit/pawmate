import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// OAuth code-exchange handler. Providers (Google, ...) redirect here with a
// `?code=` after the user consents; we swap it for a session, make sure the
// account has a profiles row (OAuth users never go through the signup form
// that creates one), then route like the password login does.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // In-app destination passed through from the login form's ?redirect=.
  const next = searchParams.get("next");

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // profiles.display_name is NOT NULL and there is no DB trigger, so we
        // create the row here. ignoreDuplicates keeps an existing name intact.
        const displayName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "เพื่อนใหม่";
        await supabase.from("profiles").upsert(
          { id: user.id, display_name: displayName },
          { onConflict: "id", ignoreDuplicates: true }
        );

        // Route by whether this account already has a pet (limit(1) before
        // maybeSingle() — an account can own multiple pets, and a bare
        // maybeSingle() errors on >1 rows).
        const { data: pet } = await supabase
          .from("pets")
          .select("id")
          .eq("owner_id", user.id)
          .limit(1)
          .maybeSingle();

        const dest = next || (pet ? "/app/swipe" : "/onboarding");
        return NextResponse.redirect(`${origin}${dest}`);
      }
    }
  }

  // Missing code, exchange failed, or user cancelled at the provider.
  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
