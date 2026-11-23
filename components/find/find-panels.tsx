"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import {
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Info,
  MoveHorizontal,
  RotateCcw,
  Sparkles,
  Undo2,
  type LucideIcon,
} from "lucide-react";

import { ACTION_TILE } from "@/components/find/action-tile";
import { ReasonChips } from "@/components/klyvi/reason-chips";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { mediaHref } from "@/lib/media-href";
import { tmdbImage } from "@/lib/tmdb-image";
import type { FeedMedia, Scored } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Find Next's two steps, one design with two layouts. At md+ they fill a
 * frame (the pop-up, or the page's own panel): a body, and a footer bar whose
 * bottom right corner always holds the way forward. Phones get no frame. The
 * same tiles, artwork and poster strip run the width of the screen, the main
 * button sits above the tab bar, and picks swipe. The data, the signals and
 * the actions all stay with the owner, so the landing page's demo is this
 * same screen.
 */

export type MoodOption = {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  filmsOnly?: boolean;
};

/** One labelled choice: a row on phones, part of the footer line at md+. */
const ROW = "flex items-center justify-between gap-3 px-4 py-2 md:p-0";

const FOOTER =
  "flex flex-wrap items-center justify-between gap-3 px-4 pt-4 md:border-t lg:gap-x-6 md:border-foreground/10 md:px-6 md:py-4 @min-[66rem]:px-8";

type PanelRef = React.Ref<HTMLDivElement>;

/** Step one: the mood as tiles, the two choices and the button beneath. */
export function MoodPanel({
  ref,
  moods,
  mood,
  onMood,
  media,
  mediaOptions,
  onMedia,
  count,
  onCount,
  note,
  onFind,
}: {
  ref?: PanelRef;
  moods: MoodOption[];
  mood: string;
  onMood: (id: string) => void;
  media: FeedMedia;
  mediaOptions: { value: FeedMedia; label: string }[];
  onMedia: (m: FeedMedia) => void;
  count: 3 | 5 | 7;
  onCount: (n: 3 | 5 | 7) => void;
  /** Shown under the tiles when a choice limits another. */
  note: string | null;
  onFind: () => void;
}) {
  return (
    <div ref={ref} tabIndex={-1} className="outline-none">
      <div className="px-4 pt-2 md:p-6 md:pb-4">
        <h1 className="text-[22px] leading-tight font-semibold tracking-tight md:pr-12 md:text-2xl">
          What are you in the mood for?
        </h1>
        <p className="mt-1 text-sm text-muted-foreground short-phone:hidden">
          Pick a shape, or do not. Klyvi will find one thing worth your time.
        </p>

        <div role="group" aria-label="Mood" className="mt-4 grid grid-cols-2 gap-3 short-phone:gap-2 md:mt-6 md:grid-cols-3">
          {moods.map((m, i) => {
            const on = mood === m.id;
            return (
              <button
                key={m.id}
                type="button"
                // Each tile rises a beat after the one before it.
                style={{ animationDelay: `calc(${i + 1} * var(--dur-press) / 2)` }}
                aria-pressed={on}
                disabled={m.filmsOnly === true && media === "tv"}
                onClick={() => onMood(m.id)}
                className={cn(
                  "group/tile hero-rise relative flex flex-col items-start gap-1 rounded-lg p-3 text-left ring-1 md:p-4 outline-none transition-[background-color,box-shadow,scale] duration-(--dur-press) focus-visible:ring-3 focus-visible:ring-ring/30 active:scale-[0.98] motion-reduce:active:scale-100 disabled:pointer-events-none disabled:opacity-50",
                  on
                    ? "bg-primary/15 ring-2 ring-violet-text"
                    : "bg-foreground/5 ring-foreground/10 hover:bg-foreground/10"
                )}
              >
                <m.icon
                  aria-hidden="true"
                  className={cn(
                    "mb-2 size-5 transition-colors duration-(--dur-press) short-phone:mb-1 md:mb-3 md:size-6",
                    on
                      ? "text-violet-text"
                      : "text-muted-foreground group-hover/tile:text-foreground"
                  )}
                />
                <span className="text-[15px] font-semibold text-foreground">{m.label}</span>
                <span aria-hidden="true" className="text-xs text-muted-foreground short-phone:hidden">
                  {m.hint}
                </span>
                {on ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground animate-in zoom-in-50 fade-in-0 duration-(--dur-base) motion-reduce:animate-none"
                  >
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        {/* Keeps its line, so the footer never shifts. Short phones only give
            it one when there is something to say. */}
        <p className="mt-3 min-h-4 short-phone:min-h-0 text-xs text-muted-foreground">{note}</p>
      </div>

      <div className={cn(FOOTER, "max-md:contents")}>
        <div className="max-md:glass mx-4 divide-y divide-foreground/10 rounded-lg max-md:border md:m-0 md:flex md:flex-wrap md:items-center md:gap-x-6 md:gap-y-3 md:divide-y-0">
          <div className={ROW}>
          <span className="text-sm text-muted-foreground md:hidden">Films or TV?</span>
          <ToggleGroup
            value={[media]}
            onValueChange={(v: unknown[]) => {
              // Pressing the chosen item again empties the group. Ignore
              // that, so one choice is always on.
              const next = mediaOptions.find((o) => o.value === v.at(-1));
              if (next) onMedia(next.value);
            }}
            spacing={0}
            variant="outline"
            aria-label="Films or TV"
          >
            {mediaOptions.map((o) => (
              <ToggleGroupItem key={o.value} value={o.value}>
                {o.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          </div>
          <div className={ROW}>
            <span className="text-sm text-muted-foreground">How many?</span>
            <ToggleGroup
              value={[String(count)]}
              onValueChange={(v: unknown[]) => {
                const n = Number(v.at(-1));
                if (n === 3 || n === 5 || n === 7) onCount(n);
              }}
              spacing={0}
              variant="outline"
              aria-label="How many picks"
            >
              {[3, 5, 7].map((n) => (
                <ToggleGroupItem key={n} value={String(n)} className="font-mono">
                  {n}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
        <div className="mt-4 flex px-4 md:mt-0 md:ml-auto md:px-0">
          <Button size="touch" className="flex-1 gap-2" onClick={onFind}>
            <Sparkles aria-hidden="true" data-icon="inline-start" />
            Find something
          </Button>
        </div>
      </div>
    </div>
  );
}

// Phones: the poster beside the title, everything else beneath both. Wider:
// the poster down the left, and the actions held to the bottom of the right.
// Past 1080p the frame is wider than that needs (the @ steps, measured on the
// panel itself), so the poster, the type and the strip of picks grow.
const BODY =
  "grid grid-cols-[7rem_1fr] gap-x-4 gap-y-4 px-4 pt-4 short-phone:gap-y-3 md:grid-cols-[12rem_1fr] md:grid-rows-[auto_1fr_auto] md:gap-x-8 md:gap-y-6 md:px-6 md:pb-6 lg:grid-cols-[14rem_1fr] xl:grid-cols-[18rem_1fr] @min-[66rem]:grid-cols-[22rem_1fr] @min-[66rem]:gap-x-12 @min-[66rem]:px-8 @min-[80rem]:grid-cols-[26rem_1fr]";
const POSTER = "row-start-1 aspect-[2/3] self-start overflow-hidden rounded-art md:row-span-3";
const BELOW = "col-span-2 min-w-0 md:col-span-1 md:col-start-2";

/** The pick's own shape while it loads, so nothing jumps when it lands. */
export function PickPanelSkeleton({ ref }: { ref?: PanelRef }) {
  return (
    <div
      ref={ref}
      tabIndex={-1}
      data-wide
      role="status"
      aria-label="Finding something"
      className="@container outline-none"
    >
      <div className="px-4 pt-2 md:px-6 md:pt-6 @min-[66rem]:px-8">
        <Skeleton className="h-5 w-48 rounded-full" />
      </div>
      <div className={BODY}>
        <Skeleton className={cn(POSTER, "w-full")} />
        <div>
          <Skeleton className="h-9 w-2/3 rounded-lg" />
          <Skeleton className="mt-3 h-5 w-32 max-w-full rounded-lg" />
        </div>
        <div className={BELOW}>
          <Skeleton className="h-8 w-3/4 rounded-full" />
          <Skeleton className="mt-6 h-24 w-full rounded-lg" />
        </div>
      </div>
      <div className={FOOTER}>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="aspect-[2/3] w-10 rounded-art" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Step two: one pick at a time, poster beside what it is and why. */
export function PickPanel({
  ref,
  headerRef,
  cardRef,
  swipe,
  swipeHint = false,
  heading,
  headingAs: Heading = "h1",
  picks,
  index,
  dir,
  length,
  shrinking,
  ratingsNote,
  demo = false,
  onGo,
  onSave,
  onMore,
  onSeen,
  onDismiss,
  onNewSet,
  onChangeMood,
}: {
  ref?: PanelRef;
  headerRef?: React.Ref<HTMLElement>;
  /** What a sideways drag moves, and the handlers that move it. */
  cardRef?: React.Ref<HTMLDivElement>;
  swipe?: React.HTMLAttributes<HTMLDivElement>;
  /** Say on the poster that it swipes, phones only. */
  swipeHint?: boolean;
  heading: string;
  headingAs?: "h1" | "p";
  picks: Scored[];
  index: number;
  /** Which way the last step went, so the new pick enters from there. */
  dir: 1 | -1;
  length: string | null;
  shrinking: boolean;
  ratingsNote: string | null;
  /** The signed-out demo: the same screen, with nothing linking out. */
  demo?: boolean;
  onGo: (i: number) => void;
  onSave: () => void;
  onMore: () => void;
  onSeen: () => void;
  onDismiss: () => void;
  onNewSet: () => void;
  onChangeMood: () => void;
}) {
  const pick = picks[index];
  const total = picks.length;
  const poster = tmdbImage(pick.posterPath);
  const backdrop = tmdbImage(pick.backdropPath);
  const enter = cn(
    "animate-in fade-in-0 duration-(--dur-slow) motion-reduce:animate-none",
    dir === 1 ? "slide-in-from-right-4" : "slide-in-from-left-4"
  );

  const posterArt = poster ? (
    <Image
      src={poster}
      alt=""
      fill
      priority={!demo}
      sizes="(max-width: 48rem) 112px, (max-width: 120rem) 288px, 416px"
      className="object-cover"
    />
  ) : (
    <span className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
      {pick.title}
    </span>
  );
  const posterHint =
    swipeHint && total > 1 ? (
      <span
        aria-hidden="true"
        className="glass pointer-events-none absolute inset-x-2 bottom-2 flex items-center justify-center gap-1.5 rounded-full border py-1 text-xs font-medium text-foreground md:hidden"
      >
        <MoveHorizontal className="swipe-hint size-3.5" strokeWidth={2} />
        Swipe
      </span>
    ) : null;

  return (
    <div
      ref={ref}
      tabIndex={-1}
      data-wide
      data-slot="pick-panel"
      className="@container relative isolate outline-none"
    >
      {/* The artwork lights the frame from behind, faded out before the text
          needs the contrast. */}
      {backdrop ? (
        <div
          key={`art-${pick.mediaId}`}
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 -z-10 aspect-[4/3] overflow-hidden mask-b-from-0% mask-b-to-100% animate-in fade-in-0 duration-(--dur-max) motion-reduce:animate-none md:aspect-[16/7] md:rounded-t-lg",
            // On a phone's page it runs up behind the top bar to the edge.
            !demo && "max-md:-top-14"
          )}
        >
          <Image
            src={backdrop}
            alt=""
            fill
            sizes="(max-width: 48rem) 100vw, (max-width: 120rem) 1024px, 1440px"
            className="object-cover opacity-30 md:opacity-20"
          />
        </div>
      ) : null}

      <header ref={headerRef} className="scroll-mt-16 px-4 pt-2 md:px-6 md:pt-6 md:pr-16 @min-[66rem]:pl-8">
        <div className="flex items-baseline justify-between gap-3 text-sm text-muted-foreground md:justify-start">
          <Heading>{heading}</Heading>
          <span data-numeric className="font-mono text-xs">
            {index + 1} of {total}
          </span>
        </div>
        {shrinking ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Nothing else fits right now, so the set is getting smaller. New set
            looks again.
          </p>
        ) : null}
      </header>

      <div
        data-slot="pick-stage"
        className="touch-pan-y overflow-x-clip"
        {...swipe}
      >
      <div ref={cardRef} className={BODY}>
        {demo ? (
          <div
            key={`poster-${pick.mediaId}`}
            className={cn(POSTER, "relative bg-muted ring-1 ring-foreground/10", enter)}
          >
            {posterArt}
            {posterHint}
          </div>
        ) : (
          <Link
            key={`poster-${pick.mediaId}`}
            href={mediaHref(pick)}
            aria-label={pick.title}
            className={cn(
              POSTER,
              "relative bg-muted ring-1 ring-foreground/10 outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
              enter
            )}
          >
            {posterArt}
            {posterHint}
          </Link>
        )}

          <div aria-live="polite">
            <div key={`info-${pick.mediaId}`} className={enter}>
              <h2 className="line-clamp-3 text-2xl font-semibold tracking-tight text-balance text-foreground md:line-clamp-2 md:text-3xl @min-[66rem]:text-4xl @min-[80rem]:text-5xl">
                {pick.title}
              </h2>
              <p
                data-numeric
                className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono text-sm text-muted-foreground @min-[66rem]:mt-3 @min-[66rem]:text-base"
              >
                {pick.year != null ? <span>{pick.year}</span> : null}
                {pick.voteAverage != null ? (
                  <span>
                    <span className="text-foreground">{Math.round(pick.voteAverage * 10)}</span> /
                    100
                  </span>
                ) : null}
                {length ? <span>{length}</span> : null}
              </p>
              {pick.genres.length > 0 ? (
                <p className="mt-1 text-sm text-muted-foreground @min-[66rem]:text-base">{pick.genres.join(" · ")}</p>
              ) : null}
            </div>
          </div>

        <div
          key={`why-${pick.mediaId}`}
          className={cn(BELOW, enter)}
        >
                {pick.reasons.length > 0 ? (
                  <div>
                    <h3 className="text-xs font-medium tracking-[0.12em] uppercase text-muted-foreground">
                      Why this one
                    </h3>
                    <ReasonChips reasons={pick.reasons} max={4} className="mt-2 @min-[66rem]:mt-3" />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    This is a pick people tend to agree on. Rate a few and Klyvi
                    starts explaining why it picked things for you specifically.
                  </p>
                )}

              {pick.overview ? (
                <p className="mt-4 line-clamp-4 short-phone:line-clamp-3 max-w-[65ch] text-[15px] md:mt-6 md:line-clamp-5 leading-relaxed text-foreground/90 @min-[66rem]:line-clamp-8 @min-[66rem]:text-base @min-[66rem]:leading-relaxed @min-[80rem]:mt-8 @min-[80rem]:text-xl @min-[80rem]:leading-relaxed">
                  {pick.overview}
                </p>
              ) : null}
        </div>

          {/* Outside the keyed block and held to the bottom, so the buttons
              keep their place and their focus from pick to pick. */}
          <div
            className={cn(
              BELOW,
              "grid grid-cols-3 gap-2 md:grid-cols-2 lg:flex lg:flex-wrap lg:items-center"
            )}
          >
            <Button size="touch" className="col-span-full gap-2 md:col-span-1" onClick={onSave}>
              <Bookmark aria-hidden="true" data-icon="inline-start" />
              Add to watchlist
            </Button>
            {demo ? (
              <Button variant="outline" size="touch" className={ACTION_TILE} onClick={onMore}>
                <Info aria-hidden="true" className="md:hidden" />
                More about it
              </Button>
            ) : (
              <Link
                href={mediaHref(pick)}
                className={cn(buttonVariants({ variant: "outline", size: "touch" }), ACTION_TILE)}
                onClick={onMore}
              >
                <Info aria-hidden="true" className="md:hidden" />
                More about it
              </Link>
            )}
            <Button variant="ghost" size="touch" className={ACTION_TILE} onClick={onSeen}>
              <Check aria-hidden="true" />
              Seen it
            </Button>
            <Button
              variant="ghost"
              size="touch"
              className={cn(ACTION_TILE, "text-muted-foreground")}
              onClick={onDismiss}
            >
              <EyeOff aria-hidden="true" />
              Not interested
            </Button>
          </div>
      </div>
      </div>

      <div className={FOOTER}>
        {/* The whole set at a glance, any of it one click away. */}
        <div className="flex items-center gap-3 max-md:w-full max-md:justify-center">
          <Button
            variant="outline"
            size="icon"
            className="max-lg:hidden"
            aria-label="Previous pick"
            disabled={index === 0}
            onClick={() => onGo(index - 1)}
          >
            <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={2} />
          </Button>
          <ul aria-label="Your picks" className="flex min-w-0 items-center gap-2 max-md:flex-1 max-md:justify-center">
            {picks.map((p, i) => {
              const on = i === index;
              const thumb = tmdbImage(p.posterPath);
              return (
                <li key={p.mediaId} className="min-w-0 max-md:max-w-12 max-md:flex-1">
                  <button
                    type="button"
                    aria-label={`Pick ${i + 1}: ${p.title}`}
                    aria-current={on ? "true" : undefined}
                    onClick={() => onGo(i)}
                    className={cn(
                      "relative block aspect-[2/3] w-full overflow-hidden md:w-10 @min-[66rem]:w-12 rounded-art bg-muted outline-none transition-[opacity,scale] duration-(--dur-base) focus-visible:ring-3 focus-visible:ring-ring/30 motion-reduce:transition-none",
                      on
                        ? "scale-110 ring-2 ring-violet-text motion-reduce:scale-100"
                        : "opacity-50 hover:opacity-100"
                    )}
                  >
                    {thumb ? (
                      <Image src={thumb} alt="" fill sizes="48px" className="object-cover" />
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">{i + 1}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          <Button
            variant="outline"
            size="icon"
            className="max-lg:hidden"
            aria-label="Next pick"
            disabled={index >= total - 1}
            onClick={() => onGo(index + 1)}
          >
            <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2} />
          </Button>
        </div>

        <div className="grid grid-cols-2 items-center gap-2 max-md:w-full md:ml-auto md:flex">
          <Button variant="ghost" className="gap-2" onClick={onChangeMood}>
            <Undo2 aria-hidden="true" data-icon="inline-start" />
            Change mood
          </Button>
          <Button variant="outline" className="gap-2" onClick={onNewSet}>
            <RotateCcw aria-hidden="true" data-icon="inline-start" />
            New set
          </Button>
        </div>
        {ratingsNote ? (
          <p data-numeric className="w-full text-xs text-muted-foreground max-md:text-center">
            {ratingsNote}
          </p>
        ) : null}
      </div>
    </div>
  );
}
