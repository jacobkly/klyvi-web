"use client";

import Link from "next/link";
import * as React from "react";

import { buttonVariants } from "@/components/ui/button";
import { getMovieList } from "@/lib/api/catalog";
import { TAGLINE_CLAIM } from "@/lib/marketing-claims";
import { MOCK_POOL } from "@/lib/mock-onboarding";

/**
 * The marquee hero: real popular-film posters scrolling under the pitch,
 * adapted from the 21st.dev reference and reskinned to Klyvi (art radius,
 * no vendor colors, real Button). Motion is pure CSS now, no framer: the
 * marquee is a disclosed reduced-motion exception (see globals.css), the
 * entrance rise honors it.
 */

const TITLE = "Stop scrolling. Start watching.";

export function MarqueeHero() {
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
      className="relative mr-4 aspect-[2/3] h-48 shrink-0 overflow-hidden rounded-art ring-1 ring-foreground/10 md:h-60"
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
    <section className="relative flex flex-col items-center overflow-hidden px-4 pt-24 pb-10 text-center sm:pt-28">
      <div className="z-10 flex flex-col items-center">
        <span className="rise mb-5 inline-block rounded-full border border-border bg-card/50 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-sm">
          {TAGLINE_CLAIM}
        </span>

        <h1
          className="rise max-w-3xl text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-6xl"
          style={{ animationDelay: "0.06s" }}
        >
          {TITLE}
        </h1>

        <p
          className="rise mt-5 max-w-xl text-base text-muted-foreground sm:text-lg"
          style={{ animationDelay: "0.14s" }}
        >
          Klyvi learns what you actually like and tells you what to watch
          right now, with the reason it picked it.
        </p>

        <div
          className="rise mt-8 flex items-center gap-4"
          style={{ animationDelay: "0.22s" }}
        >
          <Link href="/signup" className={buttonVariants({ size: "touch" })}>
            Get started
          </Link>
          <Link
            href="/signin"
            className="tap-target inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            Sign in
          </Link>
        </div>
      </div>

      {/* The poster strip, faded at both edges. The mask is functional, not
          decoration: it stops the loop ending in a hard vertical cut. */}
      <div className="relative mt-14 w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="marquee-track flex w-max">{items}</div>
      </div>
    </section>
  );
}
