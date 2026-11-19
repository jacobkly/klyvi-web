"use client";

import Image from "next/image";
import * as React from "react";

import { getMovieList } from "@/lib/api/catalog";
import { MOCK_POOL } from "@/lib/mock-onboarding";
import { tmdbImage } from "@/lib/tmdb-image";

/** Each poster's place in the fan, back to front. */
const FAN = [
  "-rotate-6 -translate-x-24 translate-y-4",
  "rotate-6 translate-x-24 translate-y-4",
  "z-10",
];

/**
 * Three of this week's films fanned out beside the welcome on desktop, so
 * the first screen shows what Klyvi is about before a word is read. They
 * rise in one after another. Decoration only: hidden from assistive tech,
 * and the local pool stands in if the list fails.
 */
export function WelcomePosters() {
  const [posters, setPosters] = React.useState<string[]>([]);

  React.useEffect(() => {
    const ac = new AbortController();
    const pick = (paths: (string | null)[]) =>
      paths.filter((p): p is string => p != null).slice(0, FAN.length);
    getMovieList("trending", ac.signal)
      .then((list) => setPosters(pick(list.map((m) => m.posterPath))))
      .catch(() => {
        if (!ac.signal.aborted) setPosters(pick(MOCK_POOL.map((m) => m.posterPath)));
      });
    return () => ac.abort();
  }, []);

  return (
    <div aria-hidden="true" className="relative grid h-80 w-full place-items-center">
      {posters.map((poster, i) => (
        <div
          key={poster}
          className={"hero-rise absolute " + FAN[i]}
          style={{ animationDelay: `calc(${i + 1} * var(--dur-base))` }}
        >
          <div className="relative aspect-[2/3] w-40 overflow-hidden rounded-art ring-1 ring-foreground/10 xl:w-44">
            <Image
              src={tmdbImage(poster)}
              alt=""
              fill
              sizes="176px"
              className="object-cover"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
