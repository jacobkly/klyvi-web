import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

const PUBLIC_PATHS = [
  "/",
  "/explore",
  "/explore/top-100-films",
  "/explore/top-100-tv",
  "/privacy",
  "/terms",
  "/copyright",
  "/attribution",
];

/** Public pages only, and no lastModified, because nothing here tracks one. */
export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({ url: new URL(path, SITE_URL).href }));
}
