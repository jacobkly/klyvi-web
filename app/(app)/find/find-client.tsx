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

import { EmptyState } from "@/components/klyvi/empty-state";
import { ReasonChips } from "@/components/klyvi/reason-chips";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  mockFeed,
  mockInteractionCount,
  type RecoTier,
  type Scored,
} from "@/lib/mock-reco";
import { formatRuntime } from "@/lib/mock-media";
import { posterUrl } from "@/lib/types";

const TIER_THRESHOLD = 20; // klyvi/docs/API.md: Tier 2 at >= 20 interactions.

const MOODS = [
  { id: "any", label: "Anything" },
  { id: "short", label: "Under 2 hours" },
  { id: "slow", label: "Slow burn" },
  { id: "light", label: "Something light" },
  { id: "heavy", label: "Heavy" },
  { id: "old", label: "Older than me" },
];

type Phase =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; picks: Scored[]; index: number };

/**
 * Find Next, built as a decision surface rather than a list. The north star
 * from phase1 is a calm, high-trust "here is the answer" moment, which a
 * scrollable column of equal cards does not produce: five equal options is
 * the same paralysis the product exists to end.
 *
 * So it shows ONE pick at a time, full-bleed backdrop, reasons prominent,
 * with the set behind it reachable. Deciding between one thing and "next" is
 * a far easier decision than ranking five.
 */
