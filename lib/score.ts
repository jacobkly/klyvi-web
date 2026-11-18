/**
 * Settings' scoring system, for display and entry only. The API stores every
 * score as a whole number from 0 to 100, and that never changes: these
 * helpers convert at the edges.
 *
 * Each system is a whole-number scale from `min` to `max`:
 * - hundred: 0 to 100, the stored value itself
 * - ten: 1 to 10, stored as tens
 * - stars: 1 to 5, stored as twenties
 * - smiley: 1 to 3 (didn't like it, okay, liked it), stored as 35, 60 and
 *   85, the cut points AniList uses for its three-smiley system
 */

export const SCORING_SYSTEMS = ["hundred", "ten", "stars", "smiley"] as const;

export type ScoringSystem = (typeof SCORING_SYSTEMS)[number];

type Scale = { system: ScoringSystem; min: number; max: number };

export const SCORE_SCALES: Record<ScoringSystem, Scale> = {
  hundred: { system: "hundred", min: 0, max: 100 },
  ten: { system: "ten", min: 1, max: 10 },
  stars: { system: "stars", min: 1, max: 5 },
  smiley: { system: "smiley", min: 1, max: 3 },
};

/** The three smileys, lowest first. */
export const SMILEY_LABELS = [
  "Didn't like it",
  "It was okay",
  "Liked it",
] as const;

const SMILEY_STORED = [35, 60, 85] as const;

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

/** A stored 0 to 100 score in the system's own units. */
export function toScale(score: number, system: ScoringSystem): number {
  switch (system) {
    case "hundred":
      return clamp(Math.round(score), 0, 100);
    case "ten":
      return clamp(Math.round(score / 10), 1, 10);
    case "stars":
      return clamp(Math.round(score / 20), 1, 5);
    case "smiley":
      return score <= 35 ? 1 : score <= 60 ? 2 : 3;
  }
}

/** A step in the system's own units as the stored 0 to 100 score. */
export function fromScale(n: number, system: ScoringSystem): number {
  const { min, max } = SCORE_SCALES[system];
  const step = clamp(Math.round(n), min, max);
  switch (system) {
    case "hundred":
      return step;
    case "ten":
      return step * 10;
    case "stars":
      return step * 20;
    case "smiley":
      return SMILEY_STORED[step - 1];
  }
}

/**
 * A score as text, for toasts, activity lines and screen readers: "88",
 * "9/10", "4/5" or "Liked it".
 */
export function formatScore(score: number, system: ScoringSystem): string {
  const n = toScale(score, system);
  switch (system) {
    case "hundred":
      return String(n);
    case "ten":
      return `${n}/10`;
    case "stars":
      return `${n}/5`;
    case "smiley":
      return SMILEY_LABELS[n - 1];
  }
}

/** A score read aloud: "88 out of 100", "4 out of 5 stars" or "Liked it". */
export function scoreSpoken(score: number, system: ScoringSystem): string {
  const n = toScale(score, system);
  switch (system) {
    case "hundred":
      return `${n} out of 100`;
    case "ten":
      return `${n} out of 10`;
    case "stars":
      return `${n} out of 5 stars`;
    case "smiley":
      return SMILEY_LABELS[n - 1];
  }
}

/** One line under a score field saying what the scale is. */
export function scoreHint(system: ScoringSystem): string {
  switch (system) {
    case "hundred":
      return "Score is out of 100.";
    case "ten":
      return "Score is out of 10.";
    case "stars":
      return "Pick 1 to 5 stars.";
    case "smiley":
      return "Pick the face that fits.";
  }
}

/** The score field's text for a stored score, in the system's units. */
export function scoreInputText(
  score: number | null,
  system: ScoringSystem
): string {
  return score == null ? "" : String(toScale(score, system));
}

/**
 * The score field's text as a stored score. Blank is no score. Anything that
 * isn't a whole number in the system's range is an error, which the API
 * would refuse anyway once converted.
 */
export function parseScoreInput(
  raw: string,
  system: ScoringSystem
): { score: number | null; error: string | null } {
  const t = raw.trim();
  if (t === "") return { score: null, error: null };
  const { min, max } = SCORE_SCALES[system];
  const n = /^-?\d+$/.test(t) ? Number(t) : NaN;
  if (Number.isNaN(n) || n < min || n > max) {
    return {
      score: null,
      error: `Score must be a whole number from ${min} to ${max}`,
    };
  }
  return { score: fromScale(n, system), error: null };
}
