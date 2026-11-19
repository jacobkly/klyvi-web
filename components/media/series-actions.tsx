"use client";

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { Bookmark, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { useSession } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { useSeriesTracking } from "@/components/media/series-tracking";
import { recordInteraction } from "@/lib/api/interactions";
import { addTracking } from "@/lib/api/tracking";
import { trackFirstUntrackedSeason } from "@/lib/track-show";

/**
 * The series page's action row, in the slot where a film or season has its
 * status control. A series is not a trackable unit, so "Add to watchlist"
 * adds its first untracked season as Planning, and "Not interested" is a
 * series-level dismiss. The same meanings as on a show in Find.
 *
 * Inside a SeriesTrackingProvider that knows your library, the button names
 * the season it will add ("Add Season 3 to Planning") and moves on after
 * each click. Without one it is the plain "Add to watchlist".
 */
export function SeriesActions({
  tmdbId,
  seasonNumbers,
}: {
  tmdbId: number;
  seasonNumbers: number[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useSession();
  // One save at a time: a double tap would otherwise add two seasons.
  const [saving, setSaving] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  const tracking = useSeriesTracking();
  const tracked = tracking?.seasons ?? null;
  // The lowest season you don't track yet, once your library is known.
  const nextSeason = tracked
    ? ([...seasonNumbers]
        .sort((a, b) => a - b)
        .find((n) => n >= 1 && !tracked.has(n)) ?? null)
    : undefined;
  const saveLabel =
    nextSeason === undefined
      ? "Add to watchlist"
      : nextSeason === null
        ? "Every season is in your library"
        : `Add Season ${nextSeason} to Planning`;

  /** Both actions need an account. Send a signed-out visitor to sign in
   *  and straight back here. */
  function signedIn() {
    if (user) return true;
    router.push(`/signin?next=${encodeURIComponent(pathname)}`);
    return false;
  }

  function recordSave() {
    recordInteraction({
      tmdbId,
      mediaType: "tv",
      kind: "saved",
      source: "detail",
    }).catch(() => {});
  }

  function save() {
    if (!signedIn()) return;
    if (nextSeason != null && tracking) {
      const season = nextSeason;
      setSaving(true);
      const id = toast(`Adding Season ${season} to Planning`);
      addTracking({
        tmdbId,
        mediaType: "season",
        seasonNumber: season,
        status: "planning",
      })
        .then((entry) => {
          tracking.added(entry);
          toast(`Season ${season} added to Planning`, { id });
        })
        .catch(() => toast("Could not update that. Try again", { id }))
        .finally(() => setSaving(false));
      recordSave();
      return;
    }
    setSaving(true);
    // Finding the season takes two requests. Answer the tap now and let the
    // same toast name the season once it is known.
    const id = toast("Adding to your watchlist");
    trackFirstUntrackedSeason(tmdbId, seasonNumbers)
      .then((season) =>
        toast(
          season != null
            ? `Season ${season} added to your watchlist`
            : "Every season is already in your library",
          { id }
        )
      )
      .catch(() => toast("Could not update that. Try again", { id }))
      .finally(() => {
        setSaving(false);
        tracking?.refresh();
      });
    recordSave();
  }

  function dismiss() {
    if (!signedIn()) return;
    setDismissed(true);
    toast("Hidden from your recommendations");
    recordInteraction({
      tmdbId,
      mediaType: "tv",
      kind: "dismissed",
      source: "detail",
    }).catch(() => {});
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        size="touch"
        className="w-full gap-2"
        disabled={saving || nextSeason === null}
        onClick={save}
      >
        <Bookmark aria-hidden="true" data-icon="inline-start" />
        {saveLabel}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2 text-muted-foreground"
        disabled={dismissed}
        onClick={dismiss}
      >
        <EyeOff aria-hidden="true" data-icon="inline-start" />
        Not interested
      </Button>
    </div>
  );
}
