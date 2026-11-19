/**
 * The admin error pages (GET and PATCH /v1/admin/errors). The API answers
 * anyone who isn't an admin with its unknown-route 404.
 */

import type { ErrorGroup, ErrorGroupPage, ErrorGroupStatus } from "@/lib/types";

import { apiFetch, browserFetch } from "./http";
import { mapErrorGroup, mapErrorGroupPage } from "./map";
import type { WireErrorGroup, WireErrorGroupPage } from "./wire";

/**
 * One page of error groups, for the server page with the session's token.
 * Null when the caller isn't an admin (or the routes are off).
 */
export async function getErrorGroups(
  token: string,
  opts: { status: ErrorGroupStatus; offset: number }
): Promise<ErrorGroupPage | null> {
  const params = new URLSearchParams();
  if (opts.status !== "open") params.set("status", opts.status);
  if (opts.offset > 0) params.set("offset", String(opts.offset));
  const qs = params.toString();
  const w = await apiFetch<WireErrorGroupPage | null>(
    `/v1/admin/errors${qs ? `?${qs}` : ""}`,
    { token, allow404: true, cache: "no-store" }
  );
  return w ? mapErrorGroupPage(w) : null;
}

/** Resolves a group, or reopens it, and returns it as it now is. */
export async function setErrorResolved(
  id: number,
  resolved: boolean
): Promise<ErrorGroup> {
  const w = await browserFetch<WireErrorGroup>(`/v1/admin/errors/${id}`, {
    method: "PATCH",
    body: { resolved },
  });
  return mapErrorGroup(w);
}
