"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Check, Minus, X } from "lucide-react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { listInteractions, recordInteraction } from "@/lib/api/interactions";
import { getPool } from "@/lib/api/onboarding";
import type { PoolEntry } from "@/lib/mock-onboarding";

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

type Verdict = "liked" | "not_seen" | "disliked";

type DeckState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; films: PoolEntry[] };

/**
 * The swipe deck: the most important screen for cold start (phase1 north
 * star: effortless, almost a game). One large card, three parallel verdicts,
 * optimistic advance with a directional exit; rate requests fire behind the
 * animation and never block it. Progress resumes from the server's count of
 * onboarding ratings, deck position from localStorage.
 */
export function RateDeck() {
  const router = useRouter();
  const [deck, setDeck] = React.useState<DeckState>({ kind: "loading" });
  const [index, setIndex] = React.useState(0);
  const [rated, setRated] = React.useState(0);
  const [unseenStreak, setUnseenStreak] = React.useState(0);
  const [exit, setExit] = React.useState<"left" | "right" | "down" | null>(
    null
  );

  const load = React.useCallback(() => {
    setDeck({ kind: "loading" });
    Promise.all([
      getPool(30),
      // Resume: what the server already knows beats local state.
      listInteractions().catch(() => []),
    ])
      .then(([films, interactions]) => {
        const done = interactions.filter(
          (i) => i.kind === "rated" && i.source === "onboarding"
        ).length;
        setRated(Math.min(done, TARGET));
        const savedIndex = Number(
          window.localStorage.getItem(INDEX_KEY) ?? "0"
        );
        setIndex(
          Number.isFinite(savedIndex)
            ? Math.min(Math.max(savedIndex, 0), films.length)
            : 0
        );
        setDeck({ kind: "ready", films });
      })
      .catch(() => setDeck({ kind: "error" }));
  }, []);

  React.useEffect(load, [load]);

  const films = deck.kind === "ready" ? deck.films : [];
  const done = index >= films.length || rated >= TARGET;
  const film = films[Math.min(index, Math.max(0, films.length - 1))];

  const advance = React.useCallback(
    (verdict: Verdict) => {
      if (deck.kind !== "ready" || done || exit || !film) return;
      setExit(
        verdict === "liked" ? "right" : verdict === "disliked" ? "left" : "down"
      );

      // Optimistic advance: the write races the exit animation and loses
      // quietly. A failed write costs one signal, not the flow.
      if (verdict !== "not_seen") {
        recordInteraction({
          tmdbId: film.tmdbId,
          mediaType: "movie",
          kind: "rated",
          rating: verdict === "liked" ? LIKED_RATING : DISLIKED_RATING,
          source: "onboarding",
        }).catch(() => toast("That one did not save. Klyvi moved on anyway."));
      }

      window.setTimeout(() => {
        setExit(null);
        setIndex((i) => {
          const next = i + 1;
          window.localStorage.setItem(INDEX_KEY, String(next));
          return next;
        });
        if (verdict !== "not_seen") {
          setRated((r) => r + 1);
          setUnseenStreak(0);
        } else {
          setUnseenStreak((s) => {
            const streak = s + 1;
            if (streak >= UNSEEN_STREAK_LIMIT) {
              // Too many unknowns in a row: float the mainstream part of
              // the pool to the front of what is left.
              setDeck((d) => {
                if (d.kind !== "ready") return d;
                const ahead = d.films.slice(index + 1);
                const behind = d.films.slice(0, index + 1);
                const mainstream = ahead.filter((f) =>
                  MAINSTREAM.has(f.dimension)
                );
                const rest = ahead.filter((f) => !MAINSTREAM.has(f.dimension));
                return {
                  kind: "ready",
                  films: [...behind, ...mainstream, ...rest],
                };
              });
              return 0;
            }
            return streak;
          });
        }
      }, 180);
    },
    [deck.kind, done, exit, film, index]
  );

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") advance("liked");
      else if (e.key === "ArrowLeft") advance("disliked");
      else if (e.key === " ") {
        e.preventDefault();
        advance("not_seen");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance]);

  React.useEffect(() => {
    if (deck.kind === "ready" && rated >= TARGET) {
      window.localStorage.removeItem(INDEX_KEY);
      router.push("/onboarding/done?rated=" + rated);
    }
  }, [deck.kind, rated, router]);

  // ---------- loading ----------
  if (deck.kind === "loading") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
        <Skeleton className="h-1.5 w-full rounded-full" />
        <div className="flex flex-1 flex-col items-center justify-center py-6">
          <Skeleton className="aspect-[2/3] w-64 rounded-art sm:w-72" />
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
        <Button className="mt-5" onClick={load}>
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
          className={buttonVariants({ size: "touch" }) + " mt-6"}
        >
          See your recommendations
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
      <div className="flex items-center gap-3">
        <Progress value={(rated / TARGET) * 100} className="h-1.5 flex-1" />
        <span data-numeric className="font-mono text-xs text-muted-foreground">
          {rated} / {TARGET}
        </span>
      </div>

      {rated >= UNLOCK_AT ? (
        <Link
          href={`/onboarding/done?rated=${rated}`}
          className="mt-2 self-end text-xs font-medium text-violet-text hover:underline"
        >
          See your first recommendations
        </Link>
      ) : null}

      <div className="flex flex-1 flex-col items-center justify-center py-6">
        <h1 className="mb-4 text-sm font-normal text-muted-foreground">
          Have you seen this?
        </h1>
        <div
          className={
            "relative aspect-[2/3] w-64 overflow-hidden rounded-art bg-muted ring-1 ring-foreground/10 transition-all duration-200 sm:w-72 " +
            (exit === "right"
              ? "translate-x-24 rotate-6 opacity-0"
              : exit === "left"
                ? "-translate-x-24 -rotate-6 opacity-0"
                : exit === "down"
                  ? "translate-y-16 opacity-0"
                  : "")
          }
        >
          {film?.posterPath ? (
            <Image
              src={`https://image.tmdb.org/t/p/w500${film.posterPath}`}
              alt=""
              fill
              priority
              sizes="288px"
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
        <p className="mt-4 text-center text-[15px] font-semibold text-foreground">
          {film?.title}{" "}
          <span
            data-numeric
            className="font-mono text-xs font-normal text-muted-foreground"
          >
            {film?.releaseYear}
          </span>
        </p>

        {/* The next three posters preload behind the card so transitions
            stay instant (onboarding-spec §6). */}
        <div aria-hidden="true" className="hidden">
          {films.slice(index + 1, index + 4).map((f) =>
            f.posterPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={f.tmdbId}
                src={`https://image.tmdb.org/t/p/w500${f.posterPath}`}
                alt=""
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

      <p className="hidden pb-2 text-center font-mono text-[10px] text-muted-foreground md:block">
        ← not for me · → liked it · space not seen
      </p>
    </main>
  );
}
