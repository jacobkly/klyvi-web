"use client";

import { Pause, Play } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { getMovieList } from "@/lib/api/catalog";
import { TAGLINE_CLAIM } from "@/lib/marketing-claims";
import { MOCK_POOL } from "@/lib/mock-onboarding";
import { useReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The marquee hero: real popular-film posters scrolling under the pitch,
 * adapted from the 21st.dev reference and reskinned to Klyvi (art radius,
 * no vendor colors, real Button). Motion is pure CSS, no framer. Reduced
 * motion (the system's or Settings') holds the strip still, and otherwise a
 * button pauses it, since it moves for more than five seconds (WCAG 2.2.2).
 *
 * The rise is a CSS animation, not `Reveal`, so the server HTML is visible
 * as sent and the hero paints before the page's JavaScript loads. `Reveal`
 * stays for the sections below the fold.
 */

/** One step of the hero's staggered rise. */
function Rise({ delay, children }: { delay: number; children: React.ReactNode }) {
  return (
    <div className="hero-rise" style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

const TITLE = "Stop scrolling. Start watching.";

export function MarqueeHero() {
  const reduced = useReducedMotion();
  const [paused, setPaused] = React.useState(false);
  const still = reduced || paused;
  const [posters, setPosters] = React.useState<string[]>(() =>
    MOCK_POOL.filter((p) => p.posterPath)
      .slice(0, 14)
      .map((p) => p.posterPath as string)
  );

  React.useEffect(() => {
    const ac = new AbortController();
    getMovieList("popular", ac.signal)
      .then((list) => {
        const paths = list
          .map((m) => m.posterPath)
          .filter((p): p is string => p != null)
          .slice(0, 14);
        if (paths.length >= 8) setPosters(paths);
      })
      .catch(() => {});
    return () => ac.abort();
  }, []);

  // Two identical sets make translateX(-50%) loop seamlessly. The gap is a
  // per-poster right margin, not a flex gap, so half the track is exactly
  // one set (a container gap would leave a half-gap seam at the wrap).
  const items = [...posters, ...posters].map((poster, index) => (
    <div
      key={`${poster}-${index}`}
      className="relative mr-3 aspect-[2/3] h-36 shrink-0 sm:mr-4 sm:h-48 overflow-hidden rounded-art ring-1 ring-foreground/10 md:h-60"
      style={{ rotate: `${index % 2 === 0 ? -2 : 3}deg` }}
    >
      {/* Plain img over next/image: fourteen small posters do not need
          per-image optimization, and the strip remounts them when the live
          list lands. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://image.tmdb.org/t/p/w342${poster}`}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover"
      />
    </div>
  ));

  return (
    <section className="relative flex flex-col items-center overflow-hidden px-4 pt-12 pb-8 text-center sm:pt-28 sm:pb-12">
      <div className="z-10 flex flex-col items-center">
        <Rise delay={0}>
          <span className="mb-4 inline-block sm:mb-5 glass rounded-full border px-4 py-1.5 text-sm font-medium text-muted-foreground">
            {TAGLINE_CLAIM}
          </span>
        </Rise>

        <Rise delay={80}>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-6xl">
            {TITLE}
          </h1>
        </Rise>

        <Rise delay={160}>
          <p className="mt-4 max-w-xl text-base sm:mt-5 text-muted-foreground sm:text-lg">
            Klyvi learns what you actually like and tells you what to watch
            right now, with the reason it picked it.
          </p>
        </Rise>

        <Rise delay={240}>
          <div className="mt-6 flex w-full max-w-xs items-center justify-center gap-4 sm:mt-8 sm:max-w-none">
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "touch" }), "w-full sm:w-auto")}
            >
              Get started
            </Link>
            <Link
              href="/signin"
              className="tap-target hidden items-center text-sm text-muted-foreground hover:text-foreground sm:inline-flex"
            >
              Sign in
            </Link>
          </div>
        </Rise>
      </div>

      {/* The poster strip, faded at both edges. The mask is functional, not
          decoration: it stops the loop ending in a hard vertical cut. */}
      <div className="relative mt-12 w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] sm:mt-28">
        <div
          className="marquee-track flex w-max"
          data-paused={still ? "" : undefined}
        >
          {items}
        </div>
      </div>
      {reduced ? null : (
        <Button
          variant="ghost"
          size="icon-touch"
          className="mt-4 text-muted-foreground"
          aria-label={paused ? "Play the posters" : "Pause the posters"}
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
        </Button>
      )}
    </section>
  );
}
