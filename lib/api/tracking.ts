/**
 * Protected tracking endpoints (the watchlist pillar). Browser-side only:
 * the JWT is resolved lazily from the Supabase session.
 *
 * POST resolves (tmdb_id, media_type, season_number) to an internal
 * media_id and is idempotent; PATCH and DELETE address that media_id.
 */

import type { LibraryEntry, MediaType, TrackingStatus } from "@/lib/types";

import { browserFetch } from "./http";
import { mapTrackingEntry } from "./map";
import type { WireAffected, WireTrackingEntry } from "./wire";

export async function listTracking(filters?: {
  mediaType?: MediaType;
  status?: TrackingStatus;
}): Promise<LibraryEntry[]> {
  const params = new URLSearchParams();
  if (filters?.mediaType) params.set("media_type", filters.mediaType);
  if (filters?.status) params.set("status", filters.status);
  const qs = params.toString();
  const rows = await browserFetch<WireTrackingEntry[] | null>(
    `/v1/tracking${qs ? `?${qs}` : ""}`
  );
  return (rows ?? []).map(mapTrackingEntry);
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
  return mapTrackingEntry(row);
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
  return mapTrackingEntry(row);
}

export async function deleteTracking(mediaId: number): Promise<void> {
  await browserFetch<{ deleted: boolean }>(`/v1/tracking/${mediaId}`, {
    method: "DELETE",
  });
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
  return r.affected;
}
