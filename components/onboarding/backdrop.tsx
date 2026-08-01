"use client";

import Image from "next/image";
import * as React from "react";

import { getMovieList, getTvList } from "@/lib/api/catalog";
import { MOCK_POOL } from "@/lib/mock-onboarding";

/**
 * The app, glimpsed behind the onboarding overlay: real trending and
 * popular artwork laid out in dimmed rail-like rows. Deliberately not the
 * real explore component; nothing here is a link, nothing is focusable,
 * nothing logs an interaction, and screen readers skip it entirely. On
 * any fetch failure the local pool stands in, so the backdrop can never
 * block or break onboarding.
 */
export function OnboardingBackdrop() {
  const [rows, setRows] = React.useState<string[][]>([]);

  React.useEffect(() => {
    const ac = new AbortController();
    Promise.all([
      getMovieList("trending", ac.signal),
      getMovieList("popular", ac.signal),
      getTvList("popular", ac.signal),
    ])
      .then((lists) =>
        setRows(
          lists.map((list) =>
            list
              .map((m) => m.posterPath)
              .filter((p): p is string => p != null)
              .slice(0, 14)
          )
        )
      )
      .catch(() => {
        const pool = MOCK_POOL.filter((p) => p.posterPath).map(
          (p) => p.posterPath as string
        );
        setRows([pool.slice(0, 14), pool.slice(14, 28), pool.slice(0, 14)]);
      });
    return () => ac.abort();
  }, []);

  return (
    <div
      aria-hidden="true"
      // React types inert as a boolean attribute in 19; belt and braces
      // for assistive tech that reaches it anyway.
      inert
      className="absolute inset-0 overflow-hidden select-none"
    >
      <div className="flex h-full flex-col justify-center gap-6 opacity-35 blur-[2px]">
        {rows.map((row, i) => (
          <div
            key={i}
            className={
              "flex shrink-0 gap-4 " + (i % 2 === 1 ? "-ml-24" : "-ml-8")
            }
          >
            {row.map((poster, j) => (
              <div
                key={`${poster}-${j}`}
                className="relative aspect-[2/3] w-32 shrink-0 overflow-hidden rounded-art xl:w-36"
              >
                <Image
                  src={`https://image.tmdb.org/t/p/w342${poster}`}
                  alt=""
                  fill
                  sizes="144px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* One quiet dim so the overlay container reads as the surface. */}
      <div className="absolute inset-0 bg-background/55" />
    </div>
  );
}
