import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
import { env, supabaseConfigured } from '@/lib/env';

/**
 * Server Supabase client bound to the current request's cookies. Use inside
 * Server Components / Route Handlers / Server Actions. Returns null when
 * Supabase isn't configured.
 */
export async function getServerSupabase(): Promise<SupabaseClient | null> {
  if (!supabaseConfigured) return null;
  const cookieStore = await cookies();
  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component. Safe to
          // ignore if you have middleware refreshing user sessions.
        }
      },
    },
  });
}

/** Returns the current access token (JWT) or null. */
export async function getServerAccessToken(): Promise<string | null> {
  const sb = await getServerSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.access_token ?? null;
}

/** Returns the current Supabase user or null. */
export async function getServerUser() {
  const sb = await getServerSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user;
}
