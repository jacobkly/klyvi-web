import { toast } from "sonner";

import { recordInteraction } from "@/lib/api/interactions";
import { addTracking } from "@/lib/api/tracking";
import { trackFirstUntrackedSeason } from "@/lib/track-show";
import type { Scored } from "@/lib/types";

/**
 * What a recommended pick's three buttons do, shared by Find and the home
 * hero so the two can never answer the same tap differently.
 *
 * A show is recommended whole but tracked season by season, so a toast about
 * one carries `seasons`, the action that opens its page where the seasons are.
 * `mock` (the ?simulate preview) shows the toasts and writes nothing.
 */
export type PickActionOptions = {
  mock?: boolean;
  seasons: (p: Scored) => { label: string; onClick: () => void };
};

/** Add: films to Planning, a show's first untracked season. */
export function savePick(p: Scored, { mock, seasons }: PickActionOptions) {
  if (!mock && p.mediaType === "tv") {
    // Never tracked as a film (the ids overlap, so that would list an
    // unrelated film). Its first untracked season goes in instead. Finding
    // it takes two requests, so the tap is answered now and the same toast
    // names the season once it is known.
    const id = toast("Adding to your watchlist");
    trackFirstUntrackedSeason(p.tmdbId)
      .then((season) =>
        toast(
          season != null
            ? `Season ${season} added to your watchlist`
            : "Every season is already in your library",
          { id, action: seasons(p) }
        )
      )
      .catch(() => toast("Could not update that. Try again", { id }));
  } else {
    toast("Added to your watchlist");
    if (!mock) {
      addTracking({
        tmdbId: p.tmdbId,
        mediaType: "movie",
        status: "planning",
      }).catch(() => toast("Could not update that. Try again"));
    }
  }
  if (!mock) {
    recordInteraction({
      tmdbId: p.tmdbId,
      mediaType: p.mediaType,
      kind: "saved",
      source: "feed",
    }).catch(() => {});
  }
}

/** Not for me: hidden from the feed for good. */
export function dismissPick(p: Scored, { mock }: Pick<PickActionOptions, "mock">) {
  toast("Hidden from your recommendations");
  if (!mock) {
    recordInteraction({
      tmdbId: p.tmdbId,
      mediaType: p.mediaType,
      kind: "dismissed",
      source: "feed",
    }).catch(() => {});
  }
}

/**
 * Seen it, once the rating dialog closes: a score, or null for "seen,
 * no score". A film goes into the library as Completed.
 */
export function ratePick(
  p: Scored,
  score: number | null,
  { mock, seasons }: PickActionOptions
) {
  const done = score != null ? "Rated" : "Marked as seen";
  // A show's rating and "seen" are series-level signals. Nothing is tracked
  // for the whole series, so the toast offers its seasons.
  if (p.mediaType === "tv") toast(done, { action: seasons(p) });
  else toast(done);
  if (mock) return;
  recordInteraction(
    score != null
      ? {
          tmdbId: p.tmdbId,
          mediaType: p.mediaType,
          kind: "rated",
          rating: score,
          source: "feed",
        }
      : {
          tmdbId: p.tmdbId,
          mediaType: p.mediaType,
          kind: "logged",
          source: "feed",
        }
  ).catch(() => {});
  if (p.mediaType === "movie") {
    addTracking({
      tmdbId: p.tmdbId,
      mediaType: "movie",
      status: "completed",
      score,
      // The "Rated" toast has already gone up, so a failed write has to say
      // so or the film silently never reaches the library.
    }).catch(() => toast("Could not add that to your library. Try again"));
  }
}
