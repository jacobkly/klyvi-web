"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import {
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { useSession } from "@/components/auth/auth-provider";
import { EmptyState } from "@/components/klyvi/empty-state";
import { RatingDialog } from "@/components/media/rating-dialog";
import { ReasonChips } from "@/components/klyvi/reason-chips";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getMovie } from "@/lib/api/catalog";
import { recordInteraction } from "@/lib/api/interactions";
import { getFeed } from "@/lib/api/reco";
import { addTracking } from "@/lib/api/tracking";
import { listInteractions } from "@/lib/api/interactions";
import { mockFeed, mockInteractionCount, type RecoTier } from "@/lib/mock-reco";
import { formatRuntime, type MovieDetail } from "@/lib/mock-media";
import { watchWindowPhrase } from "@/lib/time-of-day";
import { posterUrl, type Scored } from "@/lib/types";

const TIER_THRESHOLD = 20; // klyvi/docs/API.md: Tier 2 at >= 20 interactions.

/**
 * Moods are honest client-side lenses over the feed, not server queries.
 * Each one names the data it reads; anything it cannot see passes through.
 */
const MOODS: {
  id: string;
  label: string;
  fits: (s: Scored, d: MovieDetail | null) => boolean;
}[] = [
  { id: "any", label: "Anything", fits: () => true },
  {
    id: "short",
    label: "Under 2 hours",
    fits: (_s, d) => d?.runtime != null && d.runtime <= 120,
  },
  {
    id: "slow",
    label: "Slow burn",
    fits: (_s, d) =>
      d != null &&
      (d.keywords.some((k) => /slow.?burn|psychological/i.test(k.name)) ||
        (d.genres.includes("Drama") && !d.genres.includes("Action"))),
  },
  {
    id: "light",
    label: "Something light",
    fits: (_s, d) =>
      d != null &&
      d.genres.some((g) => ["Comedy", "Romance", "Family", "Animation"].includes(g)) &&
      !d.genres.includes("Horror"),
  },
  {
    id: "heavy",
    label: "Heavy",
    fits: (_s, d) =>
      d != null &&
      d.genres.some((g) => ["Drama", "War", "Crime", "Thriller"].includes(g)) &&
      !d.genres.includes("Comedy"),
  },
  {
    id: "old",
    label: "Twentieth century",
    fits: (s) => s.year != null && s.year < 2000,
  },
];

type Phase =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; picks: Scored[]; index: number };

/**
 * Find Next, built as a decision surface rather than a list: ONE pick at a
 * time, full-bleed backdrop, reasons prominent, the rest of the set behind
 * arrows. Live data comes from /v1/reco/feed; the synopsis, runtime, and
 * genres are hydrated per pick from /v1/movies/{id} because the feed does
 * not carry them.
 */
