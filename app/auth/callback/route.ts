import { NextResponse } from "next/server";

import { safeNext } from "@/lib/safe-next";
import { getServerSupabase } from "@/lib/supabase/server";

/** An account this young was created by the sign-in that brought it here. */
const NEW_ACCOUNT_MS = 60_000;

function isNewAccount(createdAt: string | undefined): boolean {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() < NEW_ACCOUNT_MS;
}

/**
 * PKCE code exchange for Google and Microsoft sign-in and for password reset.
 * Their redirect URLs point here with a ?next= to land on afterwards. A
 * person who signs in without asking for a page goes to onboarding if the
 * sign-in just created their account.
 *
 * Sign-up links in Klyvi's own email templates go to /auth/confirm. Emails
 * sent from Supabase's default templates still come through here.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const failed = (reason: "link" | "provider") =>
    NextResponse.redirect(new URL(`/signin?error=${reason}`, url.origin));

  if (url.searchParams.has("error")) {
    const expired = url.searchParams.get("error_code") === "otp_expired";
    return failed(expired ? "link" : "provider");
  }

  const next = safeNext(url.searchParams.get("next"), url.origin);
  const code = url.searchParams.get("code");
  if (code) {
    const sb = await getServerSupabase();
    if (sb) {
      const { data, error } = await sb.auth.exchangeCodeForSession(code);
      if (error) return failed("link");
      if (next === "/home" && isNewAccount(data.user?.created_at)) {
        return NextResponse.redirect(new URL("/onboarding", url.origin));
      }
    }
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
