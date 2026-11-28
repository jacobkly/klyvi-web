"use client";

import { Check } from "lucide-react";

import { isWatched, useWatched } from "@/components/klyvi/watched-provider";
import { cn } from "@/lib/utils";

/**
 * A check in the artwork's top-left corner when the user has seen the title
 * through, and the dark layer over the art when a list above it asks for
 * watched titles to be dimmed (`data-dim-watched` on any ancestor). Goes
 * inside a `relative` artwork box. Renders nothing for a title not watched.
 */
export function WatchedMark({
  mediaType,
  tmdbId,
  size = "default",
}: {
  mediaType: string;
  tmdbId: number;
  /** `sm` for a thumb the size of a ranked row's. */
  size?: "default" | "sm";
}) {
  const watched = useWatched();
  if (!isWatched(watched, mediaType, tmdbId)) return null;
  return (
    <>
      <span
        aria-hidden="true"
        data-slot="watched-dim"
        className="pointer-events-none absolute inset-0 hidden bg-black/60 in-data-[dim-watched]:block"
      />
      <span
        role="img"
        aria-label="Watched"
        data-slot="watched-mark"
        className={cn(
          "pointer-events-none absolute inline-flex items-center justify-center rounded-full bg-black/70 text-white ring-1 ring-white/20",
          size === "sm" ? "top-0.5 left-0.5 size-4" : "top-1 left-1 size-5"
        )}
      >
        <Check
          aria-hidden="true"
          strokeWidth={2.5}
          className={size === "sm" ? "size-2.5" : "size-3"}
        />
      </span>
    </>
  );
}
