import type { MetadataRoute } from "next";

import { AUTH_SCREENS, PROTECTED_PREFIXES } from "@/lib/gated-routes";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
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
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
