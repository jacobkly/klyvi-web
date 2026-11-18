/**
 * Response headers for every page, applied from next.config.ts.
 *
 * script-src keeps 'unsafe-inline' because Next's bootstrap scripts are inline.
 * A nonce would remove the need, but it forces every page to render dynamically
 * and gives up the caching the public pages rely on. So a script that got in
 * could still run, and connect-src is what stops it sending data anywhere other
 * than this site, the API and Supabase.
 */

const TMDB_IMAGES = "https://image.tmdb.org";
const YOUTUBE_PLAYER = "https://www.youtube-nocookie.com";

/** A CSP source with a path only matches that path, so keep just the origin. */
function origin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function securityHeaders({
  apiUrl,
  supabaseUrl,
  dev,
}: {
  apiUrl: string;
  supabaseUrl: string;
  dev: boolean;
}): { key: string; value: string }[] {
  const api = origin(apiUrl);
  const supabase = origin(supabaseUrl);

  const sources = (...values: (string | null | false)[]) =>
    values.filter(Boolean).join(" ");

  const csp = [
    "default-src 'self'",
    `script-src ${sources("'self'", "'unsafe-inline'", dev && "'unsafe-eval'")}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${sources("'self'", TMDB_IMAGES, supabase)}`,
    "font-src 'self'",
    `connect-src ${sources("'self'", api, supabase, dev && "ws:")}`,
    // Only the trailer dialog frames anything.
    `frame-src ${YOUTUBE_PLAYER}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");

  return [
    { key: "Content-Security-Policy", value: csp },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
    },
  ];
}
