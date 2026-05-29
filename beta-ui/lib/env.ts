/**
 * Centralized env access. Throws on missing required vars in production so
 * we never silently boot with a half-configured client.
 *
 * In development a missing var logs a warning but doesn't crash — devs can
 * still poke around the public catalog without Supabase set up.
 *
 * IMPORTANT: Each `NEXT_PUBLIC_*` var must be referenced with its literal
 * string key (`process.env.NEXT_PUBLIC_API_URL`, not `process.env[name]`)
 * so Next.js's static analyzer inlines them into the browser bundle.
 */

const isProd = process.env.NODE_ENV === 'production';

function ensure(value: string | undefined, name: string, fallback?: string): string {
  if (value && value.trim().length > 0) return value;
  if (fallback !== undefined) return fallback;
  if (isProd) {
    throw new Error(`Missing required env var: ${name}`);
  }
  if (typeof window === 'undefined') {
    // eslint-disable-next-line no-console
    console.warn(`[env] ${name} is not set — features that depend on it will be disabled.`);
  }
  return '';
}

export const env = {
  apiUrl: ensure(process.env.NEXT_PUBLIC_API_URL, 'NEXT_PUBLIC_API_URL', 'http://localhost:8080'),
  supabaseUrl: ensure(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: ensure(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ),
};

/** True when Supabase is configured. Used to gate auth UI gracefully. */
export const supabaseConfigured =
  env.supabaseUrl.length > 0 && env.supabaseAnonKey.length > 0;
