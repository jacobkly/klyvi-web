/**
 * Protected interaction endpoints (the recommender signal pillar). Distinct
 * from tracking: tracking is the watchlist, interactions are what the
 * recommender learns from. Rating anything should write BOTH.
 */

import type {
  Interaction,
  InteractionKind,
  InteractionSource,
  MediaType,
} from "@/lib/types";

import { browserFetch } from "./http";
import { mapInteraction } from "./map";
import type { WireInteraction } from "./wire";

export async function recordInteraction(input: {
  tmdbId: number;
  mediaType: MediaType;
  seasonNumber?: number | null;
  kind: InteractionKind;
  /** Required when kind is "rated" (0..100). */
  rating?: number;
  source?: InteractionSource;
}): Promise<Interaction> {
  const row = await browserFetch<WireInteraction>("/v1/interactions", {
    method: "POST",
    body: {
      tmdb_id: input.tmdbId,
      media_type: input.mediaType,
      season_number:
        input.mediaType === "season" ? (input.seasonNumber ?? null) : null,
      kind: input.kind,
      rating: input.kind === "rated" ? input.rating : undefined,
      source: input.source,
    },
  });
  return mapInteraction(row);
}

export async function listInteractions(
  sinceDays?: number
): Promise<Interaction[]> {
  const qs = sinceDays != null ? `?since_days=${sinceDays}` : "";
  const rows = await browserFetch<WireInteraction[] | null>(
    `/v1/interactions${qs}`
  );
  return (rows ?? []).map(mapInteraction);
}
