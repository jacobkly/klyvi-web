"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import {
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Info,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import { useSession } from "@/components/auth/auth-provider";
import { NeighbourPick, PickHero } from "@/components/find/pick-stage";
import { EmptyState } from "@/components/klyvi/empty-state";
import { RatingDialog } from "@/components/media/rating-dialog";
import { ReasonChips } from "@/components/klyvi/reason-chips";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getFeed } from "@/lib/api/reco";
import { listInteractions } from "@/lib/api/interactions";
import { queueSignal } from "@/lib/interactions-batch";
import { dismissPick, ratePick, savePick } from "@/lib/pick-actions";
import { mockFeed, mockInteractionCount, type RecoTier } from "@/lib/mock-reco";
import { usePref } from "@/lib/local-prefs";
import { mediaHref } from "@/lib/media-href";
import { formatRuntime, formatSeasons } from "@/lib/mock-media";
import { useReducedMotion } from "@/lib/motion";
import { watchWindowPhrase } from "@/lib/time-of-day";
import type { FeedMedia, Scored } from "@/lib/types";
import { cn } from "@/lib/utils";

const TIER_THRESHOLD = 20; // klyvi/docs/API.md: Tier 2 at >= 20 interactions.

/**
 * Moods are honest client-side lenses over the feed, not server queries.
 * Each one reads only what the feed carries (runtime, genres, year, and the
 * keywords named in its reasons); a pick missing that data does not fit.
 * A films-only mood reads a runtime, which a whole show does not have.
 */
const MOODS: {
  id: string;
  label: string;
  filmsOnly?: boolean;
  fits: (s: Scored) => boolean;
}[] = [
  { id: "any", label: "Anything", fits: () => true },
  {
    id: "short",
    label: "Under 2 hours",
    filmsOnly: true,
    fits: (s) => s.runtime != null && s.runtime <= 120,
  },
  {
    id: "slow",
    label: "Slow burn",
    fits: (s) =>
      s.reasons.some(
        (r) =>
          r.kind === "keyword" && /slow.?burn|psychological/i.test(r.name ?? "")
      ) ||
      (s.genres.includes("Drama") && !s.genres.includes("Action")),
  },
  {
    id: "light",
    label: "Something light",
    fits: (s) =>
      s.genres.some((g) => ["Comedy", "Romance", "Family", "Animation"].includes(g)) &&
      !s.genres.includes("Horror"),
  },
  {
    id: "heavy",
    label: "Heavy",
    fits: (s) =>
      s.genres.some((g) => ["Drama", "War", "Crime", "Thriller"].includes(g)) &&
      !s.genres.includes("Comedy"),
  },
  {
    id: "old",
    label: "Twentieth century",
    fits: (s) => s.year != null && s.year < 2000,
  },
];

/** The feed filter. The labels match the Library's type filter. */
const MEDIA: { value: FeedMedia; label: string }[] = [
  { value: "all", label: "All" },
  { value: "movie", label: "Films" },
  { value: "tv", label: "TV" },
];

type Phase =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error" }
  | {
      kind: "ready";
      picks: Scored[];
      index: number;
      /** The rest of the feed that fits, which refills the set as picks
       *  leave it. */
      reserve: Scored[];
      /** How many picks were asked for. */
      size: number;
    };

/**
 * Find Next, built as a decision surface rather than a list: ONE pick at a
 * time, full-bleed backdrop, reasons prominent, the rest of the set behind
 * arrows. Everything on screen, synopsis, runtime, and genres included,
 * comes from one /v1/reco/feed request.
 */
