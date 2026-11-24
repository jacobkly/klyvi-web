"use client";

import { Heart } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { useSession } from "@/components/auth/auth-provider";
import { recordInteraction } from "@/lib/api/interactions";
import {
  addTracking,
  deleteTracking,
  lookupTracking,
  updateTracking,
} from "@/lib/api/tracking";

import { SectionHeader } from "@/components/klyvi/section-header";
import { StatusControl } from "@/components/library/status-control";
import {
  TrackingDialog,
  type TrackingEdit,
} from "@/components/library/tracking-dialog";
import { AmbientArt } from "@/components/klyvi/ambient-art";
import { BackdropHero } from "@/components/media/backdrop-hero";
import { CastChips } from "@/components/media/cast-chips";
import { KeywordCard } from "@/components/media/keyword-card";
import { FactsPreview, MetadataList } from "@/components/media/metadata-list";
import { RatingDialog } from "@/components/media/rating-dialog";
import { TrailerButton } from "@/components/media/trailer-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Fact } from "@/lib/media-facts";
import type { CastMember, CrewGroup, Keyword } from "@/lib/mock-media";
import {
  STATUS_VERBS,
  type LibraryEntry,
  type TrackableSummary,
  type TrackingStatus,
} from "@/lib/types";
import { editToast } from "@/lib/edit-toast";
import { usePref } from "@/lib/local-prefs";
import { outLabel } from "@/lib/release";
import { formatScore } from "@/lib/score";
import { tmdbImage } from "@/lib/tmdb-image";
import { toastWithUndo } from "@/lib/undo-toast";

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
  actions,
  episodeCount,
  backdropPath,
  posterPath,
  title,
  year,
  certification = null,
  releaseDate = null,
  trailerKey = null,
  directorLine,
  tagline,
  overview,
  genres,
  metadata,
  strip = [],
  keywords,
  cast,
  crew,
  shelves,
  watch,
  extra,
  nav,
}: {
  media: TrackableSummary;
  /**
   * False on the series overview: only movies and seasons are trackable
   * units, so the series page points at its seasons instead of offering a
   * status control that would write a bogus entry.
   */
  trackable?: boolean;
  /** The action row for an untrackable page, in the status control's slot
   *  under the poster (the series page's SeriesActions). */
  actions?: React.ReactNode;
  /** Total episodes, for the season progress field. */
  episodeCount?: number | null;
  backdropPath: string | null;
  posterPath: string | null;
  title: string;
  year: number | null;
  /** The US age rating, shown beside the year. */
  certification?: string | null;
  /** The release or first-air date. A future one is shown as "Out 16
   *  December" and limits tracking to Planning. */
  releaseDate?: string | null;
  /** TMDB's official YouTube trailer. Null hides the Trailer button. */
  trailerKey?: string | null;
  directorLine: string | null;
  tagline: string | null;
  overview: string | null;
  genres: string[];
  metadata: Fact[];
  /** The phone's one-line summary under the title (runtime or seasons, and
   *  the average). Desktop has the facts column beside the content instead. */
  strip?: string[];
  keywords: Keyword[];
  cast: CastMember[];
  /** Crew grouped by role (Director, Writers, ...). Empty hides the section. */
  crew?: CrewGroup[];
  /** Poster shelves at the foot of the page (collection, more like this).
   *  A slot rather than data so the page can stream them in on their own
   *  Suspense boundary; see DetailShelves. */
  shelves?: React.ReactNode;
  /** Where to watch, first in the main column: it is what you act on. */
  watch?: React.ReactNode;
  extra?: React.ReactNode;
  /** Above the hero row: the season page's way back to its series. */
  nav?: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useSession();

  const [status, setStatus] = React.useState<TrackingStatus | null>(null);
  const [score, setScore] = React.useState<number | null>(null);
  const [progress, setProgress] = React.useState<number | null>(null);
  const [notes, setNotes] = React.useState<string | null>(null);
  const [favorite, setFavorite] = React.useState(false);
  /** The entry as the server last had it, and the internal media_id that
   *  PATCH and DELETE address. Writes run one at a time and read this when
   *  their turn comes, so a removal right after an add has an id to remove,
   *  and a failed write has something true to fall back to. */
  const saved = React.useRef<{ mediaId: number; edit: TrackingEdit } | null>(null);
  const queue = React.useRef<Promise<unknown>>(Promise.resolve());
  const latest = React.useRef(0);
  const [editing, setEditing] = React.useState(false);
  /** The completed entry the rating pop-up is asking about. */
  const [rating, setRating] = React.useState<TrackingEdit | null>(null);
  const [scoringSystem] = usePref("scoringSystem");
  const [overviewOpen, setOverviewOpen] = React.useState(false);
  const [crewOpen, setCrewOpen] = React.useState(false);
  const out = outLabel(releaseDate);

  /** Shows an entry, or no entry at all. */
  const show = React.useCallback((edit: TrackingEdit | null) => {
    setStatus(edit?.status ?? null);
    setScore(edit?.score ?? null);
    setProgress(edit?.progress ?? null);
    setNotes(edit?.notes ?? null);
    setFavorite(edit?.favorite ?? false);
  }, []);

  // Hydrate any existing entry so the control reflects reality on load. One
  // lookup for this title, not the whole library. Signed out (or API down)
  // this fails quietly; browsing stays public.
  React.useEffect(() => {
    if (!trackable || !user) return;
    let cancelled = false;
    lookupTracking({
      tmdbId: media.tmdbId,
      mediaType: media.mediaType,
      seasonNumber: media.seasonNumber,
    })
      .then((mine) => {
        if (cancelled) return;
        if (mine) {
          const { mediaId, status, score, progress, notes, favorite } = mine;
          const edit = { status, score, progress, notes, favorite };
          saved.current = { mediaId, edit };
          show(edit);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [trackable, user, media.tmdbId, media.mediaType, media.seasonNumber, show]);

  const current: TrackingEdit = {
    status: status ?? "planning",
    score,
    progress,
    notes,
    favorite,
  };

  /** The entry the dialog edits. */
  const entry: LibraryEntry = {
    ...media,
    ...current,
    progressTotal: episodeCount ?? null,
    updatedAt: "",
  };

  /** Tracking needs an account; the catalog does not. Send the signed-out
   *  visitor to sign in and bring them straight back here. */
  function signIn() {
    router.push(`/signin?next=${encodeURIComponent(pathname)}`);
  }

  /**
   * A pick from the menu saves at once, keeping the score, notes and
   * favorite. Completing a season counts every episode, and completing
   * anything unrated asks how it was. The editor opens only from the score
   * button.
   */
  function changeStatus(next: TrackingStatus) {
    if (!user) {
      signIn();
      return;
    }
    const total = media.mediaType === "season" ? episodeCount : null;
    const edit = {
      ...current,
      status: next,
      progress: next === "completed" && total ? total : progress,
    };
    if (next === "completed" && score == null) {
      // Saved quietly: the toast would sit on the pop-up's Save button.
      setRating(edit);
      persist(edit).catch(() => toast("Could not update that. Try again"));
    } else {
      saveEdit(edit);
    }
  }

  function skipRating() {
    setRating(null);
    if (status === "completed") toast(STATUS_VERBS.completed);
  }

  function toggleFavorite() {
    if (!status) return;
    saveEdit({ ...current, favorite: !favorite });
  }

  function saveEdit(edit: TrackingEdit) {
    const rated = edit.score !== score ? edit.score : null;
    toast(editToast({ status, score, favorite }, edit, scoringSystem));
    persist(edit)
      .then(() => {
        // The score is recommender signal too; tracking and interactions
        // are separate pillars server-side, so rating writes both.
        if (rated != null) {
          recordInteraction({
            tmdbId: media.tmdbId,
            mediaType: media.mediaType,
            seasonNumber: media.seasonNumber,
            kind: "rated",
            rating: rated,
            source: "detail",
          }).catch(() => {});
        }
      })
      .catch(() => toast("Could not update that. Try again"));
  }

  /**
   * Shows the change now and writes it in turn. A failure goes back to what
   * the server has, unless a later change is already on its way.
   */
  function write(edit: TrackingEdit | null, send: () => Promise<void>) {
    const turn = ++latest.current;
    show(edit);
    const run = queue.current.then(send).catch((err: unknown) => {
      if (turn === latest.current) show(saved.current?.edit ?? null);
      throw err;
    });
    queue.current = run.catch(() => {});
    return run;
  }

  function persist(edit: TrackingEdit) {
    return write(edit, async () => {
      const { progress: episodeProgress, ...rest } = edit;
      const fields = { ...rest, episodeProgress };
      const { mediaId } = saved.current
        ? await updateTracking(saved.current.mediaId, fields)
        : await addTracking({
            tmdbId: media.tmdbId,
            mediaType: media.mediaType,
            seasonNumber: media.seasonNumber,
            ...fields,
          });
      saved.current = { mediaId, edit };
    });
  }

  /** Out of the library at once, with Undo to put the same entry back. */
  function remove() {
    const prev = current;
    setEditing(false);
    const id = toastWithUndo({
      message: "Removed from your library",
      undoneMessage: "Back in your library",
      onUndo: () => persist(prev),
    });
    write(null, async () => {
      if (!saved.current) return;
      try {
        await deleteTracking(saved.current.mediaId);
      } catch (err) {
        // Already gone server-side: silence, per the copy doc.
        if ((err as { status?: number })?.status !== 404) throw err;
      }
      saved.current = null;
    }).catch(() =>
      toast("Could not update that. Try again", { id, action: undefined })
    );
  }

  const controls = !trackable ? (
    <>
      {actions}
      <p className="text-xs text-muted-foreground">
        Track this show season by season below.
      </p>
    </>
  ) : !user && !loading ? (
    <Button size="touch" className="w-full" onClick={signIn}>
      Sign in to track
    </Button>
  ) : (
    <div className="flex flex-wrap gap-2 sm:flex-col">
      <StatusControl
        status={status}
        onChange={changeStatus}
        onRemove={remove}
        options={out ? ["planning"] : undefined}
        size="touch"
        className="min-w-0 grow basis-36 sm:w-full sm:flex-none"
      />
      {status ? (
        <div className="flex grow gap-2 sm:flex-none">
          <Button
            variant="outline"
            size="touch"
            className="grow px-3"
            onClick={() => setEditing(true)}
          >
            {score != null
              ? `Your score: ${formatScore(score, scoringSystem)}`
              : "Add a score"}
          </Button>
          <Button
            variant="outline"
            size="icon-touch"
            aria-label="Favorite"
            aria-pressed={favorite}
            className={favorite ? "text-violet-text hover:text-violet-text" : undefined}
            onClick={toggleFavorite}
          >
            <Heart
              aria-hidden="true"
              className={favorite ? "size-5 fill-current" : "size-5"}
            />
          </Button>
        </div>
      ) : null}
    </div>
  );

  return (
    <main className="mx-auto w-full max-w-[1400px]">
      {/* The title's own art lights the room below the hero too. */}
      <AmbientArt path={backdropPath} />
      <BackdropHero backdropPath={backdropPath}>
        <div className="px-4 md:px-6">
          {nav}
          {/* The hero is one grid so the controls exist once. Phone: poster
              beside the title, controls across, then the story. Wider: the
              controls sit under the poster and the story beside them. */}
          <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-4 gap-y-5 [grid-template-areas:'poster_head'_'ctrl_ctrl'_'body_body'] sm:grid-cols-[11rem_minmax(0,1fr)] sm:grid-rows-[auto_auto_1fr] sm:gap-x-8 sm:gap-y-3 sm:[grid-template-areas:'poster_head'_'poster_body'_'ctrl_body'] lg:grid-cols-[13rem_minmax(0,1fr)]">
            <div className="relative aspect-[2/3] self-start overflow-hidden rounded-art bg-muted ring-1 ring-foreground/10 [grid-area:poster]">
              {posterPath ? (
                <Image
                  src={tmdbImage(posterPath)}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 640px) 112px, 208px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center p-3 text-center">
                  <span className="text-xs text-muted-foreground">{title}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 [grid-area:ctrl]">{controls}</div>

            {/* Title block: the Letterboxd hierarchy trick. */}
            <div className="min-w-0 self-end [grid-area:head] sm:self-start sm:pt-10 lg:pt-16">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                {title}
              </h1>
              {year != null || certification || out || favorite ? (
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-muted-foreground">
                  {year != null ? (
                    <span data-numeric className="font-mono">
                      {year}
                    </span>
                  ) : null}
                  {certification ? (
                    <span className="rounded-full border border-border px-2 font-mono text-[11px] font-medium">
                      <span className="sr-only">Rated </span>
                      {certification}
                    </span>
                  ) : null}
                  {out ? (
                    <span className="font-medium text-foreground">{out}</span>
                  ) : null}
                  {favorite ? (
                    <span className="inline-flex items-center gap-1">
                      <Heart aria-hidden="true" className="size-3.5 fill-current" />
                      Favorite
                    </span>
                  ) : null}
                </div>
              ) : null}

              {directorLine ? (
                <p className="mt-1.5 text-sm text-muted-foreground">{directorLine}</p>
              ) : null}

              {strip.length > 0 ? (
                <p
                  data-testid="fact-strip"
                  data-numeric
                  className="mt-1.5 font-mono text-[13px] text-muted-foreground lg:hidden"
                >
                  {strip.join(" · ")}
                </p>
              ) : null}

              {genres.length > 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {genres.join(" · ")}
                </p>
              ) : null}
            </div>

            <div className="min-w-0 [grid-area:body]">
              {tagline ? (
                <p className="mb-2 text-xs font-medium tracking-[0.12em] uppercase text-muted-foreground sm:mt-2">
                  {tagline}
                </p>
              ) : null}

              {overview ? (
                <>
                  <p
                    className={
                      overviewOpen
                        ? "max-w-[65ch] text-[15px] leading-relaxed text-foreground/90"
                        : "line-clamp-4 max-w-[65ch] text-[15px] leading-relaxed text-foreground/90"
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
                <p className="text-sm text-muted-foreground">
                  No synopsis available for this one yet.
                </p>
              )}

              <FactsPreview items={metadata} />

              <TrailerButton title={title} trailerKey={trailerKey} />
            </div>
          </div>

          {/* Body: metadata rail + content. Stacks with the rail LAST on
              mobile, reference material rather than orientation. */}
          <div className="mt-10 flex flex-col-reverse gap-10 pb-16 lg:flex-row">
            <aside className="w-full shrink-0 lg:w-52">
              <MetadataList items={metadata} className="hidden lg:flex" />
              <div className="lg:mt-8">
                <KeywordCard keywords={keywords} />
              </div>
            </aside>

            <div className="min-w-0 flex-1">
              {watch}
              {extra}

              <section className="mb-10">
                <SectionHeader title="Cast" className="mb-4" />
                <CastChips cast={cast} />
              </section>

              {crew && crew.length > 0 ? (
                <section className="mb-10">
                  <SectionHeader title="Crew" className="mb-4" />
                  {!crewOpen ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="hit-44 relative lg:hidden"
                      onClick={() => setCrewOpen(true)}
                    >
                      Show crew
                    </Button>
                  ) : null}
                  <div
                    className={
                      crewOpen ? "flex flex-col gap-3" : "hidden flex-col gap-3 lg:flex"
                    }
                  >
                    {crew.map((g) => (
                      <div
                        key={g.role}
                        className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:gap-4"
                      >
                        <span className="shrink-0 pt-0.5 text-xs font-medium tracking-[0.12em] uppercase text-muted-foreground sm:w-36">
                          {g.role}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {g.names.map((n) => (
                            <Badge key={n} variant="secondary">
                              {n}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {shelves}
            </div>
          </div>
        </div>
      </BackdropHero>

      {editing ? (
        <TrackingDialog
          entry={entry}
          isNew={status == null}
          open
          onOpenChange={(o) => {
            if (!o) setEditing(false);
          }}
          onSave={saveEdit}
          onDelete={remove}
        />
      ) : null}

      {rating ? (
        <RatingDialog
          title={title}
          year={year}
          posterPath={posterPath}
          skipLabel="Skip for now"
          open
          onOpenChange={(o) => {
            if (!o) skipRating();
          }}
          onSubmit={(value) => {
            if (value == null) {
              skipRating();
              return;
            }
            setRating(null);
            saveEdit({ ...rating, score: value });
          }}
        />
      ) : null}
    </main>
  );
}

export { DetailLayout };
