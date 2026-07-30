"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Check, Minus, X } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MOCK_POOL } from "@/lib/mock-onboarding";

const TARGET = 20;
const UNLOCK_AT = 10;

type Verdict = "liked" | "not_seen" | "disliked";

/**
 * The swipe deck: the most important screen for cold start (phase1 north
 * star: effortless, almost a game). One large card, three parallel verdicts,
 * optimistic advance with a directional exit. Mobile is the primary platform:
 * buttons pinned to the thumb zone at touch size; desktop gets keyboard
 * shortcuts. Interactions POST to /v1/interactions once auth lands.
 */
export function RateDeck() {
  const router = useRouter();
  const [index, setIndex] = React.useState(0);
  const [rated, setRated] = React.useState(0);
  const [exit, setExit] = React.useState<"left" | "right" | "down" | null>(null);

  const done = index >= MOCK_POOL.length || rated >= TARGET;
  const film = MOCK_POOL[Math.min(index, MOCK_POOL.length - 1)];

  const advance = React.useCallback(
    (verdict: Verdict) => {
      if (done || exit) return;
      setExit(
        verdict === "liked" ? "right" : verdict === "disliked" ? "left" : "down"
      );
      // The exit animation runs while the next card is already known:
      // optimistic advance, nothing waits on a server.
      window.setTimeout(() => {
        setExit(null);
        setIndex((i) => i + 1);
        if (verdict !== "not_seen") setRated((r) => r + 1);
        else setRated((r) => r); // fact, not an opinion: no signal counted
      }, 180);
    },
    [done, exit]
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
    if (rated >= TARGET) router.push("/onboarding/done?rated=" + rated);
  }, [rated, router]);

  if (index >= MOCK_POOL.length && rated < TARGET) {
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
        <p className="mb-4 text-sm text-muted-foreground">Have you seen this?</p>
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
          {film.posterPath ? (
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
              <span className="text-sm text-muted-foreground">{film.title}</span>
            </div>
          )}
        </div>
        <p className="mt-4 text-center text-[15px] font-semibold text-foreground">
          {film.title}{" "}
          <span data-numeric className="font-mono text-xs font-normal text-muted-foreground">
            {film.releaseYear}
          </span>
        </p>
      </div>

      {/* The three verdicts, thumb zone, 44px. Opinions are parallel; the
          fact ("Not seen") is quieter. */}
      <div className="flex items-stretch justify-center gap-2 pb-4">
        <Button
          variant="outline"
          size="touch"
          className="flex-1 gap-1.5"
          onClick={() => advance("disliked")}
        >
          <X aria-hidden="true" data-icon="inline-start" />
          Not for me
        </Button>
        <Button
          variant="ghost"
          size="touch"
          className="flex-1 gap-1.5 text-muted-foreground"
          onClick={() => advance("not_seen")}
        >
          <Minus aria-hidden="true" data-icon="inline-start" />
          Not seen
        </Button>
        <Button
          size="touch"
          className="flex-1 gap-1.5"
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
