/**
 * Public catalog endpoints (no auth). Plain apiFetch, so these work from
 * server components and the browser alike.
 */

import type { MediaSummary } from "@/lib/types";

import { apiFetch } from "./http";
import {
  mapMovie,
  mapSearchResults,
  mapTvSeason,
  mapTvSeries,
  type SeasonDetail,
} from "./map";
import type {
  WireCollectionMovie,
  WireMovie,
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

/** TMDB list passthrough for browse rails. */
export async function getMovieList(
  type: ListType,
  signal?: AbortSignal
): Promise<MediaSummary[]> {
  const w = await apiFetch<WireSearchResponse>(`/v1/movies/?type=${type}`, {
    signal,
  });
  return mapSearchResults(w, "movie").movies;
}

export async function getTvList(
  type: ListType,
  signal?: AbortSignal
): Promise<MediaSummary[]> {
  const w = await apiFetch<WireSearchResponse>(`/v1/tv/?type=${type}`, {
    signal,
  });
  return mapSearchResults(w, "tv").tv;
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
