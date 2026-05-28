import { apiFetch } from './client';
import type { Scored } from './types';

/**
 * GET /v1/reco/feed — personalized cascade. Each item is enriched server-side
 * with display fields (Title, PosterPath, ReleaseYear, etc.) and resolved
 * Reasons. Tier 0 (cold-start) items now return `Reasons: []`; older builds
 * returned `null` — the `Reason[] | null` type covers both.
 */
export async function getRecoFeed(token: string): Promise<Scored[]> {
  const rows = await apiFetch<Scored[] | null>('/v1/reco/feed', { token });
  return rows ?? [];
}
