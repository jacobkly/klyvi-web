const FALLBACK = "/home";

/**
 * Turns a `?next=` value into a path on this site, or /home. A plain
 * "starts with /" check lets `//evil.com` and `/\evil.com` through, since
 * browsers read both as another host. So the value is resolved the way the
 * browser would, and only kept if it lands on `origin`.
 */
export function safeNext(raw: string | null | undefined, origin: string): string {
  if (!raw || !raw.startsWith("/")) return FALLBACK;

  let url: URL;
  try {
    url = new URL(raw, origin);
  } catch {
    return FALLBACK;
  }
  if (url.origin !== origin) return FALLBACK;

  // Refuse a path that becomes another host if anything decodes it later.
  let decoded: string;
  try {
    decoded = decodeURIComponent(url.pathname);
  } catch {
    return FALLBACK;
  }
  if (decoded.startsWith("//") || decoded.includes("\\")) return FALLBACK;

  return url.pathname + url.search + url.hash;
}
