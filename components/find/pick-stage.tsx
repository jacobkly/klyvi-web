"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import type { MovieDetail } from "@/lib/mock-media";
import { posterUrl, type Scored } from "@/lib/types";

/**
 * The presentation half of Find Next, shared by the live screen and the
 * marketing demo so the demo cannot drift when the real screen evolves.
 * No data fetching, no interaction logging; the owner decides all of that.
 */

/**
 * The backdrop-led hero: one title, full attention. Shared by the current
 * pick and by its neighbours, so a peek is visually the same object rather
 * than a different card that happens to sit beside it.
 *
 * `detailHref` is the poster and title link target; null renders them as
 * plain elements, which is what the signed-out marketing demo needs.
 */
export function PickHero({
  pick,
  detail,
  priority,
  detailHref,
}: {
  pick: Scored;
  detail?: MovieDetail | null;
  priority?: boolean;
  detailHref?: string | null;
}) {
  const backdropPath = pick.backdropPath ?? detail?.backdropPath ?? null;
  const poster = posterUrl(pick.posterPath, "w500");
  const href =
    detailHref === undefined ? `/movie/${pick.tmdbId}` : detailHref;

  const posterBox = (
    <div className="relative aspect-[2/3] overflow-hidden rounded-art bg-muted ring-1 ring-foreground/10">
      {poster ? (
        <Image src={poster} alt="" fill sizes="96px" className="object-cover" />
      ) : null}
    </div>
  );

  const titleEl = (
    <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
      {pick.title}
    </h2>
  );

  return (
    <div className="relative overflow-hidden rounded-lg ring-1 ring-foreground/10">
      <div className="relative aspect-[16/10] sm:aspect-[16/7]">
        {backdropPath ? (
          <Image
            src={`https://image.tmdb.org/t/p/w1280${backdropPath}`}
            alt=""
            fill
            priority={priority}
            sizes="(max-width: 1024px) 100vw, 704px"
            className="object-cover"
          />
        ) : poster ? (
          <Image
            src={poster}
            alt=""
            fill
            priority={priority}
            sizes="(max-width: 1024px) 100vw, 704px"
            className="object-cover object-top blur-2xl"
          />
        ) : (
          <div className="h-full bg-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-4 sm:gap-5 sm:p-6">
        {href ? (
          <Link
            href={href}
            aria-label={pick.title}
            className="hidden w-24 shrink-0 rounded-art outline-none focus-visible:ring-3 focus-visible:ring-ring/30 sm:block"
          >
            {posterBox}
          </Link>
        ) : (
          <div aria-hidden="true" className="hidden w-24 shrink-0 sm:block">
            {posterBox}
          </div>
        )}

        <div className="min-w-0 flex-1">
          {href ? (
            <Link
              href={href}
              className="rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              {titleEl}
            </Link>
          ) : (
            titleEl
          )}
          {/* Year and score share a line under the title: both are numbers
              about the film, and stacking them cost a row for no reason. */}
          {pick.year != null || pick.voteAverage != null ? (
            <p
              data-numeric
              className="mt-1.5 flex items-baseline gap-4 font-mono text-sm text-muted-foreground"
            >
              {pick.year != null ? <span>{pick.year}</span> : null}
              {pick.voteAverage != null ? (
                <span>
                  <span className="text-foreground">
                    {Math.round(pick.voteAverage * 10)}
                  </span>{" "}
                  / 100
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * The pick on either side, as its poster.
 *
 * A poster rather than the backdrop card: at this size the artwork is the
 * only part that reads, and a poster is the shape the eye already treats as
 * "another film" everywhere else in the app.
 *
 * `right-full` / `left-full` pin it just outside the centre card's edge, so
 * the gap is a margin rather than a percentage guess, and nothing overlaps.
 * Being absolutely positioned it adds no height, which is what keeps the
 * pager from moving when the neighbours change.
 *
 * The whole poster is one button, so a peek is a shortcut rather than
 * decoration. Its interior is inert and hidden from screen readers, which
 * reach the same picks through the Previous and Next controls.
 */
export function NeighbourPick({
  pick,
  side,
  onClick,
}: {
  pick: Scored;
  side: "left" | "right";
  onClick: () => void;
}) {
  const poster = posterUrl(pick.posterPath, "w342");

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${side === "left" ? "Previous" : "Next"} pick: ${pick.title}`}
      className={
        "absolute top-1/2 hidden w-32 -translate-y-1/2 cursor-pointer rounded-art opacity-40 transition-opacity duration-(--dur-base) outline-none hover:opacity-75 focus-visible:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/30 lg:block xl:w-36 " +
        (side === "left" ? "right-full mr-6" : "left-full ml-6")
      }
    >
      <div
        aria-hidden="true"
        className="pointer-events-none relative aspect-[2/3] overflow-hidden rounded-art bg-muted ring-1 ring-foreground/10"
      >
        {poster ? (
          <Image
            src={poster}
            alt=""
            fill
            sizes="144px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-2 text-center">
            <span className="text-xs text-muted-foreground">{pick.title}</span>
          </div>
        )}
      </div>
    </button>
  );
}
