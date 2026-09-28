"use client";

import { TMDB_IMAGE_BASE, TMDB_WIDTHS } from "./tmdb-image";

type LoaderProps = { src: string; width: number; quality?: number };

/**
 * next/image loader for TMDB artwork. It picks the smallest TMDB size that
 * covers the requested width, so images skip the Vercel optimizer (and its
 * quota) and come straight from TMDB's CDN. Anything not on TMDB passes
 * through untouched.
 */
export default function tmdbImageLoader({ src, width }: LoaderProps): string {
  if (!src.startsWith(TMDB_IMAGE_BASE)) return src;

  // The segment after /t/p/ is the size ("original", "w342"), then the path.
  const rest = src.slice(TMDB_IMAGE_BASE.length);
  const path = rest.slice(rest.indexOf("/"));
  const size =
    TMDB_WIDTHS.find((w) => w >= width) ?? TMDB_WIDTHS[TMDB_WIDTHS.length - 1];
  return `${TMDB_IMAGE_BASE}w${size}${path}`;
}
