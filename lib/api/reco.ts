/** GET /v1/reco/feed: the personalized feed, up to 30 Scored items. */

import type { Scored } from "@/lib/types";

import { browserFetch } from "./http";
import { mapScored } from "./map";
import type { WireScored } from "./wire";

export async function getFeed(signal?: AbortSignal): Promise<Scored[]> {
  const rows = await browserFetch<WireScored[] | null>("/v1/reco/feed", {
    signal,
  });
  return (rows ?? []).map(mapScored);
}
