import { apiFetch } from './client';
import type { Scored } from './types';

/**
 * GET /v1/reco/feed — personalized cascade. Each item is already enriched
 * with display fields (Title, PosterPath, ReleaseYear, etc.) and resolved
 * Reasons by the backend.
 */
export function getRecoFeed(token: string): Promise<Scored[]> {
  return apiFetch<Scored[]>('/v1/reco/feed', { token });
}