export function FindClient({ simulate }: { simulate?: string }) {
  const { user } = useSession();
  const mock = simulate != null;

  const [mood, setMood] = React.useState("any");
  const [count, setCount] = React.useState<3 | 5 | 7>(5);
  const [phase, setPhase] = React.useState<Phase>({ kind: "idle" });
  const [interactions, setInteractions] = React.useState<number | null>(null);
  const [rating, setRating] = React.useState<Scored | null>(null);
  /** tmdbId → detail; session-lived hydration cache. */
  const detailsRef = React.useRef(new Map<number, MovieDetail | null>());
  const [, forceRender] = React.useReducer((n: number) => n + 1, 0);

  const mockTier: RecoTier =
    simulate === "tier0" ? 0 : simulate === "tier2" ? 2 : 1;

  // Real interaction count drives the tier copy.
  React.useEffect(() => {
    if (mock) {
      setInteractions(mockInteractionCount(mockTier));
      return;
    }
    if (!user) return;
    listInteractions()
      .then((list) =>
        setInteractions(list.filter((i) => i.kind === "rated").length)
      )
      .catch(() => setInteractions(null));
  }, [mock, mockTier, user]);

  const remaining =
    interactions != null ? Math.max(0, TIER_THRESHOLD - interactions) : null;

  async function hydrate(pick: Scored | undefined) {
    if (!pick || pick.mediaType !== "movie") return;
    if (detailsRef.current.has(pick.tmdbId)) return;
    try {
      const d = await getMovie(pick.tmdbId);
      detailsRef.current.set(pick.tmdbId, d);
    } catch {
      detailsRef.current.set(pick.tmdbId, null);
    }
    forceRender();
  }

  async function fetchPicks() {
    setPhase({ kind: "loading" });

    if (mock) {
      setTimeout(() => {
        if (simulate === "error") setPhase({ kind: "error" });
        else if (simulate === "exhausted")
          setPhase({ kind: "ready", picks: [], index: 0 });
        else
          setPhase({
            kind: "ready",
            picks: mockFeed(mockTier, count),
            index: 0,
          });
      }, 550);
      return;
    }

    try {
      let feed = await getFeed();

      // A chosen mood needs the details to judge, so hydrate the whole feed
      // (bounded: the feed caps at 30, and the catalog cache makes repeats
      // cheap), then filter. "Anything" skips straight through.
      const m = MOODS.find((x) => x.id === mood) ?? MOODS[0];
      if (m.id !== "any") {
        await Promise.all(feed.map((p) => hydrate(p)));
        feed = feed.filter((p) =>
          m.fits(p, detailsRef.current.get(p.tmdbId) ?? null)
        );
      }

      const picks = feed.slice(0, count).map((p) => {
        const d = detailsRef.current.get(p.tmdbId);
        return d
          ? {
              ...p,
              overview: d.overview,
              runtime: d.runtime,
              genres: d.genres,
              backdropPath: p.backdropPath ?? d.backdropPath,
            }
          : p;
      });
      setPhase({ kind: "ready", picks, index: 0 });
      void hydrate(picks[0]);
      void hydrate(picks[1]);
    } catch {
      setPhase({ kind: "error" });
    }
  }

  function step(dir: 1 | -1) {
    if (phase.kind !== "ready") return;
    const next = phase.index + dir;
    if (next < 0 || next >= phase.picks.length) return;
    setPhase({ ...phase, index: next });
    void hydrate(phase.picks[next + 1]);
  }

  function removeCurrent() {
    if (phase.kind !== "ready") return;
    const cur = phase.picks[phase.index];
    const picks = phase.picks.filter((p) => p.mediaId !== cur.mediaId);
    setPhase({
      kind: "ready",
      picks,
      index: Math.min(phase.index, Math.max(0, picks.length - 1)),
    });
  }

  function act(kind: "save" | "seen" | "dismiss") {
    if (phase.kind !== "ready") return;
    const cur = phase.picks[phase.index];

    if (kind === "seen") {
      // The one moment the user is already thinking about the film is the
      // moment to ask how it was: a watched-but-unrated title is the weakest
      // signal the recommender can get.
      setRating(cur);
      return;
    }

    if (kind === "save") {
      toast("Added to your watchlist");
      if (!mock) {
        addTracking({
          tmdbId: cur.tmdbId,
          mediaType: "movie",
          status: "planning",
        }).catch(() => toast("Could not update that. Try again"));
        recordInteraction({
          tmdbId: cur.tmdbId,
          mediaType: "movie",
          kind: "saved",
          source: "feed",
        }).catch(() => {});
      }
    }
    if (kind === "dismiss") {
      toast("Hidden from your recommendations");
      if (!mock) {
        recordInteraction({
          tmdbId: cur.tmdbId,
          mediaType: "movie",
          kind: "dismissed",
          source: "feed",
        }).catch(() => {});
      }
    }
    removeCurrent();
  }

  function submitRating(score: number | null) {
    const cur = rating;
    setRating(null);
    if (!cur) return;
    toast(score != null ? "Rated" : "Marked as seen");
    if (!mock) {
      if (score != null) {
        recordInteraction({
          tmdbId: cur.tmdbId,
          mediaType: "movie",
          kind: "rated",
          rating: score,
          source: "feed",
        }).catch(() => {});
        setInteractions((n) => (n != null ? n + 1 : n));
      } else {
        recordInteraction({
          tmdbId: cur.tmdbId,
          mediaType: "movie",
          kind: "logged",
          source: "feed",
        }).catch(() => {});
      }
      addTracking({
        tmdbId: cur.tmdbId,
        mediaType: "movie",
        status: "completed",
        score,
      }).catch(() => {});
    }
    removeCurrent();
  }

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase.kind !== "ready" || rating) return;
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ---------- idle ----------
  if (phase.kind === "idle") {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-16 md:px-6">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          What are you in the mood for?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick a shape, or do not. Klyvi will find one thing worth your
          time.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMood(m.id)}
              aria-pressed={mood === m.id}
              className={
                "tap-target rounded-full px-4 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30 " +
                (mood === m.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground")
              }
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">How many?</span>
          <ToggleGroup
            value={[String(count)]}
            onValueChange={(v: unknown[]) => {
              const n = Number(v.at(-1));
              if (n === 3 || n === 5 || n === 7) setCount(n);
            }}
            spacing={0}
            variant="outline"
            aria-label="How many picks"
          >
            {[3, 5, 7].map((n) => (
              <ToggleGroupItem key={n} value={String(n)} className="font-mono">
                {n}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <Button
          size="touch"
          onClick={() => void fetchPicks()}
          className="mt-6 gap-2 self-start"
        >
          <Sparkles aria-hidden="true" data-icon="inline-start" />
          Find something
        </Button>

        <p className="mt-8 text-xs text-muted-foreground">
          Films only for now. Klyvi tracks TV but does not recommend it yet.
        </p>
      </main>
    );
  }

  // ---------- loading ----------
  if (phase.kind === "loading") {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-10 md:px-6">
        <Skeleton className="aspect-[16/9] w-full rounded-lg" />
        <Skeleton className="mt-6 h-8 w-2/3 rounded-lg" />
        <Skeleton className="mt-3 h-5 w-1/3 rounded-lg" />
      </main>
    );
  }

  // ---------- error ----------
  if (phase.kind === "error") {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-24 text-center md:px-6">
        <p className="text-[15px] font-semibold text-foreground">
          Could not get your recommendations.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Something went wrong on Klyvi&apos;s end.
        </p>
        <Button className="mt-5" onClick={() => void fetchPicks()}>
          Try again
        </Button>
      </main>
    );
  }

  // ---------- exhausted / empty ----------
  if (phase.picks.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-10 md:px-6">
        {mood !== "any" ? (
          <EmptyState
            icon={Sparkles}
            title="Nothing fits that mood right now"
            body="The current picks do not match this lens. Loosen it and something surfaces."
            action={{
              label: "Show anything",
              onClick: () => {
                setMood("any");
                setPhase({ kind: "idle" });
              },
            }}
          />
        ) : interactions === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Not enough to go on yet"
            body="Rate about 20 films and Klyvi can make a real recommendation. It takes about 90 seconds."
            action={{ label: "Start rating", href: "/onboarding/rate" }}
          />
        ) : (
          <EmptyState
            icon={Sparkles}
            title="You have seen everything Klyvi has for you"
            body="You have been through every pick in your current taste profile. Rate a few more titles and new ones open up."
            action={{ label: "Go to your library", href: "/library" }}
          />
        )}
      </main>
    );
  }

  // ---------- the pick ----------
  const pick = phase.picks[phase.index];
  const detail = detailsRef.current.get(pick.tmdbId) ?? null;
  const overview = pick.overview ?? detail?.overview ?? null;
  const runtime = pick.runtime ?? detail?.runtime ?? null;
  const genres = pick.genres.length > 0 ? pick.genres : (detail?.genres ?? []);
  // Read at render, which only ever happens on the client here: the pick
  // view appears after the user asks for a set, so there is no server pass
  // to disagree with about the hour.
  const timePhrase = watchWindowPhrase();
  const prev = phase.index > 0 ? phase.picks[phase.index - 1] : null;
  const next =
    phase.index < phase.picks.length - 1 ? phase.picks[phase.index + 1] : null;
  const total = phase.picks.length;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-8 md:px-6">
      <header className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {total === 1
            ? `Your pick for ${timePhrase}`
            : `Your ${total} picks for ${timePhrase}`}
        </h1>
        <p data-numeric className="mt-1 font-mono text-xs text-muted-foreground">
          {phase.index + 1} of {total}
        </p>
      </header>

      {/* The stage. The current pick sits on top at two thirds of the width;
          each neighbour is the same card, behind it, centred on the same
          line and pushed out far enough to leave only a sliver overlapping.
          Stacking rather than a three-column grid on purpose: in a grid the
          side tracks size to their content, so the neighbours refuse to
          shrink and crush the centre column instead of being clipped. */}
      <div className="mt-6 overflow-hidden">
        <div className="relative mx-auto w-full lg:w-2/3">
          {prev ? (
            <NeighbourPick pick={prev} side="left" onClick={() => step(-1)} />
          ) : null}
          {next ? (
            <NeighbourPick pick={next} side="right" onClick={() => step(1)} />
          ) : null}

          <div className="relative z-10">
            <PickHero pick={pick} detail={detail} priority />

            {/* Fixed height, because this is the only part of the card whose
                size follows the film. Letting it size to the synopsis moved
                the buttons and the pager every time the user stepped from a
                terse film to a wordy one, which made them hard to hit. */}
            <div className="flex min-h-[15.5rem] flex-col justify-start">
          {/* Why. The differentiator, given real room rather than a corner. */}
          <div className="mt-6 text-center">
            {pick.reasons.length > 0 ? (
              <>
                <h2 className="text-xs font-medium tracking-[0.12em] uppercase text-muted-foreground">
                  Why this one
                </h2>
                <ReasonChips
                  reasons={pick.reasons}
                  max={4}
                  className="mt-2.5 justify-center"
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                This is a pick people tend to agree on. Rate a few and Klyvi
                starts explaining why it picked things for you specifically.
              </p>
            )}
          </div>

          {/* What it actually is: the synopsis sits with the reasons, not a
              click away on the detail page. Clamped so a long one cannot
              outgrow the reserved space; "More about it" has the rest. */}
          {overview ? (
            <p className="mx-auto mt-5 line-clamp-5 max-w-[60ch] text-center text-[15px] leading-relaxed text-foreground/90">
              {overview}
            </p>
          ) : null}

          {genres.length > 0 || runtime != null ? (
            <p className="mt-3 text-center text-sm text-muted-foreground">
              {[
                genres.join(" · "),
                runtime != null ? formatRuntime(runtime) : null,
              ]
                .filter(Boolean)
                .join("  •  ")}
            </p>
          ) : null}
            </div>

          {/* Decide. */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            <Button size="touch" className="gap-2" onClick={() => act("save")}>
              <Bookmark aria-hidden="true" data-icon="inline-start" />
              Add to watchlist
            </Button>
            <Link
              href={`/movie/${pick.tmdbId}`}
              className={buttonVariants({ variant: "outline", size: "touch" })}
            >
              More about it
            </Link>
            <Button
              variant="ghost"
              size="touch"
              className="gap-2"
              onClick={() => act("seen")}
            >
              <Check aria-hidden="true" data-icon="inline-start" />
              Seen it
            </Button>
            <Button
              variant="ghost"
              size="touch"
              className="gap-2 text-muted-foreground"
              onClick={() => act("dismiss")}
            >
              <EyeOff aria-hidden="true" data-icon="inline-start" />
              Not interested
            </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Moving between picks, centred under the card. Its position never
          depends on the film, which is the point: the pager sits in the
          same place whichever pick is showing. */}
      <div className="mx-auto mt-8 flex max-w-[44rem] flex-col items-center gap-3 border-t border-border pt-5">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous pick"
            disabled={phase.index === 0}
            onClick={() => step(-1)}
          >
            <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={2} />
          </Button>
          <span data-numeric className="font-mono text-xs text-muted-foreground">
            {phase.index + 1} / {total}
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next pick"
            disabled={phase.index >= total - 1}
            onClick={() => step(1)}
          >
            <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2} />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => void fetchPicks()}
        >
          <RotateCcw aria-hidden="true" data-icon="inline-start" />
          New set
        </Button>
      </div>

      {remaining != null && remaining > 0 && interactions !== 0 ? (
        <p
          data-numeric
          className="mx-auto mt-5 max-w-[44rem] text-sm text-muted-foreground"
        >
          {remaining} more {remaining === 1 ? "rating" : "ratings"} and Klyvi
          switches to your full taste profile.
        </p>
      ) : null}

      {rating ? (
        <RatingDialog
          title={rating.title}
          year={rating.year}
          posterPath={rating.posterPath}
          open
          onOpenChange={(o) => !o && setRating(null)}
          onSubmit={submitRating}
        />
      ) : null}
    </main>
  );
}

