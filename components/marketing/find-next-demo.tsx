"use client";

import * as React from "react";

import { PickPanel } from "@/components/find/find-panels";
import { useCardSwipe } from "@/components/find/use-card-swipe";
import { LandingHeader } from "@/components/marketing/landing-header";
import { Reveal } from "@/components/marketing/reveal";
import { getMovie } from "@/lib/api/catalog";
import { DEMO_PICKS, DEMO_START_INDEX } from "@/lib/marketing-demo";
import { formatRuntime } from "@/lib/mock-media";
import type { Scored } from "@/lib/types";

/**
 * The actual Find Next presentation, driving five hardcoded films so a
 * visitor can feel the product before signing up. Renders the same PickPanel
 * the live screen uses, swipe included. The only differences are the data
 * source and that nothing writes or links anywhere: each button says what it
 * does in the app instead. Past 1080p the frame takes the whole landing
 * column, and the panel lays itself out for the room. Backdrops and the full
 * story hydrate from the public catalog when it answers, and the posters and
 * short versions carry it when it does not.
 */
export function FindNextDemo() {
  const [picks, setPicks] = React.useState<Scored[]>(DEMO_PICKS);
  const [index, setIndex] = React.useState(DEMO_START_INDEX);
  const [dir, setDir] = React.useState<1 | -1>(1);
  const [hint, setHint] = React.useState<string | null>(null);

  // Best-effort hydration from the public catalog. One pass,
  // silent failure: the demo must work with the API completely absent.
  React.useEffect(() => {
    let cancelled = false;
    Promise.allSettled(
      DEMO_PICKS.map((p) =>
        getMovie(p.tmdbId).then((d) => ({
          tmdbId: p.tmdbId,
          backdropPath: d?.backdropPath ?? null,
          overview: d?.overview || null,
        }))
      )
    ).then((results) => {
      if (cancelled) return;
      const found = new Map(
        results
          .filter(
            (
              r
            ): r is PromiseFulfilledResult<{
              tmdbId: number;
              backdropPath: string | null;
              overview: string | null;
            }> => r.status === "fulfilled"
          )
          .map((r) => [r.value.tmdbId, r.value])
      );
      setPicks((cur) =>
        cur.map((p) => ({
          ...p,
          backdropPath: p.backdropPath ?? found.get(p.tmdbId)?.backdropPath ?? null,
          overview: found.get(p.tmdbId)?.overview ?? p.overview,
        }))
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function goTo(next: number) {
    setHint(null);
    setDir(next > index ? 1 : -1);
    setIndex(next);
  }

  function act(what: string) {
    setHint(what);
    if (index < picks.length - 1) {
      setDir(1);
      setIndex(index + 1);
    }
  }

  const [swiped, setSwiped] = React.useState(false);
  const { cardRef, swipe } = useCardSwipe({
    canPrev: index > 0,
    canNext: index < picks.length - 1,
    onStep: (by) => {
      setSwiped(true);
      const next = index + by;
      if (next >= 0 && next < picks.length) goTo(next);
    },
  });

  const pick = picks[index];

  return (
    <section className="mx-auto w-full max-w-(--page-landing) px-4 py-16">
      <Reveal>
        <LandingHeader
          eyebrow="See it live"
          title="This is the actual Find Next screen"
          lead="Five sample picks from a formed taste profile. Step through them. Nothing here needs an account."
        />
      </Reveal>

      <div className="glass mx-auto mt-10 max-w-5xl ultrawide:mt-16 ultrawide:max-w-none overflow-hidden rounded-lg border py-4 md:py-0">
        <PickPanel
          demo
          cardRef={cardRef}
          swipe={swipe}
          swipeHint={!swiped}
          headingAs="p"
          heading={`Your ${picks.length} picks for tonight`}
          picks={picks}
          index={index}
          dir={dir}
          length={pick.runtime != null ? formatRuntime(pick.runtime) : null}
          shrinking={false}
          ratingsNote={null}
          onGo={goTo}
          onSave={() => act("In the app, this saves it to your watchlist.")}
          onMore={() => setHint("In the app, this opens the film's page.")}
          onNewSet={() => setHint("In the app, this brings a fresh set.")}
          onChangeMood={() => setHint("In the app, this goes back to the moods.")}
          onSeen={() => act("In the app, this asks how it was and rates it.")}
          onDismiss={() => act("In the app, this hides it and sharpens your profile.")}
        />
      </div>
      {/* Reserved line so the hint never moves the page. */}
      <p role="status" className="mt-3 min-h-5 text-center text-xs text-muted-foreground">
        {hint}
      </p>
    </section>
  );
}
