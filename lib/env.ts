/**
 * Centralized env access. Throws on missing required vars in production so
 * the client never silently boots half-configured. In development a missing
 * var logs a warning instead, so the public catalog stays browsable without
 * Supabase set up.
 *
 * IMPORTANT: each NEXT_PUBLIC_* var must be referenced with its literal
 * string key (process.env.NEXT_PUBLIC_API_URL, not process.env[name]) so
 * Next.js's static analyzer inlines it into the browser bundle.
 */

const isProd = process.env.NODE_ENV === "production";

function ensure(
  value: string | undefined,
  name: string,
  fallback?: string
): string {
  if (value && value.trim().length > 0) return value.trim();
  if (fallback !== undefined) return fallback;
  if (isProd) {
    throw new Error(`Missing required env var: ${name}`);
  }
  if (typeof window === "undefined") {
    // eslint-disable-next-line no-console
    console.warn(
      `[env] ${name} is not set. Features that depend on it are disabled.`
    );
  }
  return "";
}

export const env = {
  apiUrl: ensure(
    process.env.NEXT_PUBLIC_API_URL,
    "NEXT_PUBLIC_API_URL",
    "http://localhost:8080"
  ),
  supabaseUrl: ensure(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    "NEXT_PUBLIC_SUPABASE_URL"
  ),
  supabaseAnonKey: ensure(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  ),
};

/** True when Supabase is configured. Gates auth UI gracefully. */
export const supabaseConfigured =
  env.supabaseUrl.length > 0 && env.supabaseAnonKey.length > 0;