/**
 * The backdrop-led hero: one title, full attention. Shared by the current
 * pick and by its neighbours, so a peek is visually the same object rather
 * than a different card that happens to sit beside it.
 */
function PickHero({
  pick,
  detail,
  priority,
}: {
  pick: Scored;
  detail?: MovieDetail | null;
  priority?: boolean;
}) {
  const backdropPath = pick.backdropPath ?? detail?.backdropPath ?? null;
  const poster = posterUrl(pick.posterPath, "w500");

  return (
    <div className="relative overflow-hidden rounded-lg ring-1 ring-foreground/10">
      <div className="relative aspect-[16/10] sm:aspect-[16/7]">
        {backdropPath ? (
          <Image
            src={`https://image.tmdb.org/t/p/w1280${backdropPath}`}
            alt=""
            fill
            priority={priority}
            sizes="(max-width: 1024px) 100vw, 704px"
            className="object-cover"
          />
        ) : poster ? (
          <Image
            src={poster}
            alt=""
            fill
            priority={priority}
            sizes="(max-width: 1024px) 100vw, 704px"
            className="object-cover object-top blur-2xl"
          />
        ) : (
          <div className="h-full bg-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-4 sm:gap-5 sm:p-6">
        <Link
          href={`/movie/${pick.tmdbId}`}
          aria-label={pick.title}
          className="hidden w-24 shrink-0 rounded-art outline-none focus-visible:ring-3 focus-visible:ring-ring/30 sm:block"
        >
          <div className="relative aspect-[2/3] overflow-hidden rounded-art bg-muted ring-1 ring-foreground/10">
            {poster ? (
              <Image
                src={poster}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : null}
          </div>
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            href={`/movie/${pick.tmdbId}`}
            className="rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {pick.title}
            </h2>
          </Link>
          {/* Year and score share a line under the title: both are numbers
              about the film, and stacking them cost a row for no reason. */}
          {pick.year != null || pick.voteAverage != null ? (
            <p
              data-numeric
              className="mt-1.5 flex items-baseline gap-4 font-mono text-sm text-muted-foreground"
            >
              {pick.year != null ? <span>{pick.year}</span> : null}
              {pick.voteAverage != null ? (
                <span>
                  <span className="text-foreground">
                    {Math.round(pick.voteAverage * 10)}
                  </span>{" "}
                  / 100
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * The pick on either side, as its poster.
 *
 * A poster rather than the backdrop card: at this size the artwork is the
 * only part that reads, and a poster is the shape the eye already treats as
 * "another film" everywhere else in the app.
 *
 * `right-full` / `left-full` pin it just outside the centre card's edge, so
 * the gap is a margin rather than a percentage guess, and nothing overlaps.
 * Being absolutely positioned it adds no height, which is what keeps the
 * pager from moving when the neighbours change.
 *
 * The whole poster is one button, so a peek is a shortcut rather than
 * decoration. Its interior is inert and hidden from screen readers, which
 * reach the same picks through the Previous and Next controls.
 */
function NeighbourPick({
  pick,
  side,
  onClick,
}: {
  pick: Scored;
  side: "left" | "right";
  onClick: () => void;
}) {
  const poster = posterUrl(pick.posterPath, "w342");

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${side === "left" ? "Previous" : "Next"} pick: ${pick.title}`}
      className={
        "absolute top-1/2 hidden w-32 -translate-y-1/2 cursor-pointer rounded-art opacity-40 transition-opacity duration-(--dur-base) outline-none hover:opacity-75 focus-visible:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/30 lg:block xl:w-36 " +
        (side === "left" ? "right-full mr-6" : "left-full ml-6")
      }
    >
      <div
        aria-hidden="true"
        className="pointer-events-none relative aspect-[2/3] overflow-hidden rounded-art bg-muted ring-1 ring-foreground/10"
      >
        {poster ? (
          <Image
            src={poster}
            alt=""
            fill
            sizes="144px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-2 text-center">
            <span className="text-xs text-muted-foreground">{pick.title}</span>
          </div>
        )}
      </div>
    </button>
  );
}
