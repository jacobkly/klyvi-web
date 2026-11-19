import { formatScore, type ScoringSystem } from "@/lib/score";
import { STATUS_VERBS, type TrackingStatus } from "@/lib/types";

type Edited = { status: TrackingStatus; score: number | null };

/**
 * The toast after a library edit names what changed: the status if it moved,
 * otherwise the score ("Score saved, 88"), otherwise just that it saved.
 */
export function editToast(
  before: { status: TrackingStatus | null; score: number | null },
  after: Edited,
  system: ScoringSystem
): string {
  if (after.status !== before.status) return STATUS_VERBS[after.status];
  if (after.score !== before.score) {
    return after.score != null
      ? `Score saved, ${formatScore(after.score, system)}`
      : "Score cleared";
  }
  return "Saved";
}
