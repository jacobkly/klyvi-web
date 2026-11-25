"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Check, Minus, Undo2, X } from "lucide-react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { listInteractions, recordInteraction } from "@/lib/api/interactions";
import { getPool } from "@/lib/api/onboarding";
import type { PoolEntry } from "@/lib/mock-onboarding";
import { useReducedMotion } from "@/lib/motion";
import { tmdbImage } from "@/lib/tmdb-image";
import { cn } from "@/lib/utils";

const TARGET = 20;
const UNLOCK_AT = 10;
const INDEX_KEY = "klyvi:onboarding-index";

/** Onboarding swipes write directional signal, not precision: 80/20 leaves
 *  headroom for real in-app ratings to mean more (onboarding-spec §3A). */
const LIKED_RATING = 80;
const DISLIKED_RATING = 20;

/** After this many consecutive "not seen", mainstream titles surface first
 *  (onboarding-spec §7). */
const UNSEEN_STREAK_LIMIT = 5;
const MAINSTREAM = new Set(["modern_crowdpleaser", "popcorn", "genre_action"]);

/** How far a finger has to carry the card before letting go answers it. */
const SWIPE_AT = 80;

/** How long the card takes to leave, matching --dur-base. */
const EXIT_MS = 200;

type Verdict = "liked" | "not_seen" | "disliked";

type DeckState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; films: PoolEntry[] };

/** The answer Undo can take back. Its write waits until the next answer or
 *  the way out, since the API has no way to delete an interaction. */
type LastAnswer = {
  index: number;
  film: PoolEntry;
  verdict: Verdict;
  /** The not-seen streak before this answer, put back by Undo. */
  streak: number;
};

function saveIndex(i: number) {
  try {
    window.localStorage.setItem(INDEX_KEY, String(i));
  } catch {
    // Private mode: the deck starts over next time, nothing else breaks.
  }
}

/** A horizontal swipe's answer: right likes, left doesn't, short is nothing. */
export function swipeVerdict(dx: number): "liked" | "disliked" | null {
  if (dx >= SWIPE_AT) return "liked";
  if (dx <= -SWIPE_AT) return "disliked";
  return null;
}

/**
 * The swipe deck: the most important screen for cold start (phase1 north
 * star: effortless, almost a game). One large card, three parallel verdicts,
 * optimistic advance with a directional exit. Progress resumes from the
 * server's count of onboarding ratings, deck position from localStorage.
 *
 * "Done for now" is there from the first card. The last answer can be undone,
 * so it is written when the next one comes in or on the way out.
 */
