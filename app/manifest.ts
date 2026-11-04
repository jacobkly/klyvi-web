import type { MetadataRoute } from "next";

/** The dark --background token. A manifest can't read CSS variables. */
const DARK_ROOM = "#09090b";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Klyvi",
    short_name: "Klyvi",
    description: "Know what to watch right now.",
    start_url: "/",
    display: "standalone",
    background_color: DARK_ROOM,
    theme_color: DARK_ROOM,
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
