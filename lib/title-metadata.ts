import type { Metadata } from "next";

import { TMDB_IMAGE_BASE } from "@/lib/tmdb-image";

/** Search engines show about this much of a description. */
const DESCRIPTION_MAX = 160;

/**
 * A title page's description: the overview, cut at a word to fit a search
 * result. TMDB's text is shown as written, only shortened, the same as on the
 * page itself.
 */
export function shareDescription(
  overview: string | null | undefined,
  title: string
): string {
  const text = overview?.trim().replace(/\s+/g, " ");
  if (!text) {
    return `${title} on Klyvi: where to watch it, and what to watch after it.`;
  }
  if (text.length <= DESCRIPTION_MAX) return text;
  const cut = text.slice(0, DESCRIPTION_MAX - 1);
  const atWord = cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,.;:]+$/, "");
  return `${atWord}…`;
}

/**
 * Metadata for a film, series or season page: its own title and description,
 * a canonical link, and the backdrop (or the poster) as the share image. The
 * artwork loads straight from TMDB, as it does on the page, and the site's
 * TMDB notice and logo cover it. With no art, the site's own share image
 * stays.
 */
export function titleMetadata({
  title,
  overview,
  backdropPath,
  posterPath,
  path,
}: {
  title: string;
  overview: string | null | undefined;
  backdropPath: string | null | undefined;
  posterPath: string | null | undefined;
  path: string;
}): Metadata {
  const fullTitle = `${title} · Klyvi`;
  const description = shareDescription(overview, title);
  const image = backdropPath
    ? { url: `${TMDB_IMAGE_BASE}w1280${backdropPath}`, width: 1280, height: 720 }
    : posterPath
      ? { url: `${TMDB_IMAGE_BASE}w780${posterPath}`, width: 780, height: 1170 }
      : null;
  const images = image ? { images: [{ ...image, alt: title }] } : {};

  return {
    title: fullTitle,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: "Klyvi",
      title: fullTitle,
      description,
      url: path,
      ...images,
    },
    twitter: {
      // A poster is tall, so it reads better small than cropped wide.
      card: backdropPath || !posterPath ? "summary_large_image" : "summary",
      title: fullTitle,
      description,
      ...(image ? { images: [image.url] } : {}),
    },
  };
}
