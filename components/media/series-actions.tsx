"use client";

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { Bookmark, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { useSession } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { recordInteraction } from "@/lib/api/interactions";
import { trackFirstUntrackedSeason } from "@/lib/track-show";

/**
 * The series page's action row, in the slot where a film or season has its
 * status control. A series is not a trackable unit, so "Add to watchlist"
 * adds its first untracked season as Planning, and "Not interested" is a
 * series-level dismiss. The same meanings as on a show in Find.
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

  /** Both actions need an account. Send a signed-out visitor to sign in
   *  and straight back here. */
  function signedIn() {
    if (user) return true;
    router.push(`/signin?next=${encodeURIComponent(pathname)}`);
    return false;
  }

  function save() {
    if (!signedIn()) return;
    setSaving(true);
    trackFirstUntrackedSeason(tmdbId, seasonNumbers)
      .then((season) =>
        toast(
          season != null
            ? `Season ${season} added to your watchlist`
            : "Every season is already in your library"
        )
      )
      .catch(() => toast("Could not update that. Try again"))
      .finally(() => setSaving(false));
    recordInteraction({
      tmdbId,
      mediaType: "tv",
      kind: "saved",
      source: "detail",
    }).catch(() => {});
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
        disabled={saving}
        onClick={save}
      >
        <Bookmark aria-hidden="true" data-icon="inline-start" />
        Add to watchlist
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
