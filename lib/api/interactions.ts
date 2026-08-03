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
import type { WireBatchResult, WireInteraction } from "./wire";

/** One row of a batch, the same shape as a single POST /v1/interactions. */
export type InteractionInput = {
  tmdbId: number;
  mediaType: MediaType;
  seasonNumber?: number | null;
  kind: InteractionKind;
  rating?: number;
  source?: InteractionSource;
};

function toWireInput(i: InteractionInput) {
  return {
    tmdb_id: i.tmdbId,
    media_type: i.mediaType,
    season_number:
      i.mediaType === "season" ? (i.seasonNumber ?? null) : null,
    kind: i.kind,
    rating: i.kind === "rated" ? i.rating : undefined,
    source: i.source,
  };
}

export async function recordInteraction(
  input: InteractionInput
): Promise<Interaction> {
  const row = await browserFetch<WireInteraction>("/v1/interactions", {
    method: "POST",
    body: toWireInput(input),
  });
  return mapInteraction(row);
}

/**
 * Record up to 25 interactions in one request. Not all-or-nothing: the
 * server persists the valid rows and returns how many it accepted and
 * rejected.
 */
export async function recordInteractionsBatch(
  inputs: InteractionInput[]
): Promise<WireBatchResult> {
  return browserFetch<WireBatchResult>("/v1/interactions/batch", {
    method: "POST",
    body: { interactions: inputs.map(toWireInput) },
  });
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
