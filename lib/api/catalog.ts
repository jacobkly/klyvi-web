/**
 * Public catalog endpoints (no auth). Plain apiFetch, so these work from
 * server components and the browser alike.
 */

import type {
  MediaSummary,
  Ranking,
  SimilarTitle,
  WatchProviders,
} from "@/lib/types";

import { apiFetch } from "./http";
import {
  mapMovie,
  mapRanking,
  mapSearchResults,
  mapSimilar,
  mapTvSeason,
  mapTvSeries,
  mapWatchProviders,
  yearOf,
  type SeasonDetail,
} from "./map";
import type {
  WireCollectionMovie,
  WireFamilyTitle,
  WireMovie,
  WireRanking,
  WireSearchResponse,
  WireSimilar,
  WireTvSeason,
  WireTvSeries,
  WireWatchProviders,
} from "./wire";
import type { MovieDetail, TvDetail } from "@/lib/mock-media";

export type ListType = "trending" | "upcoming" | "popular" | "top_rated";

export async function getMovie(
  tmdbId: number,
  signal?: AbortSignal
): Promise<MovieDetail | null> {
  const w = await apiFetch<WireMovie | null>(
    `/v1/movies/${tmdbId}?id_type=tmdb`,
    { allow404: true, signal }
  );
  return w ? mapMovie(w) : null;
}

export async function getMovieCollection(
  tmdbId: number,
  signal?: AbortSignal
): Promise<MediaSummary[]> {
  const w = await apiFetch<WireCollectionMovie[] | { details?: string } | null>(
    `/v1/movies/${tmdbId}/collection`,
    { allow404: true, signal }
  );
  if (!w || !Array.isArray(w)) return [];
  // The API sends release order. Sorting here as well keeps a stale cache
  // honest: undated films last, then TMDB's own position.
  const time = (d: string | null | undefined) => {
    const t = d ? Date.parse(d) : NaN;
    return Number.isNaN(t) ? Infinity : t;
  };
  return [...w]
    .sort(
      (a, b) =>
        time(a.release_date) - time(b.release_date) ||
        (a.position ?? 99) - (b.position ?? 99)
    )
    .map((m) => ({
      mediaId: 0,
      mediaType: "movie" as const,
      tmdbId: m.movie_id,
      title: m.name,
      posterPath: m.poster_path,
      year: yearOf(m.release_date),
    }));
}

/** The films and series that share a franchise with a title, oldest first.
 *  Empty when it has none or the open data has not reached it yet. */
export async function getFamily(
  kind: "movies" | "tv",
  tmdbId: number,
  signal?: AbortSignal
): Promise<MediaSummary[]> {
  const w = await apiFetch<WireFamilyTitle[] | null>(
    `/v1/${kind}/${tmdbId}/family`,
    { allow404: true, signal }
  );
  return (w ?? []).map((f) => ({
    mediaId: 0,
    mediaType: f.media_type === "tv" ? ("tv" as const) : ("movie" as const),
    tmdbId: f.tmdb_id,
    title: f.title,
    posterPath: f.poster_path,
    year: yearOf(f.release_date),
  }));
}

/** Asks a list to leave anime out. Leaving it out of a page can make the
 *  page short, so a paged list goes by `totalPages`, not by a short page. */
export type AnimeOption = { anime?: boolean };

function animeParam(opts?: AnimeOption): string {
  return opts?.anime === false ? "&anime=false" : "";
}

/** One page of a browse list, and how many pages TMDB has. */
export type ListPage = { items: MediaSummary[]; page: number; totalPages: number };

