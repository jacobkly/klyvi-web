import type { MetadataRoute } from "next";

import { AUTH_SCREENS, PROTECTED_PREFIXES } from "@/lib/gated-routes";
import { SITE_URL } from "@/lib/site";

/** The one host search engines should list. klyvi.net redirects here. */
export const INDEXED_HOST = new URL(SITE_URL).host;

/**
 * robots.txt for the host that asked. Only the main address is open to
 * crawlers. Staging, Vercel preview URLs and local dev get a blanket disallow,
 * so a second copy of the site never ends up in search results.
 */
export function robotsFor(host: string | null): MetadataRoute.Robots {
  const sitemap = `${SITE_URL}/sitemap.xml`;
  if (host?.toLowerCase() !== INDEXED_HOST) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        ...PROTECTED_PREFIXES,
        ...AUTH_SCREENS,
        "/reset-password",
        "/auth",
      ],
    },
    sitemap,
  };
}
