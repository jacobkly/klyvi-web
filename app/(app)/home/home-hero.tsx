"use client";

import Link from "next/link";
import { Check, EyeOff, Plus } from "lucide-react";

import { FadeImage } from "@/components/klyvi/poster-parts";
import { ReasonChips } from "@/components/klyvi/reason-chips";
import { Button } from "@/components/ui/button";
import { mediaHref } from "@/lib/media-href";
import { formatRuntime, formatSeasons } from "@/lib/mock-media";
import { tmdbImage } from "@/lib/tmdb-image";
import type { Scored } from "@/lib/types";
import { cn } from "@/lib/utils";

export type HeroAction = "save" | "seen" | "dismiss";

/**
 * The pick for tonight, full width over its backdrop: the title, the
 * strongest reason, and the three things you can do about it. The other top
 * picks sit beside it as posters (below it on phones), and choosing one
 * brings it in.
 *
 * The backdrop is keyed on the pick, so a change fades the new one in over
 * the page colour (FadeImage), which reduced motion cuts to a swap.
 */
export function HomeHero({
  picks,
  index,
  onSelect,
  onAct,
  onOpen,
}: {
  /** The top few picks the hero takes turns with. */
  picks: Scored[];
  index: number;
  onSelect: (i: number) => void;
  onAct: (kind: HeroAction) => void;
  /** A click through to the title's page, for the click signal. */
  onOpen: (p: Scored) => void;
}) {
  const pick = picks[index];
  if (!pick) return null;
  const art = tmdbImage(pick.backdropPath ?? pick.posterPath);
  const meta = [
    pick.year != null ? String(pick.year) : null,
    pick.mediaType === "movie"
      ? formatRuntime(pick.runtime)
      : formatSeasons(pick.seasonCount),
  ].filter(Boolean);

  return (
    <section
      aria-label="Tonight's pick"
      className="relative isolate overflow-hidden rounded-lg bg-card ring-1 ring-foreground/10"
    >
      <div className="absolute inset-0 -z-10">
        {art ? (
          <FadeImage
            key={pick.mediaId}
            src={art}
            alt=""
            fill
            priority
            sizes="(max-width: 1400px) 100vw, 1400px"
            className={cn(
              "object-cover",
              pick.backdropPath ? "object-[center_25%]" : "object-top blur-2xl"
            )}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/10" />
        <div className="absolute inset-0 hidden bg-gradient-to-r from-background/80 via-background/30 to-transparent lg:block" />
        {/* Below lg the text sits over the top of the backdrop, where the
            gradient is thinnest, so an even scrim keeps it readable on a
            bright image in either theme. */}
        <div className="absolute inset-0 bg-background/60 lg:hidden" />
      </div>

      <div className="flex min-h-80 flex-col justify-end gap-6 p-4 sm:min-h-[22rem] sm:p-6 lg:flex-row lg:items-end lg:justify-between lg:p-8">
        <div className="min-w-0 max-w-2xl">
          <p className="text-xs font-medium tracking-[0.12em] text-foreground/80 uppercase">
            Tonight&apos;s pick
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            <Link
              href={mediaHref(pick)}
              onClick={() => onOpen(pick)}
              className="rounded-sm outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              {pick.title}
            </Link>
          </h2>
          {meta.length > 0 ? (
            <p
              data-numeric
              className="mt-1.5 font-mono text-sm text-foreground/80"
            >
              {meta.join(" · ")}
            </p>
          ) : null}
          <ReasonChips reasons={pick.reasons} max={1} className="mt-3" />

          <div className="mt-5 flex flex-wrap gap-2">
            <Button size="touch" onClick={() => onAct("save")}>
              <Plus data-icon="inline-start" aria-hidden="true" strokeWidth={2} />
              Add
            </Button>
            <Button
              size="touch"
              variant="secondary"
              onClick={() => onAct("seen")}
            >
              <Check data-icon="inline-start" aria-hidden="true" strokeWidth={2} />
              Seen it
            </Button>
            <Button size="touch" variant="ghost" onClick={() => onAct("dismiss")}>
              <EyeOff data-icon="inline-start" aria-hidden="true" strokeWidth={2} />
              Not for me
            </Button>
          </div>
        </div>

        {picks.length > 1 ? (
          <ul
            aria-label="Other top picks"
            className="flex shrink-0 gap-2 lg:gap-3"
          >
            {picks.map((p, i) => (
              <li key={p.mediaId} className="w-14 sm:w-16 lg:w-24 xl:w-28">
                <button
                  type="button"
                  aria-label={`Show ${p.title}`}
                  aria-pressed={i === index}
                  onClick={() => onSelect(i)}
                  className={cn(
                    "relative block aspect-[2/3] w-full overflow-hidden rounded-art bg-muted outline-none transition-transform duration-(--dur-base) ease-(--ease-enter) focus-visible:ring-3 focus-visible:ring-ring/50 pointer-fine:hover:-translate-y-1",
                    i === index ? "ring-2 ring-primary" : "ring-1 ring-foreground/10"
                  )}
                >
                  {p.posterPath ? (
                    <FadeImage
                      src={tmdbImage(p.posterPath)}
                      alt=""
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center p-2 text-center text-[11px] text-muted-foreground">
                      {p.title}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
