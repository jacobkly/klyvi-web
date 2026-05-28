import { apiFetch } from './client';
import type { ApiMovie, TmdbListResponse } from './types';

/** GET /v1/movies/{id}?id_type=tmdb|media — full movie detail. */
export function getMovie(
  id: number | string,
  opts: { idType?: 'tmdb' | 'media'; revalidate?: number } = {}
): Promise<ApiMovie | null> {
  const idType = opts.idType ?? 'tmdb';
  return apiFetch<ApiMovie | null>(`/v1/movies/${id}?id_type=${idType}`, {
    allow404: true,
    next: opts.revalidate ? { revalidate: opts.revalidate } : undefined,
  });
}

/** GET /v1/movies/{id}/recommendations — TMDB passthrough (not Klyvi's reco). */
export function getMovieTmdbRecommendations(id: number | string): Promise<TmdbListResponse> {
  return apiFetch<TmdbListResponse>(`/v1/movies/${id}/recommendations`, { raw: true });
}

/** GET /v1/movies/?type=trending|upcoming|popular|top_rated — TMDB passthrough list. */
export function getMovieList(
  type: 'trending' | 'upcoming' | 'popular' | 'top_rated',
  opts: { revalidate?: number } = {}
): Promise<TmdbListResponse> {
  return apiFetch<TmdbListResponse>(`/v1/movies/?type=${type}`, {
    raw: true,
    next: opts.revalidate ? { revalidate: opts.revalidate } : undefined,
  });
}
