"use client";

import Image from "next/image";
import Link from "next/link";
import { Bookmark, Check, EyeOff } from "lucide-react";

import { ReasonChips } from "@/components/klyvi/reason-chips";
import { Button } from "@/components/ui/button";
import { posterUrl, type Reason } from "@/lib/types";
import type { Scored } from "@/lib/mock-reco";

/**
 * The large Find Next card. The reason chips are the point of it: they sit
 * directly under the title, never tucked away. Actions per 06-copy.md.
 */
function RecommendationCard({
  item,
  onSave,
  onDismiss,
  onSeen,
}: {
  item: Scored;
  onSave: (item: Scored) => void;
  onDismiss: (item: Scored) => void;
  onSeen: (item: Scored) => void;
}) {
  const src = posterUrl(item.posterPath, "w342");

  return (
    <div className="flex gap-4 rounded-lg bg-card p-4 ring-1 ring-foreground/10 sm:gap-5 sm:p-5">
      <Link
        href={`/movie/${item.tmdbId}`}
        className="w-24 shrink-0 outline-none focus-visible:ring-3 focus-visible:ring-ring/30 rounded-art sm:w-32"
        aria-label={item.title}
      >
        <div className="relative aspect-[2/3] overflow-hidden rounded-art bg-muted ring-1 ring-foreground/10">
          {src ? (
            <Image
              src={src}
              alt=""
              fill
              sizes="128px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-2 text-center">
              <span className="text-xs text-muted-foreground">{item.title}</span>
            </div>
          )}
        </div>
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href={`/movie/${item.tmdbId}`}
          className="outline-none focus-visible:ring-3 focus-visible:ring-ring/30 rounded-sm"
        >
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            {item.title}{" "}
            {item.year != null ? (
              <span data-numeric className="font-mono text-xs font-normal text-muted-foreground">
                {item.year}
              </span>
            ) : null}
          </h3>
        </Link>

        {item.voteAverage != null ? (
          <p data-numeric className="mt-0.5 font-mono text-xs text-muted-foreground">
            {Math.round(item.voteAverage * 10)}
          </p>
        ) : null}

        <ReasonChips reasons={item.reasons as Reason[]} className="mt-2.5" />

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" className="gap-1.5" onClick={() => onSave(item)}>
            <Bookmark aria-hidden="true" data-icon="inline-start" />
            Add to watchlist
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => onSeen(item)}
          >
            <Check aria-hidden="true" data-icon="inline-start" />
            Seen it
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => onDismiss(item)}
          >
            <EyeOff aria-hidden="true" data-icon="inline-start" />
            Not interested
          </Button>
        </div>
      </div>
    </div>
  );
}

export { RecommendationCard };