export function FindClient({ simulate }: { simulate?: string }) {
  const tier: RecoTier =
    simulate === "tier0" ? 0 : simulate === "tier2" ? 2 : 1;
  const [mood, setMood] = React.useState("any");
  const [count, setCount] = React.useState<3 | 5 | 7>(5);
  const [phase, setPhase] = React.useState<Phase>({ kind: "idle" });

  const interactions = mockInteractionCount(tier);
  const remaining = Math.max(0, TIER_THRESHOLD - interactions);

  function fetchPicks() {
    setPhase({ kind: "loading" });
    setTimeout(() => {
      if (simulate === "error") setPhase({ kind: "error" });
      else if (simulate === "exhausted")
        setPhase({ kind: "ready", picks: [], index: 0 });
      else setPhase({ kind: "ready", picks: mockFeed(tier, count), index: 0 });
    }, 550);
  }

  function step(dir: 1 | -1) {
    if (phase.kind !== "ready") return;
    const next = phase.index + dir;
    if (next < 0 || next >= phase.picks.length) return;
    setPhase({ ...phase, index: next });
  }

  function act(kind: "save" | "seen" | "dismiss") {
    if (phase.kind !== "ready") return;
    const cur = phase.picks[phase.index];
    // TODO(auth): "Seen it" on an unrated title should open the rating step
    // rather than silently consuming the pick. A watched-but-unrated signal is
    // the weakest kind the recommender can get, and this is the one moment the
    // user is already thinking about the film. Needs the tracking write path.
    if (kind === "save") toast("Added to your watchlist");
    if (kind === "dismiss") toast("Hidden from your recommendations");
    const picks = phase.picks.filter((p) => p.mediaId !== cur.mediaId);
    setPhase({
      kind: "ready",
      picks,
      index: Math.min(phase.index, Math.max(0, picks.length - 1)),
    });
  }

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase.kind !== "ready") return;
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ---------- idle ----------
  if (phase.kind === "idle") {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col justify-center px-4 py-16 md:px-6">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          What are you in the mood for?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick a shape, or do not. Klyvi will find one thing worth your
          evening.
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

        <Button size="touch" onClick={fetchPicks} className="mt-6 gap-2 self-start">
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
      <main className="mx-auto w-full max-w-4xl px-4 py-10 md:px-6">
        <Skeleton className="aspect-[16/9] w-full rounded-lg" />
        <Skeleton className="mt-6 h-8 w-2/3 rounded-lg" />
        <Skeleton className="mt-3 h-5 w-1/3 rounded-lg" />
      </main>
    );
  }

  // ---------- error ----------
  if (phase.kind === "error") {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-24 text-center md:px-6">
        <p className="text-[15px] font-semibold text-foreground">
          Could not get your recommendations.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Something went wrong on Klyvi&apos;s end.
        </p>
        <Button className="mt-5" onClick={fetchPicks}>
          Try again
        </Button>
      </main>
    );
  }

  // ---------- exhausted / empty ----------
  if (phase.picks.length === 0) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-10 md:px-6">
        {interactions === 0 ? (
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
  const poster = posterUrl(pick.posterPath, "w500");

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6">
      {/* Backdrop-led hero: one title, full attention. */}
      <div className="relative overflow-hidden rounded-lg ring-1 ring-foreground/10">
        <div className="relative aspect-[16/10] sm:aspect-[16/7]">
          {pick.backdropPath ? (
            <Image
              src={`https://image.tmdb.org/t/p/w1280${pick.backdropPath}`}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : poster ? (
            <Image
              src={poster}
              alt=""
              fill
              priority
              sizes="100vw"
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
                <Image src={poster} alt="" fill sizes="96px" className="object-cover" />
              ) : null}
            </div>
          </Link>

          <div className="min-w-0 flex-1">
            <Link
              href={`/movie/${pick.tmdbId}`}
              className="rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {pick.title}{" "}
                {pick.year != null ? (
                  <span
                    data-numeric
                    className="align-middle font-mono text-sm font-normal text-muted-foreground"
                  >
                    {pick.year}
                  </span>
                ) : null}
              </h1>
            </Link>
            {pick.voteAverage != null ? (
              <p
                data-numeric
                className="mt-1 font-mono text-xs text-muted-foreground"
              >
                {Math.round(pick.voteAverage * 10)}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Why. The differentiator, given real room rather than a corner. */}
      <div className="mt-6">
        {pick.reasons.length > 0 ? (
          <>
            <h2 className="text-xs font-medium tracking-[0.12em] uppercase text-muted-foreground">
              Why this one
            </h2>
            <ReasonChips reasons={pick.reasons} max={4} className="mt-2.5" />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            This is a pick people tend to agree on. Rate a few and Klyvi starts
            explaining why it picked things for you specifically.
          </p>
        )}
      </div>

      {/* What it actually is. A recommendation you cannot evaluate is not a
          recommendation, so the synopsis sits with the reasons, not a click
          away on the detail page. */}
      {pick.overview ? (
        <p className="mt-5 max-w-[68ch] text-[15px] leading-relaxed text-foreground/90">
          {pick.overview}
        </p>
      ) : null}

      {(pick.genres.length > 0 || pick.runtime != null) ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {[
            pick.genres.join(" · "),
            pick.runtime != null ? formatRuntime(pick.runtime) : null,
          ]
            .filter(Boolean)
            .join("  •  ")}
        </p>
      ) : null}

      {/* Decide. */}
      <div className="mt-7 flex flex-wrap items-center gap-2">
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

      {/* The rest of the set, present but subordinate. */}
      <div className="mt-8 flex items-center justify-between gap-4 border-t border-border pt-5">
        <div className="flex items-center gap-2">
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
            {phase.index + 1} / {phase.picks.length}
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next pick"
            disabled={phase.index >= phase.picks.length - 1}
            onClick={() => step(1)}
          >
            <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2} />
          </Button>
        </div>

        <Button variant="ghost" size="sm" className="gap-2" onClick={fetchPicks}>
          <RotateCcw aria-hidden="true" data-icon="inline-start" />
          New set
        </Button>
      </div>

      {tier === 1 ? (
        <p data-numeric className="mt-5 text-sm text-muted-foreground">
          {remaining} more {remaining === 1 ? "rating" : "ratings"} and Klyvi
          switches to your full taste profile.
        </p>
      ) : null}
    </main>
  );
}
