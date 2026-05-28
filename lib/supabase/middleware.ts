import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env, supabaseConfigured } from '@/lib/env';

const PROTECTED_PREFIXES = ['/library', '/settings', '/rate'];

/**
 * Session refresh + gentle redirect-to-signin for protected routes.
 *
 * - Runs Supabase's session refresh so cookies don't go stale.
 * - If the user hits a protected route while signed out, bounces to /signin
 *   with `?next=<original>` so we can return them after auth.
 */
export async function updateSession(request: NextRequest) {
  // If Supabase isn't configured, skip everything — let the page render and
  // surface a friendly error inside the route instead of bouncing.
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

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/signin';
    url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }

  return response;
}
