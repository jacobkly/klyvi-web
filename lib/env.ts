/**
 * Centralized env access. Throws on missing required vars in production so
 * we never silently boot with a half-configured client.
 *
 * In development a missing var logs a warning but doesn't crash — devs can
 * still poke around the public catalog without Supabase set up.
 */

const isProd = process.env.NODE_ENV === 'production';

function read(name: string, fallback?: string): string {
  const v = process.env[name];
  if (v && v.trim().length > 0) return v;
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
  apiUrl: read('NEXT_PUBLIC_API_URL', 'http://localhost:8080'),
  supabaseUrl: read('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: read('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
};

/** True when Supabase is configured. Used to gate auth UI gracefully. */
export const supabaseConfigured =
  env.supabaseUrl.length > 0 && env.supabaseAnonKey.length > 0;
