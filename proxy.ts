import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env, supabaseConfigured } from "@/lib/env";
import { AUTH_SCREENS, PROTECTED_PREFIXES } from "@/lib/gated-routes";

/**
 * Next 16 proxy (the middleware rename). Two jobs:
 *
 * 1. Refresh the Supabase session before a gated page renders, so its auth
 *    cookies never go stale. getClaims() refreshes an expired session and
 *    then checks the JWT locally against the cached signing keys, so a
 *    fresh session costs no Auth server round trip.
 * 2. Route gating: signed-out users hitting a protected prefix bounce to
 *    /signin?next=<path>; signed-in users hitting an auth screen or the
 *    marketing root land on /home.
 *
 * It runs only on the routes it gates (see config.matcher). Public pages
 * skip it, and the browser client keeps the session fresh there.
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

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`)
  );
  const isAuthScreen = AUTH_SCREENS.some(
    (p) => path === p || path.startsWith(`${p}/`)
  );

  if (!signedIn && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.search = "";
    // The whole place, query included, so a filtered view survives sign-in.
    url.searchParams.set("next", path + request.nextUrl.search);
    return redirect(url, response);
  }

  // Signed-in users skip the marketing root and the auth screens, except
  // /reset-password, which doubles as the signed-in change-password form
  // (the recovery link produces exactly that state).
  if (signedIn && (path === "/" || isAuthScreen)) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    url.search = "";
    return redirect(url, response);
  }

  return response;
}

/**
 * Redirects while keeping any cookies a session refresh just wrote. Refresh
 * tokens are single use, so dropping them would leave the browser holding a
 * spent one.
 */
function redirect(url: URL, refreshed: NextResponse) {
  const res = NextResponse.redirect(url);
  refreshed.cookies.getAll().forEach((c) => res.cookies.set(c));
  return res;
}

export const config = {
  // The gated routes above, as literals: Next reads the matcher at build
  // time and cannot follow the arrays. `:path*` covers the bare prefix too.
  matcher: [
    "/",
    "/home/:path*",
    "/find/:path*",
    "/library/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/notifications/:path*",
    "/onboarding/:path*",
    "/signin/:path*",
    "/signup/:path*",
    // Refreshed but not gated: the admin page answers outsiders with its 404.
    "/admin/:path*",
  ],
};
