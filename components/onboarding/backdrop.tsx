"use client";

import Image from "next/image";
import * as React from "react";

import { getMovieList, getTvList } from "@/lib/api/catalog";
import { MOCK_POOL } from "@/lib/mock-onboarding";
import { tmdbImage } from "@/lib/tmdb-image";

/**
 * The app, glimpsed behind the onboarding overlay: real trending and
 * popular artwork laid out in dimmed rail-like rows. Deliberately not the
 * real explore component; nothing here is a link, nothing is focusable,
 * nothing logs an interaction, and screen readers skip it entirely. On
 * any fetch failure the local pool stands in, so the backdrop can never
 * block or break onboarding.
 */
/** Unique posters per row, and how many slots each row fills. The wall is
 *  dim and blurred, so a few posters repeated read the same as many. */
const PER_ROW = 4;
const SLOTS = 24;

function repeatRow(posters: string[]): string[] {
  if (posters.length === 0) return [];
  return Array.from({ length: SLOTS }, (_, i) => posters[i % posters.length]);
}

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
              .slice(0, PER_ROW)
          )
        )
      )
      .catch(() => {
        const pool = MOCK_POOL.filter((p) => p.posterPath).map(
          (p) => p.posterPath as string
        );
        setRows([0, 1, 2].map((r) => pool.slice(r * PER_ROW, (r + 1) * PER_ROW)));
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
              "wall-drift flex w-max shrink-0 gap-4 " +
              (i % 2 === 1 ? "-ml-24 [animation-direction:reverse]" : "-ml-8")
            }
          >
            {repeatRow(row).map((poster, j) => (
              <div
                key={`${poster}-${j}`}
                className="relative aspect-[2/3] w-32 shrink-0 overflow-hidden rounded-art xl:w-36"
              >
                <Image
                  src={tmdbImage(poster)}
                  alt=""
                  fill
                  sizes="92px"
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
