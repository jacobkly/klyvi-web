/**
 * TMDB artwork for next/image. The URL names no real size: the custom loader
 * (lib/tmdb-image-loader.ts) swaps in the TMDB size each srcset width needs,
 * so the browser fetches straight from image.tmdb.org.
 *
 * A plain <img> skips the loader, so it keeps a sized URL of its own.
 */

export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/";

/** Widths TMDB serves for posters and backdrops alike, smallest first. */
export const TMDB_WIDTHS = [92, 154, 185, 300, 342, 500, 780, 1280];

export function tmdbImage(path: string): string;
export function tmdbImage(path: string | null | undefined): string | null;
export function tmdbImage(path: string | null | undefined): string | null {
  return path ? `${TMDB_IMAGE_BASE}original${path}` : null;
}
