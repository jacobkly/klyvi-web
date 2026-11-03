import { getTvSeries } from "@/lib/api/catalog";
import { addTracking, listTracking } from "@/lib/api/tracking";

/**
 * "Add to watchlist" on a whole show. The series is what gets recommended,
 * but the season is what gets tracked, so this adds the lowest season the
 * user does not track yet, as Planning.
 *
 * Returns the season it added, or null when every season is already
 * tracked. Pass the season numbers when the caller has them (the series
 * page does) to skip fetching the series. Throws when the series has no
 * seasons to pick from, rather than guessing at season 1.
 */
export async function trackFirstUntrackedSeason(
  tmdbId: number,
  seasonNumbers?: number[]
): Promise<number | null> {
  const [seasons, tracked] = await Promise.all([
    seasonNumbers ??
      getTvSeries(tmdbId).then(
        (tv) => tv?.seasons.map((s) => s.seasonNumber) ?? []
      ),
    listTracking({ mediaType: "season" }),
  ]);
  if (seasons.length === 0) throw new Error(`series ${tmdbId} has no seasons`);

  const have = new Set(
    tracked.filter((e) => e.tmdbId === tmdbId).map((e) => e.seasonNumber)
  );
  const next = [...seasons]
    .sort((a, b) => a - b)
    .find((n) => n >= 1 && !have.has(n));
  if (next == null) return null;

  await addTracking({
    tmdbId,
    mediaType: "season",
    seasonNumber: next,
    status: "planning",
  });
  return next;
}
