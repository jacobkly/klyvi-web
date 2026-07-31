import { NextResponse } from "next/server";

import { getServerSupabase } from "@/lib/supabase/server";

/**
 * PKCE code exchange for every email link Supabase sends (signup
 * confirmation, password recovery) and for OAuth once a provider is enabled.
 * The emailRedirectTo / redirectTo URLs all point here with a ?next= to
 * land on afterwards.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const rawNext = url.searchParams.get("next") ?? "/home";
  // Only ever redirect within the app.
  const next = rawNext.startsWith("/") ? rawNext : "/home";

  if (code) {
    const sb = await getServerSupabase();
    if (sb) {
      const { error } = await sb.auth.exchangeCodeForSession(code);
      if (error) {
        return NextResponse.redirect(
          new URL("/signin?error=link", url.origin)
        );
      }
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
