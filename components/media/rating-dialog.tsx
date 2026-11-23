"use client";

import Image from "next/image";
import * as React from "react";

import { ScoreInput } from "@/components/klyvi/score-input";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { usePref } from "@/lib/local-prefs";
import { parseScoreInput, scoreInputText } from "@/lib/score";
import { tmdbImage } from "@/lib/tmdb-image";

/**
 * The quick rating step behind "Seen it": a watched-but-unrated title is the
 * weakest signal the recommender can get, and this is the one moment the
 * user is already thinking about the film. The one score control (in the
 * scoring system from Settings), one save, and an explicit no-rating exit so
 * the fact still gets logged.
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
  const [scoringSystem] = usePref("scoringSystem");
  const [score, setScore] = React.useState(() =>
    scoreInputText(75, scoringSystem)
  );
  const parsed = parseScoreInput(score, scoringSystem);
  const poster = tmdbImage(posterPath);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-sm"
      footer={
        <div className="flex flex-col gap-2">
          <Button
            size="touch"
            className="w-full"
            disabled={parsed.score == null}
            onClick={() => onSubmit(parsed.score)}
          >
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
        </div>
      }
    >
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
            <ScoreInput
              id="rating-score"
              value={score}
              onChange={setScore}
              invalid={parsed.error != null}
            />
          </div>
        </div>
    </ResponsiveDialog>
  );
}
