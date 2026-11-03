/** GET /v1/reco/feed: the personalized feed, up to 30 Scored items. */

import type { FeedMedia, Scored } from "@/lib/types";

import { browserFetch } from "./http";
import { mapScored } from "./map";
import type { WireScored } from "./wire";

/** `media` narrows the feed to films or series. `all`, the default, sends
 *  no filter, so it shares the API's cache entry with a plain request. */
export async function getFeed({
  media = "all",
  signal,
}: { media?: FeedMedia; signal?: AbortSignal } = {}): Promise<Scored[]> {
  const path = media === "all" ? "/v1/reco/feed" : `/v1/reco/feed?media=${media}`;
  const rows = await browserFetch<WireScored[] | null>(path, { signal });
  return (rows ?? []).map(mapScored);
}
