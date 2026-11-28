/**
 * Protected tracking endpoints (the watchlist pillar). Browser-side only:
 * the JWT is resolved lazily from the Supabase session.
 *
 * POST resolves (tmdb_id, media_type, season_number) to an internal
 * media_id and is idempotent; PATCH and DELETE address that media_id.
 */

import type { LibraryEntry, MediaType, TrackingStatus, Watched } from "@/lib/types";

import { browserFetch } from "./http";
import { mapTrackingEntry, mapWatched } from "./map";
import type { WireAffected, WireTrackingEntry, WireWatched } from "./wire";

/** Fired on window after any tracking write, so what depends on the library
 *  (the watched marks) can catch up. */
export const TRACKING_CHANGED = "klyvi:tracking-changed";

function changed<T>(result: T): T {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(TRACKING_CHANGED));
  return result;
}

/** The TMDB ids of what the user has seen through. */
export async function getWatched(signal?: AbortSignal): Promise<Watched> {
  const w = await browserFetch<WireWatched>("/v1/tracking/watched", { signal });
  return mapWatched(w ?? { movies: [], tv: [] });
}

export async function listTracking(filters?: {
  mediaType?: MediaType;
  status?: TrackingStatus;
  /** Only these titles (up to 100). A season row matches its series id. */
  tmdbIds?: number[];
}): Promise<LibraryEntry[]> {
  const params = new URLSearchParams();
  if (filters?.mediaType) params.set("media_type", filters.mediaType);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.tmdbIds?.length) {
    params.set("tmdb_ids", filters.tmdbIds.slice(0, 100).join(","));
  }
  const qs = params.toString();
  const rows = await browserFetch<WireTrackingEntry[] | null>(
    `/v1/tracking${qs ? `?${qs}` : ""}`
  );
  return (rows ?? []).map(mapTrackingEntry);
}

/** Rows per page of the paged list. The API cuts a page at 200. */
export const TRACKING_PAGE = 200;

/** Where the later pages of a paged list go. `live` turns false when the
 *  screen that asked has gone, and paging stops. */
export type PageSink = {
  page: (entries: LibraryEntry[]) => void;
  failed: () => void;
  live: () => boolean;
};

/** One page, and the cursor for the next (null on the last page). The cursor
 *  is the last row's updated_at and id, which the API pages by. */
async function fetchTrackingPage(
  cursor: string | null
): Promise<{ entries: LibraryEntry[]; next: string | null }> {
  const params = new URLSearchParams({ limit: String(TRACKING_PAGE) });
  if (cursor) params.set("cursor", cursor);
  const rows =
    (await browserFetch<WireTrackingEntry[] | null>(`/v1/tracking?${params}`)) ?? [];
  const tail = rows[rows.length - 1];
  return {
    entries: rows.map(mapTrackingEntry),
    next: rows.length === TRACKING_PAGE ? `${tail.updated_at},${tail.id}` : null,
  };
}

/** The rest of the list after `cursor`, a page at a time into `sink`. */
async function pageRest(cursor: string, sink: PageSink): Promise<void> {
  // Let the first page paint before the next request goes out.
  await new Promise((r) => setTimeout(r, 0));
  let next: string | null = cursor;
  try {
    while (next && sink.live()) {
      const p = await fetchTrackingPage(next);
      if (!sink.live()) return;
      if (p.entries.length > 0) sink.page(p.entries);
      next = p.next;
    }
  } catch {
    if (sink.live()) sink.failed();
  }
}

/**
 * The whole tracking list, a page at a time. With a sink it resolves as soon
 * as the first page lands and hands each later page to the sink, so a big
 * library shows without waiting for all of it. Without one it resolves with
 * every page.
 */
export async function listTrackingPaged(sink?: PageSink): Promise<LibraryEntry[]> {
  const first = await fetchTrackingPage(null);
  if (sink) {
    if (first.next) void pageRest(first.next, sink);
    return first.entries;
  }
  const all = [...first.entries];
  let next = first.next;
  while (next) {
    const p = await fetchTrackingPage(next);
    all.push(...p.entries);
    next = p.next;
  }
  return all;
}

/** The user's entry for one title, or null when they do not track it. Detail
 *  pages use this instead of pulling the whole library to find one row. */
export async function lookupTracking(input: {
  tmdbId: number;
  mediaType: MediaType;
  seasonNumber?: number | null;
}): Promise<LibraryEntry | null> {
  const params = new URLSearchParams({
    tmdb_id: String(input.tmdbId),
    media_type: input.mediaType,
  });
  if (input.mediaType === "season" && input.seasonNumber != null) {
    params.set("season_number", String(input.seasonNumber));
  }
  const row = await browserFetch<WireTrackingEntry | null>(
    `/v1/tracking/lookup?${params}`,
    { allow404: true }
  );
  return row ? mapTrackingEntry(row) : null;
}

export async function addTracking(input: {
  tmdbId: number;
  mediaType: MediaType;
  seasonNumber?: number | null;
  status: TrackingStatus;
  score?: number | null;
  episodeProgress?: number | null;
  notes?: string | null;
  favorite?: boolean;
}): Promise<LibraryEntry> {
  const row = await browserFetch<WireTrackingEntry>("/v1/tracking", {
    method: "POST",
    body: {
      tmdb_id: input.tmdbId,
      media_type: input.mediaType,
      season_number:
        input.mediaType === "season" ? (input.seasonNumber ?? null) : null,
      status: input.status,
      score: input.score ?? null,
      episode_progress: input.episodeProgress ?? null,
      notes: input.notes ?? null,
      favorite: input.favorite,
    },
  });
  return changed(mapTrackingEntry(row));
}

export async function updateTracking(
  mediaId: number,
  patch: {
    status?: TrackingStatus;
    score?: number | null;
    episodeProgress?: number | null;
    notes?: string | null;
    favorite?: boolean;
  }
): Promise<LibraryEntry> {
  const row = await browserFetch<WireTrackingEntry>(
    `/v1/tracking/${mediaId}`,
    {
      method: "PATCH",
      body: {
        status: patch.status,
        score: patch.score,
        episode_progress: patch.episodeProgress,
        notes: patch.notes,
        favorite: patch.favorite,
      },
    }
  );
  return changed(mapTrackingEntry(row));
}

export async function deleteTracking(mediaId: number): Promise<void> {
  await browserFetch<{ deleted: boolean }>(`/v1/tracking/${mediaId}`, {
    method: "DELETE",
  });
  changed(null);
}

/** Danger zone: clears every score in one media-type scope. */
export async function resetScores(mediaType: MediaType): Promise<number> {
  const r = await browserFetch<WireAffected>("/v1/tracking/reset-scores", {
    method: "POST",
    body: { media_type: mediaType },
  });
  return r.affected;
}

/** Danger zone: deletes every entry in one media-type scope. */
export async function deleteTrackingScope(
  mediaType: MediaType
): Promise<number> {
  const r = await browserFetch<WireAffected>("/v1/tracking", {
    method: "DELETE",
    body: { media_type: mediaType },
  });
  return changed(r.affected);
}
