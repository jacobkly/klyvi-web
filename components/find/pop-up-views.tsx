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
  RotateCcw,
  Sparkles,
  Undo2,
  type LucideIcon,
} from "lucide-react";

import { ReasonChips } from "@/components/klyvi/reason-chips";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { mediaHref } from "@/lib/media-href";
import { tmdbImage } from "@/lib/tmdb-image";
import type { FeedMedia, Scored } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Find Next as the desktop pop-up. Two steps in one frame: a body, and a
 * footer bar whose bottom right corner always holds the way forward. The
 * data, the signals and the actions all stay with FindClient.
 */

export type MoodOption = {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  filmsOnly?: boolean;
};

const FOOTER =
  "flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-foreground/10 px-6 py-4";

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
      <div className="p-6 pb-4">
        <h1 className="pr-12 text-2xl font-semibold tracking-tight">
          What are you in the mood for?
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a shape, or do not. Klyvi will find one thing worth your time.
        </p>

        <div role="group" aria-label="Mood" className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
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
                  "group/tile hero-rise relative flex flex-col items-start gap-1 rounded-lg p-4 text-left ring-1 outline-none transition-[background-color,box-shadow,scale] duration-(--dur-press) focus-visible:ring-3 focus-visible:ring-ring/30 active:scale-[0.98] motion-reduce:active:scale-100 disabled:pointer-events-none disabled:opacity-50",
                  on
                    ? "bg-primary/15 ring-2 ring-violet-text"
                    : "bg-foreground/5 ring-foreground/10 hover:bg-foreground/10"
                )}
              >
                <m.icon
                  aria-hidden="true"
                  className={cn(
                    "mb-3 size-6 transition-colors duration-(--dur-press)",
                    on
                      ? "text-violet-text"
                      : "text-muted-foreground group-hover/tile:text-foreground"
                  )}
                />
                <span className="text-[15px] font-semibold text-foreground">{m.label}</span>
                <span aria-hidden="true" className="text-xs text-muted-foreground">
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
        {/* Always takes its line, so the footer never shifts. */}
        <p className="mt-3 min-h-4 text-xs text-muted-foreground">{note}</p>
      </div>

      <div className={FOOTER}>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
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
          <div className="flex items-center gap-3">
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
        <Button size="touch" className="ml-auto gap-2" onClick={onFind}>
          <Sparkles aria-hidden="true" data-icon="inline-start" />
          Find something
        </Button>
      </div>
    </div>
  );
}

const BODY =
  "grid gap-6 px-6 pt-4 pb-6 md:grid-cols-[14rem_1fr] md:gap-8 lg:grid-cols-[18rem_1fr]";

