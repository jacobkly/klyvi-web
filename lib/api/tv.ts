import { apiFetch } from './client';
import type { ApiTVSeries, ApiTVSeason, TmdbListResponse } from './types';

/**
 * GET /v1/tv/{id}?type=external|internal[&season_num=N]
 * When `seasonNum` is omitted, returns the full series. When set, returns
 * the season detail.
 */
export function getTVSeries(
  id: number | string,
  opts: { type?: 'external' | 'internal' } = {}
): Promise<ApiTVSeries | null> {
  const type = opts.type ?? 'external';
  return apiFetch<ApiTVSeries | null>(`/v1/tv/${id}?type=${type}`, { allow404: true });
}

export function getTVSeason(
  id: number | string,
  seasonNumber: number,
  opts: { type?: 'external' | 'internal' } = {}
): Promise<ApiTVSeason | null> {
  const type = opts.type ?? 'external';
  return apiFetch<ApiTVSeason | null>(
    `/v1/tv/${id}?type=${type}&season_num=${seasonNumber}`,
    { allow404: true }
  );
}

export function getTVList(
  type: 'trending' | 'upcoming' | 'popular' | 'top_rated',
  opts: { revalidate?: number } = {}
): Promise<TmdbListResponse> {
  return apiFetch<TmdbListResponse>(`/v1/tv/?type=${type}`, {
    raw: true,
    next: opts.revalidate ? { revalidate: opts.revalidate } : undefined,
  });
}
