/** GET /v1/search: TMDB passthrough. Public, no auth. */

import { apiFetch } from "./http";
import { mapSearchResults, type SearchResults } from "./map";
import type { WireSearchResponse } from "./wire";

export type SearchType = "movie" | "tv" | "person" | "multi";

export async function search(
  query: string,
  type: SearchType = "multi",
  signal?: AbortSignal
): Promise<SearchResults> {
  const params = new URLSearchParams({ query });
  if (type !== "multi") params.set("type", type);
  const w = await apiFetch<WireSearchResponse>(
    `/v1/search?${params.toString()}`,
    { signal }
  );
  return mapSearchResults(w, type === "multi" ? undefined : type);
}
