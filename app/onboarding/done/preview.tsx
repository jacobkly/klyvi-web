"use client";

import * as React from "react";

import { PosterCard } from "@/components/klyvi/poster-card";
import { ReasonChips } from "@/components/klyvi/reason-chips";
import { Skeleton } from "@/components/ui/skeleton";
import { getFeed } from "@/lib/api/reco";
import type { Scored } from "@/lib/types";

/**
 * The success-screen preview (onboarding-spec §3A.4): three real picks from
 * the freshly-fed recommender, why exposed on each. Quietly absent when the
 * feed has nothing or fails; the CTA above already leads to /find.
 */
export function FirstPicksPreview() {
  const [picks, setPicks] = React.useState<Scored[] | null | undefined>(
    undefined
  );

  React.useEffect(() => {
    getFeed()
      .then((feed) => setPicks(feed.slice(0, 3)))
      .catch(() => setPicks(null));
  }, []);

  if (picks === null) return null;

  if (picks === undefined) {
    return (
      <div className="mt-8 grid w-full grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[2/3] rounded-art" />
        ))}
      </div>
    );
  }

  if (picks.length === 0) return null;

  return (
    <div className="mt-8 w-full text-left">
      <h2 className="text-xs font-medium tracking-[0.12em] uppercase text-muted-foreground">
        First picks
      </h2>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {picks.map((p) => (
          <div key={p.mediaId}>
            <PosterCard media={p} variant="below" />
            <ReasonChips reasons={p.reasons} max={1} className="mt-1.5" />
          </div>
        ))}
      </div>
    </div>
  );
}