/** The pick's own shape while it loads, so nothing jumps when it lands. */
export function PickPanelSkeleton({ ref }: { ref?: PanelRef }) {
  return (
    <div
      ref={ref}
      tabIndex={-1}
      data-wide
      role="status"
      aria-label="Finding something"
      className="outline-none"
    >
      <div className="px-6 pt-6">
        <Skeleton className="h-5 w-48 rounded-full" />
      </div>
      <div className={BODY}>
        <Skeleton className="hidden aspect-[2/3] w-full rounded-art md:block" />
        <div>
          <Skeleton className="h-9 w-2/3 rounded-lg" />
          <Skeleton className="mt-3 h-5 w-32 rounded-lg" />
          <Skeleton className="mt-6 h-8 w-3/4 rounded-full" />
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
  heading,
  picks,
  index,
  dir,
  length,
  shrinking,
  ratingsNote,
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
  heading: string;
  picks: Scored[];
  index: number;
  /** Which way the last step went, so the new pick enters from there. */
  dir: 1 | -1;
  length: string | null;
  shrinking: boolean;
  ratingsNote: string | null;
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

  return (
    <div
      ref={ref}
      tabIndex={-1}
      data-wide
      data-slot="pick-panel"
      className="relative isolate outline-none"
    >
      {/* The artwork lights the frame from behind, faded out before the text
          needs the contrast. */}
      {backdrop ? (
        <div
          key={`art-${pick.mediaId}`}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 aspect-[16/7] overflow-hidden rounded-t-lg mask-b-from-0% mask-b-to-100% animate-in fade-in-0 duration-(--dur-max) motion-reduce:animate-none"
        >
          <Image src={backdrop} alt="" fill sizes="1024px" className="object-cover opacity-20" />
        </div>
      ) : null}

      <header ref={headerRef} className="px-6 pt-6 pr-16">
        <p className="text-sm text-muted-foreground">
          {heading}
          <span data-numeric className="ml-3 font-mono text-xs">
            {index + 1} of {total}
          </span>
        </p>
        {shrinking ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Nothing else fits right now, so the set is getting smaller. New set
            looks again.
          </p>
        ) : null}
      </header>

      <div className={BODY}>
        <Link
          key={`poster-${pick.mediaId}`}
          href={mediaHref(pick)}
          aria-label={pick.title}
          className={cn(
            "relative hidden aspect-[2/3] self-start overflow-hidden rounded-art bg-muted ring-1 ring-foreground/10 outline-none focus-visible:ring-3 focus-visible:ring-ring/30 md:block",
            enter
          )}
        >
          {poster ? (
            <Image src={poster} alt="" fill priority sizes="288px" className="object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
              {pick.title}
            </span>
          )}
        </Link>

        <div className="flex min-w-0 flex-col">
          <div aria-live="polite">
            <div key={`info-${pick.mediaId}`} className={enter}>
              <h2 className="line-clamp-2 text-3xl font-semibold tracking-tight text-balance text-foreground">
                {pick.title}
              </h2>
              <p
                data-numeric
                className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono text-sm text-muted-foreground"
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
                <p className="mt-1 text-sm text-muted-foreground">{pick.genres.join(" · ")}</p>
              ) : null}

              <div className="mt-6">
                {pick.reasons.length > 0 ? (
                  <>
                    <h3 className="text-xs font-medium tracking-[0.12em] uppercase text-muted-foreground">
                      Why this one
                    </h3>
                    <ReasonChips reasons={pick.reasons} max={4} className="mt-2" />
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    This is a pick people tend to agree on. Rate a few and Klyvi
                    starts explaining why it picked things for you specifically.
                  </p>
                )}
              </div>

              {pick.overview ? (
                <p className="mt-6 line-clamp-5 max-w-[65ch] text-[15px] leading-relaxed text-foreground/90">
                  {pick.overview}
                </p>
              ) : null}
            </div>
          </div>

          {/* Outside the keyed block and held to the bottom, so the buttons
              keep their place and their focus from pick to pick. */}
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-6">
            <Button size="touch" className="gap-2" onClick={onSave}>
              <Bookmark aria-hidden="true" data-icon="inline-start" />
              Add to watchlist
            </Button>
            <Link
              href={mediaHref(pick)}
              className={buttonVariants({ variant: "outline", size: "touch" })}
              onClick={onMore}
            >
              More about it
            </Link>
            <Button variant="ghost" size="touch" className="gap-2" onClick={onSeen}>
              <Check aria-hidden="true" data-icon="inline-start" />
              Seen it
            </Button>
            <Button
              variant="ghost"
              size="touch"
              className="gap-2 text-muted-foreground"
              onClick={onDismiss}
            >
              <EyeOff aria-hidden="true" data-icon="inline-start" />
              Not interested
            </Button>
          </div>
        </div>
      </div>

      <div className={FOOTER}>
        {/* The whole set at a glance, any of it one click away. */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous pick"
            disabled={index === 0}
            onClick={() => onGo(index - 1)}
          >
            <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={2} />
          </Button>
          <ul aria-label="Your picks" className="flex items-center gap-2">
            {picks.map((p, i) => {
              const on = i === index;
              const thumb = tmdbImage(p.posterPath);
              return (
                <li key={p.mediaId}>
                  <button
                    type="button"
                    aria-label={`Pick ${i + 1}: ${p.title}`}
                    aria-current={on ? "true" : undefined}
                    onClick={() => onGo(i)}
                    className={cn(
                      "relative block aspect-[2/3] w-10 overflow-hidden rounded-art bg-muted outline-none transition-[opacity,scale] duration-(--dur-base) focus-visible:ring-3 focus-visible:ring-ring/30 motion-reduce:transition-none",
                      on
                        ? "scale-110 ring-2 ring-violet-text motion-reduce:scale-100"
                        : "opacity-50 hover:opacity-100"
                    )}
                  >
                    {thumb ? (
                      <Image src={thumb} alt="" fill sizes="44px" className="object-cover" />
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
            aria-label="Next pick"
            disabled={index >= total - 1}
            onClick={() => onGo(index + 1)}
          >
            <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2} />
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-2">
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
          <p data-numeric className="w-full text-xs text-muted-foreground">
            {ratingsNote}
          </p>
        ) : null}
      </div>
    </div>
  );
}
