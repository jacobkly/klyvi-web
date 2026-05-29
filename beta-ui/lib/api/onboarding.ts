import { apiFetch } from './client';
import type { EnrichedPoolEntry } from './types';

/**
 * GET /v1/onboarding/pool — public. Returns the curated swipe deck with
 * inline display fields (title, poster_path, release_year).
 */
export function getOnboardingPool(
  opts: { limit?: number; revalidate?: number } = {}
): Promise<EnrichedPoolEntry[]> {
  const limit = opts.limit ?? 20;
  return apiFetch<EnrichedPoolEntry[]>(`/v1/onboarding/pool?limit=${limit}`, {
    next: opts.revalidate ? { revalidate: opts.revalidate } : undefined,
  });
}
