"use client";

import { Frown, Meh, Smile, Star } from "lucide-react";

import { usePref } from "@/lib/local-prefs";
import { scoreSpoken, toScale } from "@/lib/score";
import { cn } from "@/lib/utils";

const FACES = [Frown, Meh, Smile] as const;

/**
 * A stored 0 to 100 score in the scoring system from Settings, compact
 * enough for a poster chip or a list column. Numbers stay numbers, stars get
 * a star, smileys are a face. Screen readers get the spoken form instead.
 *
 * `mine` marks it as the user's own score: a star leads the number in the
 * numeric systems too, so it is never mistaken for a count, and the spoken
 * form starts "Your score".
 */
export function ScoreValue({
  score,
  mine = false,
  className,
}: {
  score: number;
  mine?: boolean;
  className?: string;
}) {
  const [system] = usePref("scoringSystem");
  const n = toScale(score, system);
  const spoken = scoreSpoken(score, system);
  const Face = system === "smiley" ? FACES[n - 1] : null;
  const star = system === "stars" || (mine && system !== "smiley");

  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      <span aria-hidden="true" className="inline-flex items-center gap-0.5">
        {Face ? (
          <Face className="size-[1.2em]" strokeWidth={2} />
        ) : (
          <>
            {star ? (
              <Star className="size-[0.9em] fill-current" strokeWidth={2} />
            ) : null}
            <span data-numeric>{n}</span>
          </>
        )}
      </span>
      <span className="sr-only">{mine ? `Your score ${spoken}` : spoken}</span>
    </span>
  );
}
