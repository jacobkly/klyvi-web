"use client";

import * as React from "react";

import { useSession } from "@/components/auth/auth-provider";
import { PosterCard } from "@/components/klyvi/poster-card";
import { listTracking } from "@/lib/api/tracking";
import type { MediaSummary, TrackingStatus } from "@/lib/types";

type Mine = { status: TrackingStatus; score: number | null };

/**
 * The films of a TMDB collection in release order, under the hero of each
 * one's page. This film is ringed and labelled. Signed in, each card carries
 * your status and score, read in one request for the whole collection.
 */
export function CollectionBand({
  name,
  films,
  currentId,
}: {
  /** "The Dark Knight Collection". Null falls back to a plain heading. */
  name: string | null;
  films: MediaSummary[];
  currentId: number;
}) {
  const { user } = useSession();
  const [mine, setMine] = React.useState<Map<number, Mine>>(new Map());
  const ids = films.map((f) => f.tmdbId).join(",");

  React.useEffect(() => {
    if (!user || !ids) return;
    let cancelled = false;
    listTracking({ mediaType: "movie", tmdbIds: ids.split(",").map(Number) })
      .then((rows) => {
        if (cancelled) return;
        setMine(
          new Map(rows.map((r) => [r.tmdbId, { status: r.status, score: r.score }]))
        );
      })
      // Statuses are a layer on the band. Without them it still reads.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, ids]);

  const headingId = React.useId();
  const heading = name ? `Part of ${name}` : "In the same collection";

  return (
    <section aria-labelledby={headingId} className="mb-10">
      <div className="mb-4 flex items-baseline gap-4">
        <h2
          id={headingId}
          className="min-w-0 text-sm font-medium text-foreground"
          aria-label={heading}
        >
          {name ? (
            <>
              <span className="text-muted-foreground">Part of </span>
              {name}
            </>
          ) : (
            heading
          )}
        </h2>
        <div className="h-px flex-1 self-center bg-border" aria-hidden="true" />
        <span
          data-numeric
          className="shrink-0 font-mono text-xs text-muted-foreground"
        >
          {films.length} films
        </span>
      </div>
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        {films.map((f) => {
          const m = mine.get(f.tmdbId);
          return (
            <PosterCard
              key={f.tmdbId}
              media={f}
              variant="below"
              current={f.tmdbId === currentId}
              status={m?.status}
              score={m?.score}
              sizes="128px"
              className="w-28 shrink-0 snap-start sm:w-32"
            />
          );
        })}
      </div>
    </section>
  );
}
