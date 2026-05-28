import { apiFetch } from './client';
import type { Scored } from './types';

/**
 * GET /v1/reco/feed — personalized cascade. Each item is already enriched
 * with display fields (Title, PosterPath, ReleaseYear, etc.) and resolved
 * Reasons by the backend. Empty array if the cascade returns no candidates;
 * `Reasons` is null on Tier 0 (cold-start) items.
 */
export async function getRecoFeed(token: string): Promise<Scored[]> {
  const rows = await apiFetch<Scored[] | null>('/v1/reco/feed', { token });
  return rows ?? [];
}