export function RateDeck({ redo = false }: { redo?: boolean } = {}) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [deck, setDeck] = React.useState<DeckState>({ kind: "loading" });
  const [index, setIndex] = React.useState(0);
  const [rated, setRated] = React.useState(0);
  const [exit, setExit] = React.useState<"left" | "right" | "down" | null>(
    null
  );
  const [last, setLast] = React.useState<LastAnswer | null>(null);
  const streak = React.useRef(0);
  /** The held answer, for writes from cleanup where state is out of reach. */
  const held = React.useRef<LastAnswer | null>(null);

  /** Where the finger started and how far it has carried the card. */
  const dragFrom = React.useRef<number | null>(null);
  const dragDx = React.useRef(0);
  const [drag, setDrag] = React.useState<number | null>(null);

  /** Bumped by the error state's Try again to reload the deck. */
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    let live = true;
    Promise.all([
      getPool(30),
      // Resume: what the server already knows beats local state.
      listInteractions({ kind: "rated" }).catch(() => []),
    ])
      .then(([films, interactions]) => {
        if (!live) return;
        // A redo counts from zero. Resuming from the earlier run's count
        // would finish the deck before a card shows.
        const done = redo
          ? 0
          : interactions.filter(
              (i) => i.kind === "rated" && i.source === "onboarding"
            ).length;
        setRated(Math.min(done, TARGET));
        const savedIndex = Number(
          (redo ? null : window.localStorage.getItem(INDEX_KEY)) ?? "0"
        );
        setIndex(
          Number.isFinite(savedIndex)
            ? Math.min(Math.max(savedIndex, 0), films.length)
            : 0
        );
        setDeck({ kind: "ready", films });
      })
      .catch(() => {
        if (live) setDeck({ kind: "error" });
      });
    return () => {
      live = false;
    };
  }, [attempt, redo]);

  /** Write the held answer, if it was an opinion. A failed write costs one
   *  signal, not the flow. */
  const commit = React.useCallback(() => {
    const a = held.current;
    held.current = null;
    if (!a || a.verdict === "not_seen") return;
    recordInteraction({
      tmdbId: a.film.tmdbId,
      mediaType: "movie",
      kind: "rated",
      rating: a.verdict === "liked" ? LIKED_RATING : DISLIKED_RATING,
      source: "onboarding",
    }).catch(() => toast("That one did not save. Klyvi moved on anyway."));
  }, []);

  // Leaving the page by any route still saves the last answer.
  React.useEffect(() => {
    window.addEventListener("pagehide", commit);
    return () => {
      window.removeEventListener("pagehide", commit);
      commit();
    };
  }, [commit]);

  function retry() {
    setDeck({ kind: "loading" });
    setAttempt((n) => n + 1);
  }

  const films = deck.kind === "ready" ? deck.films : [];
  const done = index >= films.length || rated >= TARGET;
  const film = films[Math.min(index, Math.max(0, films.length - 1))];

  const advance = React.useCallback(
    (verdict: Verdict) => {
      if (deck.kind !== "ready" || done || exit || !film) return;
      setExit(
        verdict === "liked" ? "right" : verdict === "disliked" ? "left" : "down"
      );

      commit();
      const answer = { index, film, verdict, streak: streak.current };
      held.current = answer;
      setLast(answer);

      window.setTimeout(() => {
        setExit(null);
        setIndex(index + 1);
        saveIndex(index + 1);
        if (verdict !== "not_seen") {
          setRated((r) => r + 1);
          streak.current = 0;
          return;
        }
        streak.current += 1;
        if (streak.current >= UNSEEN_STREAK_LIMIT) {
          streak.current = 0;
          // Too many unknowns in a row: float the mainstream part of the
          // pool to the front of what is left.
          setDeck((d) => {
            if (d.kind !== "ready") return d;
            const ahead = d.films.slice(index + 1);
            const behind = d.films.slice(0, index + 1);
            const mainstream = ahead.filter((f) => MAINSTREAM.has(f.dimension));
            const rest = ahead.filter((f) => !MAINSTREAM.has(f.dimension));
            return { kind: "ready", films: [...behind, ...mainstream, ...rest] };
          });
        }
      }, EXIT_MS);
    },
    [deck.kind, done, exit, film, index, commit]
  );

  const undo = React.useCallback(() => {
    if (!last || exit) return;
    held.current = null;
    setLast(null);
    setIndex(last.index);
    saveIndex(last.index);
    if (last.verdict !== "not_seen") setRated((r) => Math.max(0, r - 1));
    streak.current = last.streak;
  }, [last, exit]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") advance("liked");
      else if (e.key === "ArrowLeft") advance("disliked");
      else if (e.key === "Backspace") undo();
      else if (e.key === " ") {
        e.preventDefault();
        advance("not_seen");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, undo]);

  React.useEffect(() => {
    if (deck.kind === "ready" && rated >= TARGET) {
      commit();
      window.localStorage.removeItem(INDEX_KEY);
      router.push("/onboarding/done?rated=" + rated);
    }
  }, [deck.kind, rated, router, commit]);

  function leave() {
    commit();
    router.push(`/onboarding/done?rated=${rated}`);
  }

  // ---------- swipe ----------
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" || exit) return;
    dragFrom.current = e.clientX;
    dragDx.current = 0;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (dragFrom.current == null) return;
    dragDx.current = e.clientX - dragFrom.current;
    // With reduced motion the card stays put and the release answers it.
    if (!reduced) setDrag(dragDx.current);
  }

  function endDrag(answer: boolean) {
    if (dragFrom.current == null) return;
    const v = answer ? swipeVerdict(dragDx.current) : null;
    dragFrom.current = null;
    dragDx.current = 0;
    setDrag(null);
    if (v) advance(v);
  }

  // ---------- loading ----------
  if (deck.kind === "loading") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6 lg:max-w-lg">
        <Skeleton className="h-1.5 w-full rounded-full" />
        <div className="flex flex-1 flex-col items-center justify-center py-6">
          <Skeleton className="aspect-[2/3] w-64 rounded-art sm:w-72 lg:w-80" />
          <Skeleton className="mt-4 h-5 w-40 rounded-lg" />
        </div>
      </main>
    );
  }

  // ---------- error ----------
  if (deck.kind === "error") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        <p className="text-[15px] font-semibold text-foreground">
          Could not load the films.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Something went wrong on Klyvi&apos;s end.
        </p>
        <Button className="mt-5" onClick={retry}>
          Try again
        </Button>
      </main>
    );
  }

  // ---------- ran out of films before the target ----------
  if (index >= films.length && rated < TARGET) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          That is everything for now
        </h1>
        <p data-numeric className="mt-2 text-sm text-muted-foreground">
          You rated {rated} films, which is enough to get started.
        </p>
        <Link
          href={`/onboarding/done?rated=${rated}`}
          onClick={commit}
          className={buttonVariants({ size: "touch" }) + " mt-6"}
        >
          See your recommendations
        </Link>
      </main>
    );
  }

  const unlocked = rated >= UNLOCK_AT;
  const dragStyle: React.CSSProperties | undefined =
    drag != null
      ? {
          transform: `translateX(${drag}px) rotate(${drag / 20}deg)`,
          transition: "none",
        }
      : undefined;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6 lg:max-w-lg">
      <div className="flex items-center gap-3">
        <Progress value={(rated / TARGET) * 100} className="h-1.5 flex-1" />
        <span data-numeric className="font-mono text-xs text-muted-foreground">
          {rated} / {TARGET}
        </span>
      </div>

      <div className="mt-2 flex min-h-8 items-center justify-between gap-2">
        {last ? (
          <Button
            variant="ghost"
            size="sm"
            className="hit-44 relative text-muted-foreground"
            onClick={undo}
          >
            <Undo2 data-icon="inline-start" aria-hidden="true" />
            Undo
          </Button>
        ) : (
          <span />
        )}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "hit-44 relative",
            unlocked ? "text-violet-text" : "text-muted-foreground"
          )}
          onClick={leave}
        >
          {unlocked ? "See your first recommendations" : "Done for now"}
        </Button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-6">
        <h1 className="mb-4 text-sm font-normal text-muted-foreground">
          Have you seen this?
        </h1>
        {/* Poster and caption move as one, so the title never changes
            under the old poster. Keyed on the film, so each new card
            slides in. */}
        <div
          key={film?.tmdbId}
          style={dragStyle}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => endDrag(true)}
          onPointerCancel={() => endDrag(false)}
          className={cn(
            "flex cursor-grab touch-pan-y flex-col items-center transition-[translate,rotate,opacity] duration-(--dur-base) ease-(--ease-enter) select-none active:cursor-grabbing",
            "animate-in fade-in-0 slide-in-from-bottom-2",
            exit === "right" && "translate-x-24 rotate-6 opacity-0",
            exit === "left" && "-translate-x-24 -rotate-6 opacity-0",
            exit === "down" && "translate-y-16 opacity-0"
          )}
        >
          <div className="relative aspect-[2/3] w-64 overflow-hidden rounded-art bg-muted ring-1 ring-foreground/10 sm:w-72 lg:w-80">
            {film?.posterPath ? (
              <Image
                src={tmdbImage(film.posterPath)}
                alt=""
                fill
                priority
                draggable={false}
                sizes="(min-width: 1024px) 320px, (min-width: 640px) 288px, 256px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center p-4 text-center">
                <span className="text-sm text-muted-foreground">
                  {film?.title}
                </span>
              </div>
            )}
          </div>
          <h2 className="mt-4 text-center text-[15px] font-semibold text-foreground">
            {film?.title}{" "}
            <span
              data-numeric
              className="font-mono text-xs font-normal text-muted-foreground"
            >
              {film?.releaseYear}
            </span>
          </h2>
        </div>

        {/* The next three posters preload behind the card so transitions
            stay instant (onboarding-spec §6). Same srcset and sizes as the
            card, so the browser picks the file the card will ask for. */}
        <div aria-hidden="true" className="hidden">
          {films.slice(index + 1, index + 4).map((f) =>
            f.posterPath ? (
              <Image
                key={f.tmdbId}
                src={tmdbImage(f.posterPath)}
                alt=""
                width={320}
                height={480}
                sizes="(min-width: 1024px) 320px, (min-width: 640px) 288px, 256px"
                loading="eager"
              />
            ) : null
          )}
        </div>
      </div>

      {/* The three verdicts, thumb zone, 44px tall. Opinions are parallel; the
          fact ("Not seen") is quieter. Horizontal padding collapses at 320px
          so all three fit; the 44px HEIGHT is the accessibility floor, the
          padding is not, so padding is what gives. */}
      <div className="flex items-stretch justify-center gap-1.5 pb-4 sm:gap-2">
        <Button
          variant="outline"
          size="touch"
          className="min-w-0 flex-1 gap-1 px-2 sm:gap-1.5 sm:px-5"
          onClick={() => advance("disliked")}
        >
          <X aria-hidden="true" data-icon="inline-start" />
          Not for me
        </Button>
        <Button
          variant="ghost"
          size="touch"
          className="min-w-0 flex-1 gap-1 px-2 text-muted-foreground sm:gap-1.5 sm:px-5"
          onClick={() => advance("not_seen")}
        >
          <Minus aria-hidden="true" data-icon="inline-start" />
          Not seen
        </Button>
        <Button
          size="touch"
          className="min-w-0 flex-1 gap-1 px-2 sm:gap-1.5 sm:px-5"
          onClick={() => advance("liked")}
        >
          <Check aria-hidden="true" data-icon="inline-start" />
          Liked it
        </Button>
      </div>

      <p className="hidden pb-2 text-center text-xs text-muted-foreground md:block">
        <Key>←</Key> not for me · <Key>→</Key> liked it · <Key>Space</Key> not
        seen · <Key>Backspace</Key> undo
      </p>
      <p className="pb-2 text-center text-xs text-muted-foreground md:hidden">
        Swipe right if you liked it, left if not
      </p>
    </main>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
      {children}
    </kbd>
  );
}
