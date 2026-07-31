import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env, supabaseConfigured } from "@/lib/env";

/**
 * Next 16 proxy (the middleware rename). Two jobs:
 *
 * 1. Run Supabase's session refresh on every matched request so auth cookies
 *    never go stale (the @supabase/ssr contract: getUser() must be called).
 * 2. Route gating, added with the auth vertical: signed-out users hitting a
 *    protected prefix bounce to /signin?next=<path>; signed-in users hitting
 *    an auth screen or the marketing root land on /home.
 *
 * Unconfigured Supabase skips everything so the public catalog stays
 * browsable in a bare checkout.
 */
export async function proxy(request: NextRequest) {
  if (!supabaseConfigured) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // getUser() both refreshes the token and answers who this is.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`)
  );
  const isAuthScreen = AUTH_SCREENS.some(
    (p) => path === p || path.startsWith(`${p}/`)
  );

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.search = "";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // Signed-in users skip the marketing root and the auth screens, except
  // /reset-password, which doubles as the signed-in change-password form
  // (the recovery link produces exactly that state).
  if (user && (path === "/" || isAuthScreen)) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

const PROTECTED_PREFIXES = [
  "/home",
  "/find",
  "/library",
  "/profile",
  "/settings",
  "/notifications",
  "/onboarding",
];

const AUTH_SCREENS = ["/signin", "/signup"];

export const config = {
  // Skip static assets and images; everything else refreshes the session.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
