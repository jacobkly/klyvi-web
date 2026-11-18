import type { NextConfig } from "next";

import { securityHeaders } from "./lib/security-headers";

const nextConfig: NextConfig = {
  headers() {
    return Promise.resolve([
      {
        source: "/(.*)",
        headers: securityHeaders({
          apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
          dev: process.env.NODE_ENV === "development",
        }),
      },
    ]);
  },
  images: {
    // All artwork comes from TMDB, which already serves each image at fixed
    // widths. The loader picks one per srcset entry, so there is no
    // optimizer hop. See lib/tmdb-image.ts.
    loader: "custom",
    loaderFile: "./lib/tmdb-image-loader.ts",
    // Both lists are TMDB widths, so every srcset entry maps to exactly the
    // size it names. For a `vw` sizes value Next drops every width below
    // deviceSizes[0] times the smallest vw, so deviceSizes starts at 500:
    // starting at 780 dropped w154 and w185, and a 144px card got w300.
    imageSizes: [92, 154, 185, 300, 342],
    deviceSizes: [500, 780, 1280],
  },
};

export default nextConfig;
