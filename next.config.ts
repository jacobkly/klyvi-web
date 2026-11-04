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
    // size it names.
    imageSizes: [92, 154, 185, 300, 342, 500],
    deviceSizes: [780, 1280],
  },
};

export default nextConfig;
