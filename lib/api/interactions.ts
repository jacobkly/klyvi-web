/**
 * Protected interaction endpoints (the recommender signal pillar). Distinct
 * from tracking: tracking is the watchlist, interactions are what the
 * recommender learns from. Rating anything should write BOTH.
 */

import type {
  Interaction,
  InteractionKind,
  InteractionSource,
  SummaryKind,
} from "@/lib/types";

import { browserFetch } from "./http";
import { mapInteraction } from "./map";
import type { WireBatchResult, WireInteraction } from "./wire";

/** One row of a batch, the same shape as a single POST /v1/interactions.
 *  A "tv" row is a series-level signal: tmdbId is the series and no season
 *  number is sent. */
export type InteractionInput = {
  tmdbId: number;
  mediaType: SummaryKind;
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

/** The user's history, newest first. The API caps it (500 rows unless
 *  `limit` asks for up to 1000), so a count of one kind asks for that kind. */
export async function listInteractions(opts?: {
  sinceDays?: number;
  kind?: InteractionKind;
  limit?: number;
}): Promise<Interaction[]> {
  const params = new URLSearchParams();
  if (opts?.sinceDays != null) params.set("since_days", String(opts.sinceDays));
  if (opts?.kind) params.set("kind", opts.kind);
  if (opts?.limit != null) params.set("limit", String(opts.limit));
  const qs = params.size > 0 ? `?${params}` : "";
  const rows = await browserFetch<WireInteraction[] | null>(
    `/v1/interactions${qs}`
  );
  return (rows ?? []).map(mapInteraction);
}
