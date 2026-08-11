/**
 * Public catalog endpoints (no auth). Plain apiFetch, so these work from
 * server components and the browser alike.
 */

import type { MediaSummary, Ranking } from "@/lib/types";

import { apiFetch } from "./http";
import {
  mapMovie,
  mapRanking,
  mapSearchResults,
  mapTvSeason,
  mapTvSeries,
  type SeasonDetail,
} from "./map";
import type {
  WireCollectionMovie,
  WireMovie,
  WireRanking,
  WireSearchResponse,
  WireTvSeason,
  WireTvSeries,
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
  return [...w]
    .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
    .map((m) => ({
      mediaId: 0,
      mediaType: "movie" as const,
      tmdbId: m.movie_id,
      title: m.name,
      posterPath: m.poster_path,
      year: null,
    }));
}

/**
 * TMDB list passthrough for browse rails and pages. The API pins page 1
 * server-side today; the client sends `page` anyway so pagination lights
 * up the moment the passthrough honors it (contract item, phase 9).
 */
export async function getMovieList(
  type: ListType,
  signal?: AbortSignal,
  page = 1
): Promise<MediaSummary[]> {
  const w = await apiFetch<WireSearchResponse>(
    `/v1/movies/?type=${type}&page=${page}`,
    { signal }
  );
  return mapSearchResults(w, "movie").movies;
}

export async function getTvList(
  type: ListType,
  signal?: AbortSignal,
  page = 1
): Promise<MediaSummary[]> {
  const w = await apiFetch<WireSearchResponse>(
    `/v1/tv/?type=${type}&page=${page}`,
    { signal }
  );
  return mapSearchResults(w, "tv").tv;
}

/** Public Top 100 ranking. `kind` picks the movie or TV list. */
export async function getRankings(
  kind: "movies" | "tv",
  signal?: AbortSignal
): Promise<Ranking[]> {
  const rows = await apiFetch<WireRanking[] | null>(
    `/v1/rankings/${kind}`,
    { signal }
  );
  return (rows ?? []).map(mapRanking);
}

/**
 * "More like this" for a movie. TMDB's own recommendations passthrough, used
 * as the stand-in until Klyvi's keyword/cast similarity ships (see
 * docs/planning/similar-movies-plan.md). Empty on 404 or a cold id.
 */
export async function getMovieRecommendations(
  tmdbId: number,
  signal?: AbortSignal
): Promise<MediaSummary[]> {
  const w = await apiFetch<WireSearchResponse | null>(
    `/v1/movies/${tmdbId}/recommendations`,
    { allow404: true, signal }
  );
  if (!w) return [];
  return mapSearchResults(w, "movie").movies;
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
