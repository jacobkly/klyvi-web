import type { MetadataRoute } from "next";

import { getMovieList, getRankings, getTvList } from "@/lib/api/catalog";
import { SITE_URL } from "@/lib/site";

/** Rebuilt daily, when the rankings refresh. */
export const revalidate = 86400;

/**
 * /titles/sitemap.xml: the films and series people are most likely to search
 * for, the two Top 100 lists and this week's trending and popular titles.
 * robots.txt names it beside the main sitemap. A list that fails to load is
 * left out rather than failing the whole file.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settle = async <T,>(p: Promise<T[]>): Promise<T[]> =>
    p.catch(() => [] as T[]);
  const [topFilms, topTv, trending, popular, trendingTv, popularTv] =
    await Promise.all([
      settle(getRankings("movies")),
      settle(getRankings("tv")),
      settle(getMovieList("trending")),
      settle(getMovieList("popular")),
      settle(getTvList("trending")),
      settle(getTvList("popular")),
    ]);

  const paths = new Set<string>();
  for (const t of [...topFilms, ...trending, ...popular]) {
    paths.add(`/movie/${t.tmdbId}`);
  }
  for (const t of [...topTv, ...trendingTv, ...popularTv]) {
    paths.add(`/tv/${t.tmdbId}`);
  }
  return [...paths].map((path) => ({ url: new URL(path, SITE_URL).href }));
}
