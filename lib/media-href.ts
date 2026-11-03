import type { MediaSummary } from "@/lib/types";

/**
 * The detail page for a title. A season opens under its series, and a series
 * and a film each open their own page. The ids overlap between films and
 * series, so a series must never be sent to /movie/.
 */
export function mediaHref(
  media: Pick<MediaSummary, "mediaType" | "tmdbId" | "seasonNumber">
): string {
  switch (media.mediaType) {
    case "season":
      return `/tv/${media.tmdbId}/season/${media.seasonNumber ?? 1}`;
    case "tv":
      return `/tv/${media.tmdbId}`;
    default:
      return `/movie/${media.tmdbId}`;
  }
}
