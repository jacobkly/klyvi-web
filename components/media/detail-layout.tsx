"use client";

import Image from "next/image";
import * as React from "react";
import { toast } from "sonner";

import { PosterCard } from "@/components/klyvi/poster-card";
import { SectionHeader } from "@/components/klyvi/section-header";
import { StatusControl } from "@/components/library/status-control";
import {
  TrackingDialog,
  type TrackingEdit,
} from "@/components/library/tracking-dialog";
import { BackdropHero } from "@/components/media/backdrop-hero";
import { CastChips } from "@/components/media/cast-chips";
import { KeywordCard } from "@/components/media/keyword-card";
import { MetadataList } from "@/components/media/metadata-list";
import { Button } from "@/components/ui/button";
import type { CastMember, Keyword } from "@/lib/mock-media";
import {
  STATUS_VERBS,
  type LibraryEntry,
  type MediaSummary,
  type TrackableSummary,
  type TrackingStatus,
} from "@/lib/types";

/**
 * The shared cinematic detail layout for movies, series, and seasons
 * (archetype G). Three-column at xl per 05-responsive.md: metadata rail left,
 * content centre; on mobile everything stacks with metadata last, and the
 * status control stays in the first viewport under the poster.
 *
 * No ratings histogram yet: the API exposes a single vote average, not a
 * distribution, and a fabricated histogram would be decoration pretending to
 * be data. The average lives in the metadata rail instead.
 */
function DetailLayout({
  media,
  trackable = true,
  episodeCount,
  backdropPath,
  posterPath,
  title,
  year,
  directorLine,
  tagline,
  overview,
  genres,
  metadata,
  keywords,
  cast,
  related,
  extra,
}: {
  media: TrackableSummary;
  /**
   * False on the series overview: only movies and seasons are trackable
   * units, so the series page points at its seasons instead of offering a
   * status control that would write a bogus entry.
   */
  trackable?: boolean;
  /** Total episodes, for the season progress field. */
  episodeCount?: number | null;
  backdropPath: string | null;
  posterPath: string | null;
  title: string;
  year: number | null;
  directorLine: string | null;
  tagline: string | null;
  overview: string | null;
  genres: string[];
  metadata: { label: string; value: string | number | null }[];
  keywords: Keyword[];
  cast: CastMember[];
  related?: { heading: string; items: MediaSummary[] };
  extra?: React.ReactNode;
}) {
  const [status, setStatus] = React.useState<TrackingStatus | null>(null);
  const [score, setScore] = React.useState<number | null>(null);
  const [progress, setProgress] = React.useState<number | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [overviewOpen, setOverviewOpen] = React.useState(false);

  /** The entry the dialog edits. Synthesised until the API client lands. */
  const entry: LibraryEntry = {
    ...media,
    status: status ?? "planning",
    score,
    progress,
    progressTotal: episodeCount ?? null,
    updatedAt: "",
  };

  /**
   * Picking a status is the one moment the user is already thinking about the
   * title, so it opens the dialog rather than silently setting a value. It is
   * also the only route to a score or progress from this page.
   */
  function changeStatus(next: TrackingStatus) {
    setStatus(next);
    toast(STATUS_VERBS[next]);
    setEditing(true);
  }

  function saveEdit(edit: TrackingEdit) {
    setStatus(edit.status);
    setScore(edit.score);
    setProgress(edit.progress);
  }

  return (
    <main className="mx-auto w-full max-w-[1400px]">
      <BackdropHero backdropPath={backdropPath}>
        <div className="px-4 md:px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
            {/* Poster + primary action, first viewport at every width. */}
            <div className="w-36 shrink-0 sm:w-44 lg:w-52">
              <div className="relative aspect-[2/3] overflow-hidden rounded-art bg-muted ring-1 ring-foreground/10">
                {posterPath ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w500${posterPath}`}
                    alt=""
                    fill
                    priority
                    sizes="(max-width: 640px) 144px, 208px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-3 text-center">
                    <span className="text-xs text-muted-foreground">{title}</span>
                  </div>
                )}
              </div>
              {trackable ? (
                <div className="mt-3 flex flex-col gap-2">
                  <StatusControl
                    status={status}
                    onChange={changeStatus}
                    size="touch"
                    className="w-full"
                  />
                  {status ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setEditing(true)}
                    >
                      {score != null ? `Your score: ${score}` : "Add a score"}
                    </Button>
                  ) : null}
                </div>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">
                  Track this show season by season below.
                </p>
              )}
            </div>

            {/* Title block: the Letterboxd hierarchy trick. */}
            <div className="min-w-0 flex-1 sm:pt-10 lg:pt-16">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
                {title}{" "}
                {year != null ? (
                  <span data-numeric className="align-middle font-mono text-sm font-normal text-muted-foreground">
                    {year}
                  </span>
                ) : null}
                {directorLine ? (
                  <span className="ml-2 align-middle text-sm font-normal text-muted-foreground">
                    {directorLine}
                  </span>
                ) : null}
              </h1>

              {genres.length > 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {genres.join(" · ")}
                </p>
              ) : null}

              {tagline ? (
                <p className="mt-5 text-xs font-medium tracking-[0.12em] uppercase text-muted-foreground">
                  {tagline}
                </p>
              ) : null}

              {overview ? (
                <>
                  <p
                    className={
                      overviewOpen
                        ? "mt-2 max-w-[65ch] text-[15px] leading-relaxed text-foreground/90"
                        : "mt-2 line-clamp-4 max-w-[65ch] text-[15px] leading-relaxed text-foreground/90"
                    }
                  >
                    {overview}
                  </p>
                  {!overviewOpen && overview.length > 280 ? (
                    <Button
                      variant="link"
                      size="xs"
                      className="px-0"
                      onClick={() => setOverviewOpen(true)}
                    >
                      Show more
                    </Button>
                  ) : null}
                </>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  No synopsis available for this one yet.
                </p>
              )}
            </div>
          </div>

          {/* Body: metadata rail + content. Stacks with the rail LAST on
              mobile, reference material rather than orientation. */}
          <div className="mt-10 flex flex-col-reverse gap-10 pb-16 lg:flex-row">
            <aside className="w-full shrink-0 lg:w-52">
              <MetadataList items={metadata} />
              <div className="mt-8">
                <KeywordCard keywords={keywords} />
              </div>
            </aside>

            <div className="min-w-0 flex-1">
              {extra}

              <section className="mb-10">
                <SectionHeader title="Cast" className="mb-4" />
                <CastChips cast={cast} />
              </section>

              {related && related.items.length > 0 ? (
                <section>
                  <SectionHeader title={related.heading} className="mb-4" />
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                    {related.items.map((m) => (
                      <PosterCard
                        key={`${m.mediaType}-${m.tmdbId}-${m.seasonNumber ?? 0}`}
                        media={m}
                        variant="below"
                      />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          </div>
        </div>
      </BackdropHero>

      {editing ? (
        <TrackingDialog
          entry={entry}
          open
          onOpenChange={(o) => !o && setEditing(false)}
          onSave={saveEdit}
          onDelete={() => {
            setStatus(null);
            setScore(null);
            setProgress(null);
            setEditing(false);
            toast("Removed from your library");
          }}
        />
      ) : null}
    </main>
  );
}

export { DetailLayout };
