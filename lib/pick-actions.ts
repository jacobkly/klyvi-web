import { toast } from "sonner";

import { recordInteraction } from "@/lib/api/interactions";
import { addTracking } from "@/lib/api/tracking";
import { readPref } from "@/lib/local-prefs";
import { formatScore } from "@/lib/score";
import { trackFirstUntrackedSeason } from "@/lib/track-show";
import type { Scored } from "@/lib/types";
import { UNDO_TOAST_MS } from "@/lib/undo-toast";

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
    const id = toast(`Adding ${p.title} to your watchlist`);
    trackFirstUntrackedSeason(p.tmdbId)
      .then((season) =>
        toast(
          season != null
            ? `Added ${p.title} season ${season} to your watchlist`
            : `Every season of ${p.title} is already in your library`,
          { id, action: seasons(p) }
        )
      )
      .catch(() => toast("Could not update that. Try again", { id }));
  } else {
    toast(`Added ${p.title} to your watchlist`);
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

/**
 * Not for me: hidden from the feed for good, with a few seconds to take it
 * back. The API can't delete an interaction, so the write waits out the undo
 * window (or the page closing) and Undo simply cancels it. `onUndo` puts the
 * pick back where it was.
 */
export function dismissPick(
  p: Scored,
  { mock, onUndo }: { mock?: boolean; onUndo?: () => void }
) {
  let settled = false;
  const settle = () => {
    settled = true;
    clearTimeout(timer);
    window.removeEventListener("pagehide", write);
  };
  function write() {
    if (settled) return;
    settle();
    if (mock) return;
    recordInteraction({
      tmdbId: p.tmdbId,
      mediaType: p.mediaType,
      kind: "dismissed",
      source: "feed",
    }).catch(() => {});
  }
  const timer = setTimeout(write, UNDO_TOAST_MS);
  window.addEventListener("pagehide", write);

  toast(`Hid ${p.title} from your recommendations`, {
    duration: UNDO_TOAST_MS,
    action: {
      label: "Undo",
      onClick: () => {
        if (settled) return;
        settle();
        onUndo?.();
        toast(`${p.title} is back in your picks`);
      },
    },
  });
}

/** "Rated Heat 90", "Rated Heat 9/10", or "Rated Heat: Liked it". */
function ratedLine(title: string, score: number): string {
  const system = readPref("scoringSystem");
  const shown = formatScore(score, system);
  return system === "smiley" ? `Rated ${title}: ${shown}` : `Rated ${title} ${shown}`;
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
  const done =
    score != null ? ratedLine(p.title, score) : `Marked ${p.title} as seen`;
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
      // The rated toast has already gone up, so a failed write has to say
      // so or the film silently never reaches the library.
    }).catch(() => toast("Could not add that to your library. Try again"));
  }
}
