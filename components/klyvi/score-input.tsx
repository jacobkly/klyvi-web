"use client";

import { Frown, Meh, Smile, Star } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { usePref } from "@/lib/local-prefs";
import { SCORE_SCALES, SMILEY_LABELS, fromScale, scoreSpoken } from "@/lib/score";
import { cn } from "@/lib/utils";

const FACES = [Frown, Meh, Smile] as const;

/**
 * The one score control, used by the rating dialog and the library editor.
 * Its value is the text in the scoring system's own units ("" for no score),
 * which `parseScoreInput` turns into the stored 0 to 100 score.
 *
 * - 100 and 10 points: a slider labelled "Score" with a number field beside
 *   it, so a score can be dragged or typed
 * - stars and smileys: a row of toggle buttons, and pressing the picked one
 *   again clears it
 */
export function ScoreInput({
  id,
  value,
  onChange,
  label = "Score",
  invalid = false,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const [system] = usePref("scoringSystem");
  const { min, max } = SCORE_SCALES[system];
  const labelId = `${id}-label`;
  const typed = /^\d+$/.test(value.trim()) ? Number(value.trim()) : null;
  const inRange = typed != null && typed >= min && typed <= max ? typed : null;

  if (system === "stars" || system === "smiley") {
    const steps = Array.from({ length: max }, (_, i) => i + 1);
    return (
      <div className="flex flex-col gap-1.5">
        <Label id={labelId}>{label}</Label>
        <div
          role="group"
          aria-labelledby={labelId}
          aria-describedby={describedBy}
          className="flex items-center gap-1"
        >
          {steps.map((step) => {
            const picked = inRange === step
            const lit = inRange != null && step <= inRange && system === "stars";
            const Face = system === "smiley" ? FACES[step - 1] : null;
            const name =
              system === "smiley"
                ? SMILEY_LABELS[step - 1]
                : `${step} ${step === 1 ? "star" : "stars"}`;
            return (
              <button
                key={step}
                type="button"
                aria-label={name}
                aria-pressed={picked}
                onClick={() => onChange(picked ? "" : String(step))}
                className={cn(
                  "hit-44 relative inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-hidden",
                  (picked || lit) && "text-violet-text hover:text-violet-text",
                  picked && system === "smiley" && "bg-muted"
                )}
              >
                {Face ? (
                  <Face className="size-6" strokeWidth={2} />
                ) : (
                  <Star
                    className={cn("size-6", lit && "fill-current")}
                    strokeWidth={2}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label id={labelId} htmlFor={id}>
        {label}
      </Label>
      <div className="flex items-center gap-3">
        <Slider
          value={[inRange ?? min]}
          onValueChange={(v) =>
            onChange(String(Array.isArray(v) ? (v[0] ?? min) : (v as number)))
          }
          min={min}
          max={max}
          step={1}
          aria-labelledby={labelId}
          thumbProps={{
            getAriaValueText: (_formatted, n) => scoreSpoken(fromScale(n, system), system),
          }}
          className={cn("flex-1", inRange == null && "opacity-60")}
        />
        <Input
          id={id}
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={describedBy}
          className="w-16 shrink-0 text-center font-mono"
        />
      </div>
    </div>
  );
}
