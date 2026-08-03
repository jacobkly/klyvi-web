"use client";

import * as React from "react";
import {
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  EyeOff,
} from "lucide-react";

import { NeighbourPick, PickHero } from "@/components/find/pick-stage";
import { LandingHeader } from "@/components/marketing/landing-header";
import { Reveal } from "@/components/marketing/reveal";
import { ReasonChips } from "@/components/klyvi/reason-chips";
import { Button } from "@/components/ui/button";
import { getMovie } from "@/lib/api/catalog";
import { DEMO_PICKS, DEMO_START_INDEX } from "@/lib/marketing-demo";
import { formatRuntime } from "@/lib/mock-media";
import type { Scored } from "@/lib/types";

/**
 * The actual Find Next presentation, driving five hardcoded films so a
 * visitor can feel the product before signing up. Renders the same
 * PickHero and NeighbourPick the live screen uses; the only differences
 * are the data source and that nothing writes anywhere. Backdrops hydrate
 * from the public catalog when it answers; the blurred-poster fallback
 * carries it when it does not.
 */
export function FindNextDemo() {
  const [picks, setPicks] = React.useState<Scored[]>(DEMO_PICKS);
  const [index, setIndex] = React.useState(DEMO_START_INDEX);
  const [hint, setHint] = React.useState<string | null>(null);

  // Best-effort backdrop hydration from the public catalog. One pass,
  // silent failure: the demo must work with the API completely absent.
  React.useEffect(() => {
    let cancelled = false;
    Promise.allSettled(
      DEMO_PICKS.map((p) =>
        getMovie(p.tmdbId).then((d) => ({
          tmdbId: p.tmdbId,
          backdropPath: d?.backdropPath ?? null,
        }))
      )
    ).then((results) => {
      if (cancelled) return;
      const backdrops = new Map(
        results
          .filter(
            (
              r
            ): r is PromiseFulfilledResult<{
              tmdbId: number;
              backdropPath: string | null;
            }> => r.status === "fulfilled"
          )
          .map((r) => [r.value.tmdbId, r.value.backdropPath])
      );
      setPicks((cur) =>
        cur.map((p) => ({
          ...p,
          backdropPath: p.backdropPath ?? backdrops.get(p.tmdbId) ?? null,
        }))
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function step(dir: 1 | -1) {
    setHint(null);
    setIndex((i) => Math.min(picks.length - 1, Math.max(0, i + dir)));
  }

  function act(what: string) {
    setHint(what);
    if (index < picks.length - 1) setIndex(index + 1);
  }

  const pick = picks[index];
  const prev = index > 0 ? picks[index - 1] : null;
  const next = index < picks.length - 1 ? picks[index + 1] : null;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16">
      <Reveal>
        <LandingHeader
          eyebrow="See it live"
          title="This is the actual Find Next screen"
          lead="Five sample picks from a formed taste profile. Step through them; nothing here needs an account."
        />
      </Reveal>

      <div className="mt-10 overflow-hidden">
        <div className="relative mx-auto w-full lg:w-2/3">
          {prev ? (
            <NeighbourPick pick={prev} side="left" onClick={() => step(-1)} />
          ) : null}
          {next ? (
            <NeighbourPick pick={next} side="right" onClick={() => step(1)} />
          ) : null}

          <div className="relative z-10">
            <PickHero pick={pick} detailHref={null} />

            <div className="flex min-h-[13rem] flex-col justify-start">
              <div className="mt-6 text-center">
                <h3 className="text-xs font-medium tracking-[0.12em] uppercase text-muted-foreground">
                  Why this one
                </h3>
                <ReasonChips
                  reasons={pick.reasons}
                  max={4}
                  className="mt-2.5 justify-center"
                />
              </div>

              {pick.overview ? (
                <p className="mx-auto mt-5 line-clamp-4 max-w-[60ch] text-center text-[15px] leading-relaxed text-foreground/90">
                  {pick.overview}
                </p>
              ) : null}

              {pick.genres.length > 0 || pick.runtime != null ? (
                <p className="mt-3 text-center text-sm text-muted-foreground">
                  {[
                    pick.genres.join(" · "),
                    pick.runtime != null ? formatRuntime(pick.runtime) : null,
                  ]
                    .filter(Boolean)
                    .join("  •  ")}
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Button
                size="touch"
                className="gap-2"
                onClick={() => act("In the app, this saves it to your watchlist.")}
              >
                <Bookmark aria-hidden="true" data-icon="inline-start" />
                Add to watchlist
              </Button>
              <Button
                variant="ghost"
                size="touch"
                className="gap-2"
                onClick={() => act("In the app, this asks how it was and rates it.")}
              >
                <Check aria-hidden="true" data-icon="inline-start" />
                Seen it
              </Button>
              <Button
                variant="ghost"
                size="touch"
                className="gap-2 text-muted-foreground"
                onClick={() =>
                  act("In the app, this hides it and sharpens your profile.")
                }
              >
                <EyeOff aria-hidden="true" data-icon="inline-start" />
                Not interested
              </Button>
            </div>

            {/* Reserved line so the hint never moves the pager. */}
            <p
              role="status"
              className="mt-3 min-h-5 text-center text-xs text-muted-foreground"
            >
              {hint}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 flex max-w-[44rem] items-center justify-center gap-3 border-t border-border pt-5">
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous pick"
          disabled={index === 0}
          onClick={() => step(-1)}
        >
          <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={2} />
        </Button>
        <span data-numeric className="font-mono text-xs text-muted-foreground">
          {index + 1} / {picks.length}
        </span>
        <Button
          variant="outline"
          size="icon"
          aria-label="Next pick"
          disabled={index >= picks.length - 1}
          onClick={() => step(1)}
        >
          <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2} />
        </Button>
      </div>
    </section>
  );
}
