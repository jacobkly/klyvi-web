"use client";

import * as React from "react";

import { useSession } from "@/components/auth/auth-provider";
import { PosterCard } from "@/components/klyvi/poster-card";
import { SectionHeader } from "@/components/klyvi/section-header";
import { listTracking } from "@/lib/api/tracking";
import type { LibraryEntry, MediaSummary } from "@/lib/types";

type SeriesTracking = {
  /** Your entries for this show's seasons, by season number. Null while
   *  unknown: signed out, loading, or the library couldn't be read. */
  seasons: Map<number, LibraryEntry> | null;
  /** A season you just added, shown without asking the API again. */
  added: (entry: LibraryEntry) => void;
  /** Ask again, after a change made some other way. */
  refresh: () => void;
};

const Context = React.createContext<SeriesTracking | null>(null);

/** What you track of one show, shared by the series page's button and its
 *  season cards so both change together. */
export function useSeriesTracking(): SeriesTracking | null {
  return React.useContext(Context);
}

type Answer = { key: string; entries: LibraryEntry[] | null };

export function SeriesTrackingProvider({
  tmdbId,
  children,
}: {
  tmdbId: number;
  children: React.ReactNode;
}) {
  const { user } = useSession();
  const [attempt, setAttempt] = React.useState(0);
  const [answer, setAnswer] = React.useState<Answer | null>(null);
  const key = user ? `${user.id}/${tmdbId}/${attempt}` : null;

  React.useEffect(() => {
    if (!key) return;
    let live = true;
    listTracking({ mediaType: "season", tmdbIds: [tmdbId] })
      .then((rows) => {
        if (live) {
          setAnswer({ key, entries: rows.filter((r) => r.tmdbId === tmdbId) });
        }
      })
      .catch(() => {
        if (live) setAnswer({ key, entries: null });
      });
    return () => {
      live = false;
    };
  }, [key, tmdbId]);

  const entries = answer && answer.key === key ? answer.entries : null;
  const seasons = React.useMemo(
    () =>
      entries
        ? new Map(
            entries
              .filter((e) => e.seasonNumber != null)
              .map((e) => [e.seasonNumber as number, e])
          )
        : null,
    [entries]
  );

  const value = React.useMemo<SeriesTracking>(
    () => ({
      seasons,
      added: (entry) =>
        setAnswer((prev) =>
          prev && prev.key === key && prev.entries
            ? { key: prev.key, entries: [...prev.entries, entry] }
            : prev
        ),
      refresh: () => setAttempt((n) => n + 1),
    }),
    [seasons, key]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

/** The series page's seasons, each with your status, progress and score. */
export function SeasonGrid({
  seasons,
}: {
  seasons: (MediaSummary & { episodeCount: number | null })[];
}) {
  const tracking = useSeriesTracking();
  if (seasons.length === 0) return null;
  return (
    <section className="mb-10">
      <SectionHeader title="Seasons" className="mb-4" />
      <ul
        aria-label="Seasons"
        className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
      >
        {seasons.map((s) => {
          const e =
            s.seasonNumber != null
              ? tracking?.seasons?.get(s.seasonNumber)
              : undefined;
          return (
            <li key={s.seasonNumber}>
              <PosterCard
                media={s}
                variant="below"
                label={`Season ${s.seasonNumber}`}
                status={e?.status}
                score={e?.score ?? null}
                progress={
                  e && e.progress != null && e.progress > 0
                    ? {
                        watched: e.progress,
                        total: e.progressTotal ?? s.episodeCount,
                      }
                    : undefined
                }
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