/** One page of a TMDB list, for a page that keeps loading as you scroll. */
export async function getListPage(
  kind: "movie" | "tv",
  type: ListType,
  page: number,
  opts?: AnimeOption,
  signal?: AbortSignal
): Promise<ListPage> {
  const w = await apiFetch<WireSearchResponse>(
    `/v1/${kind === "movie" ? "movies" : "tv"}/?type=${type}&page=${page}${animeParam(opts)}`,
    { signal }
  );
  const mapped = mapSearchResults(w, kind);
  return {
    items: kind === "movie" ? mapped.movies : mapped.tv,
    page: w.page || page,
    totalPages: w.total_pages || page,
  };
}

/** The first page of a TMDB list, for rails. */
export async function getMovieList(
  type: ListType,
  signal?: AbortSignal,
  page = 1,
  opts?: AnimeOption
): Promise<MediaSummary[]> {
  const w = await apiFetch<WireSearchResponse>(
    `/v1/movies/?type=${type}&page=${page}${animeParam(opts)}`,
    { signal }
  );
  return mapSearchResults(w, "movie").movies;
}

export async function getTvList(
  type: ListType,
  signal?: AbortSignal,
  page = 1,
  opts?: AnimeOption
): Promise<MediaSummary[]> {
  const w = await apiFetch<WireSearchResponse>(
    `/v1/tv/?type=${type}&page=${page}${animeParam(opts)}`,
    { signal }
  );
  return mapSearchResults(w, "tv").tv;
}

/** Titles on one page of a top list. */
export const RANKING_PAGE_SIZE = 100;

/** The last page of a top list, which goes 1,000 deep. */
export const RANKING_MAX_PAGE = 10;

/** One page of a public top list, 100 to a page. `kind` picks the movie or
 *  TV list. Without anime the list is ranked without it. A page shorter
 *  than 100 is the last. */
export async function getRankings(
  kind: "movies" | "tv",
  signal?: AbortSignal,
  opts?: AnimeOption & { page?: number }
): Promise<Ranking[]> {
  const page = opts?.page ?? 1;
  const query = `${page > 1 ? `&page=${page}` : ""}${animeParam(opts)}`;
  const rows = await apiFetch<WireRanking[] | null>(
    `/v1/rankings/${kind}${query ? `?${query.slice(1)}` : ""}`,
    { signal }
  );
  return (rows ?? []).map(mapRanking);
}

/**
 * "More like this" for a movie or series: titles that share its rarest
 * keywords, with those keywords as reasons. The API fills a thin shelf from
 * TMDB's own list, so those titles arrive without reasons. Empty on 404.
 */
export async function getSimilar(
  kind: "movies" | "tv",
  tmdbId: number,
  signal?: AbortSignal
): Promise<SimilarTitle[]> {
  const w = await apiFetch<WireSimilar[] | null>(
    `/v1/${kind}/${tmdbId}/similar`,
    { allow404: true, signal }
  );
  return (w ?? []).map(mapSimilar);
}

/** Where to stream, rent or buy a title in one country. Null when TMDB has
 *  no such title. */
export async function getProviders(
  kind: "movies" | "tv",
  tmdbId: number,
  region: string,
  signal?: AbortSignal
): Promise<WatchProviders | null> {
  const w = await apiFetch<WireWatchProviders | null>(
    `/v1/${kind}/${tmdbId}/providers?region=${encodeURIComponent(region)}`,
    { allow404: true, signal }
  );
  return w ? mapWatchProviders(w) : null;
}

export async function getTvSeries(
  tmdbId: number,
  signal?: AbortSignal
): Promise<TvDetail | null> {
  const w = await apiFetch<WireTvSeries | null>(
    `/v1/tv/${tmdbId}?type=external`,
    { allow404: true, signal }
  );
  return w ? mapTvSeries(w) : null;
}

export async function getTvSeason(
  tmdbId: number,
  seasonNumber: number,
  signal?: AbortSignal
): Promise<SeasonDetail | null> {
  const w = await apiFetch<WireTvSeason | null>(
    `/v1/tv/${tmdbId}?type=external&season_num=${seasonNumber}`,
    { allow404: true, signal }
  );
  return w ? mapTvSeason(w) : null;
}
