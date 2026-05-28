import { apiFetch } from './client';
import type { TmdbListResponse } from './types';

/**
 * GET /v1/search?type=movie|tv|person|multi&query=...
 * Returns the raw TMDB shape (passthrough). `type=movie` and unset (multi)
 * also write-through to the movies cache server-side.
 */
export function search(
  query: string,
  opts: { type?: 'movie' | 'tv' | 'person' | 'multi' } = {}
): Promise<TmdbListResponse> {
  const type = opts.type ?? 'multi';
  const q = encodeURIComponent(query);
  return apiFetch<TmdbListResponse>(`/v1/search?type=${type}&query=${q}`, { raw: true });
}
