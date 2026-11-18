import { mediaHref } from "@/lib/media-href";
import type { AppNotification } from "@/lib/types";

/** A "YYYY-MM-DD" as that day on the local calendar, never shifted by zone. */
function localDay(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function shortDate(day: Date, today: Date): string {
  return day.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(day.getFullYear() === today.getFullYear() ? {} : { year: "numeric" }),
  });
}

/** The line under a notice's title, worded for where the date sits from today. */
export function noticeText(
  notice: Pick<AppNotification, "kind" | "seasonNumber" | "eventDate">,
  today: Date = new Date()
): string {
  const day = localDay(notice.eventDate);
  const diff = startOfDay(day) - startOfDay(today);
  const date = shortDate(day, today);

  if (notice.kind === "policy") {
    return diff === 0 ? "Policy update, today" : `Policy update, ${date}`;
  }

  if (notice.kind === "film_release") {
    if (diff === 0) return "Film, out today";
    return diff > 0 ? `Film, comes out ${date}` : `Film, came out ${date}`;
  }

  const season = `Season ${notice.seasonNumber}`;
  if (diff === 0) return `${season} premieres today`;
  return diff > 0 ? `${season} premieres ${date}` : `${season} premiered ${date}`;
}

/**
 * Where a notice opens: the season that premieres, the film, or the page a
 * policy notice names. A policy link that isn't a path on this site falls back
 * to the terms.
 */
export function noticeHref(
  notice: Pick<AppNotification, "kind" | "tmdbId" | "seasonNumber"> &
    Partial<Pick<AppNotification, "link">>
): string {
  if (notice.kind === "policy") {
    const link = notice.link ?? "";
    return link.startsWith("/") && !link.startsWith("//") ? link : "/terms";
  }
  return mediaHref({
    mediaType: notice.kind === "film_release" ? "movie" : "season",
    tmdbId: notice.tmdbId ?? 0,
    seasonNumber: notice.seasonNumber ?? undefined,
  });
}
