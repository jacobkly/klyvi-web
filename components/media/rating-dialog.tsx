"use client";

import Image from "next/image";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { posterUrl } from "@/lib/types";

/**
 * The quick rating step behind "Seen it": a watched-but-unrated title is the
 * weakest signal the recommender can get, and this is the one moment the
 * user is already thinking about the film. One slider, one save, and an
 * explicit no-rating exit so the fact still gets logged.
 */
export function RatingDialog({
  title,
  year,
  posterPath,
  open,
  onOpenChange,
  onSubmit,
}: {
  title: string;
  year: number | null;
  posterPath: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Score 0..100, or null for "seen but not rating it". */
  onSubmit: (score: number | null) => void;
}) {
  const [score, setScore] = React.useState(75);
  const poster = posterUrl(posterPath);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>How was it?</DialogTitle>
          <DialogDescription>
            You have seen {title}
            {year != null ? ` (${year})` : ""}. A score sharpens every
            recommendation after it.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4">
          {poster ? (
            <div className="relative aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-art bg-muted ring-1 ring-foreground/10">
              <Image src={poster} alt="" fill sizes="64px" className="object-cover" />
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <p
              data-numeric
              className="font-mono text-3xl font-semibold text-foreground"
            >
              {score}
            </p>
            <Slider
              value={score}
              onValueChange={(v) =>
                setScore(Array.isArray(v) ? (v[0] ?? 75) : (v as number))
              }
              min={0}
              max={100}
              step={1}
              aria-label="Your score"
              className="mt-3"
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button size="touch" className="w-full" onClick={() => onSubmit(score)}>
            Save rating
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => onSubmit(null)}
          >
            Just mark it seen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
