import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { safeNext } from "@/lib/safe-next";
import { getServerSupabase } from "@/lib/supabase/server";

/** The link types Klyvi's email templates send. */
const LINK_TYPES: ReadonlySet<string> = new Set([
  "signup",
  "email",
  "recovery",
  "email_change",
]);

/**
 * Where the links in Klyvi's emails land. They carry a token hash instead of
 * relying on a PKCE verifier, which lives in the browser that asked for the
 * email, so they work when opened on another device.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = safeNext(url.searchParams.get("next"), url.origin);
  const failed = NextResponse.redirect(
    new URL("/signin?error=link", url.origin)
  );

  if (!tokenHash || !type || !LINK_TYPES.has(type)) return failed;

  const sb = await getServerSupabase();
  if (!sb) return failed;

  const { error } = await sb.auth.verifyOtp({
    type: type as EmailOtpType,
    token_hash: tokenHash,
  });
  if (error) return failed;

  return NextResponse.redirect(new URL(next, url.origin));
}
