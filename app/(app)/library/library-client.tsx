"use client";

import * as React from "react";

import { LibraryView } from "@/components/library/library-view";
import type { TrackingEdit } from "@/components/library/tracking-dialog";
import { recordInteraction } from "@/lib/api/interactions";
import {
  deleteTracking,
  listTracking,
  updateTracking,
} from "@/lib/api/tracking";
import { MOCK_LIBRARY } from "@/lib/mock-library";
import type { LibraryEntry, TrackingStatus } from "@/lib/types";

/**
 * Client boundary that owns the loader and the write path. The ?simulate=
 * params keep the six states reachable without the API: simulate swaps in
 * the mock loader and optimistic-only writes.
 */
export function LibraryClient({ simulate }: { simulate?: string }) {
  const mock = simulate != null;

  const load = React.useCallback((): Promise<LibraryEntry[]> => {
    if (!mock) return listTracking();
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (simulate === "error") reject(new Error("simulated"));
        else if (simulate === "empty") resolve([]);
        else if (simulate === "loading") {
          /* never resolves: holds the skeleton state */
        } else resolve(MOCK_LIBRARY);
      }, 450);
    });
  }, [mock, simulate]);

  const onStatusChange = React.useCallback(
    async (e: LibraryEntry, next: TrackingStatus) => {
      await updateTracking(e.mediaId, { status: next });
    },
    []
  );

  const onSave = React.useCallback(
    async (e: LibraryEntry, edit: TrackingEdit) => {
      await updateTracking(e.mediaId, {
        status: edit.status,
        score: edit.score,
        episodeProgress: edit.progress,
        notes: edit.notes,
      });
      // A new or changed score is recommender signal, and the API keeps the
      // two pillars separate: without this dual-write the recommender never
      // hears about the rating. Fire-and-forget: the tracking write is the
      // one the user sees.
      if (edit.score != null && edit.score !== e.score) {
        recordInteraction({
          tmdbId: e.tmdbId,
          mediaType: e.mediaType,
          seasonNumber: e.seasonNumber,
          kind: "rated",
          rating: edit.score,
        }).catch(() => {});
      }
    },
    []
  );

  const onDelete = React.useCallback(async (e: LibraryEntry) => {
    await deleteTracking(e.mediaId);
  }, []);

  return (
    <LibraryView
      load={load}
      onStatusChange={mock ? undefined : onStatusChange}
      onSave={mock ? undefined : onSave}
      onDelete={mock ? undefined : onDelete}
    />
  );
}