export function FindClient({ simulate }: { simulate?: string }) {
  const { user } = useSession();
  const router = useRouter();
  const mock = simulate != null;

  const [mood, setMood] = React.useState("any");
  const [media, setMedia] = usePref("findMedia");
  const filmsOnlyMood = MOODS.find((x) => x.id === mood)?.filmsOnly === true;
  const [count, setCount] = React.useState<3 | 5 | 7>(5);
  const [phase, setPhase] = React.useState<Phase>({ kind: "idle" });
  const [fetchedInteractions, setInteractions] = React.useState<
    number | null
  >(null);
  const [rating, setRating] = React.useState<Scored | null>(null);
  const reduceMotion = useReducedMotion();
  const topRef = React.useRef<HTMLElement>(null);
  // Counts the picks that have left the set, so each departure brings the
  // next pick into full view.
  const [departures, setDepartures] = React.useState(0);

  const mockTier: RecoTier =
    simulate === "tier0" ? 0 : simulate === "tier2" ? 2 : 1;
  const interactions = mock
    ? mockInteractionCount(mockTier)
    : fetchedInteractions;

  // Real interaction count drives the tier copy.
  React.useEffect(() => {
    if (mock || !user) return;
    listInteractions({ kind: "rated" })
      .then((list) =>
        setInteractions(list.filter((i) => i.kind === "rated").length)
      )
      .catch(() => setInteractions(null));
  }, [mock, user]);

  const remaining =
    interactions != null ? Math.max(0, TIER_THRESHOLD - interactions) : null;

  // A pick the user is actually looking at is an impression; the batcher
  // dedupes and holds them, so stepping back and forth costs nothing.
  const sawPick = React.useCallback(
    (p: Scored | undefined) => {
      if (!p || mock) return;
      queueSignal({
        tmdbId: p.tmdbId,
        mediaType: p.mediaType,
        kind: "impression",
        source: "feed",
      });
    },
    [mock]
  );

  // The picks are a step past the mood, so Back returns to the mood rather
  // than leaving Find. The entry keeps the same url, and Next's patched
  // pushState carries its own router state into it.
  React.useEffect(() => {
    const onPop = () => {
      if (window.history.state?.findStage !== "picks") {
        setPhase({ kind: "idle" });
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  async function fetchPicks() {
    if (phase.kind === "idle") {
      window.history.pushState({ findStage: "picks" }, "");
    }
    setPhase({ kind: "loading" });

    if (mock) {
      setTimeout(() => {
        if (simulate === "error") setPhase({ kind: "error" });
        else if (simulate === "exhausted")
          setPhase({ kind: "ready", picks: [], index: 0, reserve: [], size: count });
        else
          setPhase({
            kind: "ready",
            picks: mockFeed(mockTier, count),
            index: 0,
            reserve: [],
            size: count,
          });
      }, 550);
      return;
    }

    try {
      const m = MOODS.find((x) => x.id === mood) ?? MOODS[0];
      // A films-only mood asks for the films feed, so every slot is a
      // candidate instead of the share a mixed feed leaves to films.
      const feed = await getFeed({ media: m.filmsOnly ? "movie" : media });
      const fits = feed.filter(m.fits);
      const picks = fits.slice(0, count);
      setPhase({
        kind: "ready",
        picks,
        index: 0,
        reserve: fits.slice(count),
        size: count,
      });
      sawPick(picks[0]);
    } catch {
      setPhase({ kind: "error" });
    }
  }

  function chooseMedia(next: FeedMedia) {
    setMedia(next);
    // A films-only mood cannot hold under TV, so it goes back to Anything.
    if (next === "tv" && filmsOnlyMood) setMood("any");
  }

  function step(dir: 1 | -1) {
    if (phase.kind !== "ready") return;
    const next = phase.index + dir;
    if (next < 0 || next >= phase.picks.length) return;
    setPhase({ ...phase, index: next });
    sawPick(phase.picks[next]);
  }

  /** The current pick leaves, and the next one that fits joins the end of
   *  the set, so it stays the size asked for while the feed lasts. */
  function removeCurrent() {
    if (phase.kind !== "ready") return;
    const cur = phase.picks[phase.index];
    const [refill, ...reserve] = phase.reserve;
    const picks = phase.picks.filter((p) => p.mediaId !== cur.mediaId);
    if (refill) picks.push(refill);
    setPhase({
      ...phase,
      picks,
      reserve,
      index: Math.min(phase.index, Math.max(0, picks.length - 1)),
    });
    setDepartures((n) => n + 1);
  }

  /** Undo on a hidden pick: it goes back where it was and is shown again.
   *  A set that would grow past its size hands its last pick back to the
   *  reserve. Read from the latest phase, since the toast outlives renders. */
  function restore(p: Scored, at: number) {
    setPhase((ph) => {
      if (ph.kind !== "ready" || ph.picks.some((x) => x.mediaId === p.mediaId)) {
        return ph;
      }
      const picks = [...ph.picks];
      const index = Math.min(at, picks.length);
      picks.splice(index, 0, p);
      let reserve = ph.reserve;
      if (picks.length > ph.size) reserve = [picks.pop() as Scored, ...reserve];
      return { ...ph, picks, reserve, index };
    });
    setDepartures((n) => n + 1);
  }

  // A pick left (or came back): the next one belongs in full view, not cut
  // off under wherever the page was scrolled to reach the buttons.
  React.useEffect(() => {
    if (departures === 0) return;
    topRef.current?.scrollIntoView?.({
      block: "start",
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [departures, reduceMotion]);

  /** A show is recommended whole but tracked season by season, so a toast
   *  about one points at its page, where the seasons are. */
  const trackSeasons = (p: Scored) => ({
    label: "Track seasons",
    onClick: () => router.push(mediaHref(p)),
  });

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

    if (kind === "save") savePick(cur, { mock, seasons: trackSeasons });
    if (kind === "dismiss") {
      const at = phase.index;
      dismissPick(cur, { mock, onUndo: () => restore(cur, at) });
    }
    removeCurrent();
  }

  function submitRating(score: number | null) {
    const cur = rating;
    setRating(null);
    if (!cur) return;
    ratePick(cur, score, { mock, seasons: trackSeasons });
    if (!mock && score != null) setInteractions((n) => (n != null ? n + 1 : n));
    removeCurrent();
  }

  // Phones swipe between picks. The card follows the finger sideways, and a
  // drag past a quarter of its width (or 60px) steps. A mostly vertical drag
  // is left to the page, so scrolling still works.
  const swipe = React.useRef<{ x: number; y: number; dx: number; on: boolean } | null>(
    null
  );
  const cardRef = React.useRef<HTMLDivElement>(null);
  const setCardShift = (dx: number, animate: boolean) => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transition =
      animate && !reduceMotion ? "transform var(--dur-base) var(--ease-enter)" : "none";
    el.style.transform = dx ? `translateX(${dx}px)` : "";
  };
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    swipe.current = { x: t.clientX, y: t.clientY, dx: 0, on: false };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const s0 = swipe.current;
    if (!s0) return;
    const t = e.touches[0];
    const dx = t.clientX - s0.x;
    const dy = t.clientY - s0.y;
    if (!s0.on) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        swipe.current = null;
        return;
      }
      if (Math.abs(dx) < 10) return;
      s0.on = true;
    }
    s0.dx = dx;
    // Resist at either end, where there is nothing to step to.
    const atEnd =
      phase.kind === "ready" &&
      ((dx > 0 && phase.index === 0) || (dx < 0 && phase.index >= phase.picks.length - 1));
    setCardShift(atEnd ? dx / 4 : dx, false);
  };
  const onTouchEnd = () => {
    const s0 = swipe.current;
    swipe.current = null;
    if (!s0?.on) return;
    const width = cardRef.current?.offsetWidth ?? 320;
    const far = Math.abs(s0.dx) > Math.min(60, width / 4);
    setCardShift(0, true);
    if (far) step(s0.dx < 0 ? 1 : -1);
  };

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
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-8 md:px-6 md:py-16">
        <h1 className="hero-rise text-[28px] leading-tight font-semibold tracking-tight sm:text-4xl">
          What are you in the mood for?
        </h1>
        <p className="hero-rise mt-2 text-sm text-muted-foreground">
          Pick a shape, or do not. Klyvi will find one thing worth your
          time.
        </p>

        <div className="mt-6 flex flex-wrap gap-2 md:mt-8">
          {MOODS.map((m, i) => (
            <button
              key={m.id}
              type="button"
              // Each chip rises a beat after the one before it.
              style={{ animationDelay: `calc(${i + 1} * var(--dur-press) / 2)` }}
              onClick={() => setMood(m.id)}
              aria-pressed={mood === m.id}
              disabled={m.filmsOnly === true && media === "tv"}
              className={
                "hero-rise tap-target rounded-full px-4 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 " +
                (mood === m.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground")
              }
            >
              {m.label}
            </button>
          ))}
        </div>
        {filmsOnlyMood || media === "tv" ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Under 2 hours picks films only.
          </p>
        ) : null}

        <div className="glass mt-6 divide-y divide-foreground/10 rounded-2xl md:mt-8">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="text-sm text-muted-foreground">Films or TV?</span>
          <ToggleGroup
            value={[media]}
            onValueChange={(v: unknown[]) => {
              // Pressing the chosen item again empties the group. Ignore
              // that, so one choice is always on.
              const next = MEDIA.find((o) => o.value === v.at(-1));
              if (next) chooseMedia(next.value);
            }}
            spacing={0}
            variant="outline"
            aria-label="Films or TV"
          >
            {MEDIA.map((o) => (
              <ToggleGroupItem key={o.value} value={o.value}>
                {o.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-3">
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
        </div>

        <Button
          size="touch"
          onClick={() => void fetchPicks()}
          className="mt-6 w-full gap-2 sm:w-auto sm:self-start"
        >
          <Sparkles aria-hidden="true" data-icon="inline-start" />
          Find something
        </Button>
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
            body="Rate about 20 films and Klyvi can make real recommendations, shows included. It takes about 90 seconds."
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
  const { overview, genres } = pick;
  // A show's length is its season count, where a film's is its runtime.
  const length =
    pick.mediaType === "tv"
      ? formatSeasons(pick.seasonCount)
      : formatRuntime(pick.runtime);
  // Read at render, which only ever happens on the client here: the pick
  // view appears after the user asks for a set, so there is no server pass
  // to disagree with about the hour.
  const timePhrase = watchWindowPhrase();
  const prev = phase.index > 0 ? phase.picks[phase.index - 1] : null;
  const next =
    phase.index < phase.picks.length - 1 ? phase.picks[phase.index + 1] : null;
  const total = phase.picks.length;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-start px-4 py-4 md:justify-center md:px-6 md:py-8">
      <header ref={topRef} className="scroll-mt-16 text-center">
        <h1 className="text-xl font-semibold tracking-tight sm:text-3xl">
          {total === 1
            ? `Your pick for ${timePhrase}`
            : `Your ${total} picks for ${timePhrase}`}
        </h1>
        <p data-numeric className="mt-1 hidden font-mono text-xs text-muted-foreground md:block">
          {phase.index + 1} of {total}
        </p>
        {total < phase.size && phase.reserve.length === 0 ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Nothing else fits right now, so the set is getting smaller. New set
            looks again.
          </p>
        ) : null}
      </header>

      {/* The stage. The current pick sits on top at two thirds of the width;
          each neighbour is the same card, behind it, centred on the same
          line and pushed out far enough to leave only a sliver overlapping.
          Stacking rather than a three-column grid on purpose: in a grid the
          side tracks size to their content, so the neighbours refuse to
          shrink and crush the centre column instead of being clipped. */}
      <div
        data-slot="pick-stage"
        className="mt-4 touch-pan-y overflow-hidden md:mt-6"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        <div className="relative mx-auto w-full lg:w-2/3">
          {prev ? (
            <NeighbourPick pick={prev} side="left" onClick={() => step(-1)} />
          ) : null}
          {next ? (
            <NeighbourPick pick={next} side="right" onClick={() => step(1)} />
          ) : null}

          <div ref={cardRef} className="relative z-10">
            <PickHero pick={pick} priority />

            {/* Phones: where you are in the set, and a hint that it swipes. */}
            <div
              aria-hidden="true"
              data-slot="pick-dots"
              className="mt-3 flex justify-center gap-1.5 md:hidden"
            >
              {phase.picks.map((p, i) => (
                <span
                  key={p.mediaId}
                  className={
                    "h-1.5 rounded-full transition-all duration-(--dur-base) " +
                    (i === phase.index ? "w-4 bg-violet-text" : "w-1.5 bg-foreground/25")
                  }
                />
              ))}
            </div>

            {/* Fixed height, because this is the only part of the card whose
                size follows the film. Letting it size to the synopsis moved
                the buttons and the pager every time the user stepped from a
                terse film to a wordy one, which made them hard to hit. */}
            <div className="flex min-h-[12rem] flex-col justify-start md:min-h-[15.5rem]">
          {/* Why. The differentiator, given real room rather than a corner. */}
          <div className="mt-4 text-center md:mt-6">
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
            <p className="mx-auto mt-4 line-clamp-3 max-w-[60ch] md:mt-5 md:line-clamp-5 text-center text-[15px] leading-relaxed text-foreground/90">
              {overview}
            </p>
          ) : null}

          {genres.length > 0 || length != null ? (
            <p className="mt-3 text-center text-sm text-muted-foreground">
              {[genres.join(" · "), length]
                .filter(Boolean)
                .join("  •  ")}
            </p>
          ) : null}
            </div>

          {/* Decide. */}
          {/* Phones: the main action full width, the other three as tiles
              in a row beneath it. Wider screens: one centred row. */}
          <div className="mt-5 grid grid-cols-3 gap-2 md:mt-7 md:flex md:flex-wrap md:items-center md:justify-center">
            <Button size="touch" className="col-span-3 gap-2" onClick={() => act("save")}>
              <Bookmark aria-hidden="true" data-icon="inline-start" />
              Add to watchlist
            </Button>
            <Link
              href={mediaHref(pick)}
              className={cn(
                buttonVariants({ variant: "outline", size: "touch" }),
                "h-auto flex-col gap-1 py-2 text-xs md:h-11 md:flex-row md:gap-2 md:py-0 md:text-sm"
              )}
              onClick={() => {
                if (!mock)
                  queueSignal({
                    tmdbId: pick.tmdbId,
                    mediaType: pick.mediaType,
                    kind: "clicked",
                    source: "feed",
                  });
              }}
            >
              <Info aria-hidden="true" data-icon="inline-start" className="md:hidden" />
              More about it
            </Link>
            <Button
              variant="ghost"
              size="touch"
              className="h-auto flex-col gap-1 py-2 text-xs md:h-11 md:flex-row md:gap-2 md:py-0 md:text-sm"
              onClick={() => act("seen")}
            >
              <Check aria-hidden="true" data-icon="inline-start" />
              Seen it
            </Button>
            <Button
              variant="ghost"
              size="touch"
              className="h-auto flex-col gap-1 py-2 text-xs md:h-11 md:flex-row md:gap-2 md:py-0 md:text-sm text-muted-foreground"
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
      <div className="mx-auto mt-5 flex w-full max-w-[44rem] items-center justify-between gap-3 border-t border-border pt-4 md:mt-8 md:flex-col md:justify-center md:pt-5">
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
