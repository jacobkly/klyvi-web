"use client";

import Link from "next/link";

import { FadeImage } from "@/components/klyvi/poster-parts";
import { PosterCard } from "@/components/klyvi/poster-card";
import { ScoreValue } from "@/components/klyvi/score-value";
import { Button } from "@/components/ui/button";
import { activityLine } from "@/lib/home";
import { mediaHref } from "@/lib/media-href";
import { tmdbImage } from "@/lib/tmdb-image";
import type { LibraryEntry } from "@/lib/types";

function seasonName(e: LibraryEntry): string {
  return e.mediaType === "season" && e.seasonNumber != null
    ? `${e.title} Season ${e.seasonNumber}`
    : e.title;
}

/** "Episode 4 of 13", or as much of it as is known. */
export function episodeLine(e: LibraryEntry): string | null {
  if (e.mediaType !== "season") return null;
  const n = e.progress ?? 0;
  if (n === 0) return "Not started";
  return e.progressTotal != null ? `Episode ${n} of ${e.progressTotal}` : `Episode ${n}`;
}

/**
 * A show in progress: its poster (the season tag rides the artwork), where
 * you are, and +1 for the episode you just finished. +1 goes once the last
 * episode is in.
 */
export function ContinueCard({
  entry,
  onStep,
}: {
  entry: LibraryEntry;
  onStep: (e: LibraryEntry) => void;
}) {
  const line = episodeLine(entry);
  const n = entry.progress ?? 0;
  const done = entry.progressTotal != null && n >= entry.progressTotal;
  return (
    <div>
      <PosterCard media={entry} variant="below" status={entry.status} />
      {line ? (
        <div className="mt-1 flex items-center justify-between gap-2">
          <span data-numeric className="font-mono text-[11px] text-violet-text">
            {line}
          </span>
          {!done ? (
            <Button
              variant="secondary"
              size="xs"
              aria-label={`Mark episode ${n + 1} of ${seasonName(entry)} watched`}
              className="hit-44 relative font-mono"
              onClick={() => onStep(entry)}
            >
              +1
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** A planned title not out yet, with its day. */
export function ComingUpCard({
  entry,
  label,
}: {
  entry: LibraryEntry;
  label: string;
}) {
  return (
    <div>
      <PosterCard media={entry} variant="below" />
      <p className="mt-1 text-[11px] font-medium text-foreground">{label}</p>
    </div>
  );
}

/**
 * Recent changes to the library, newest first, each with its poster and
 * what changed ("You rated Parasite 95"). The whole line opens the title.
 */
export function ActivityList({ entries }: { entries: LibraryEntry[] }) {
  return (
    <ul className="flex flex-col">
      {entries.map((e) => {
        const { lead, tail, score } = activityLine(e);
        const poster = tmdbImage(e.posterPath);
        return (
          <li key={e.mediaId} className="border-b border-border last:border-b-0">
            <Link
              href={mediaHref(e)}
              className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 text-sm outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              <span className="relative aspect-[2/3] w-10 shrink-0 overflow-hidden rounded-art bg-muted ring-1 ring-foreground/10">
                {poster ? (
                  <FadeImage
                    src={poster}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                ) : null}
              </span>
              <span className="min-w-0 flex-1 text-muted-foreground">
                {lead}{" "}
                <span className="font-medium text-foreground">{seasonName(e)}</span>
                {tail ? ` ${tail}` : null}
                {score != null ? (
                  <>
                    {" "}
                    <ScoreValue
                      score={score}
                      className="font-mono font-medium text-foreground"
                    />
                  </>
                ) : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
