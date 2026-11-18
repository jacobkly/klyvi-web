import type { LibraryEntry } from "@/lib/types";

/** How many titles the profile needs before it shows stats. The Stats tab
 *  and Overview share it, so they never disagree about having enough. */
export const STATS_MIN_TITLES = 10;

/** Titles that count toward stats: the ones you rated, and the ones you
 *  finished. Onboarding answers land as Completed with no score, so they
 *  count too. */
export function statsTitleCount(entries: LibraryEntry[]): number {
  return entries.filter((e) => e.score != null || e.status === "completed")
    .length;
}

/** Whether stats are open yet, and how many titles are left if not. */
export function statsProgress(entries: LibraryEntry[]): {
  unlocked: boolean;
  remaining: number;
} {
  const remaining = Math.max(0, STATS_MIN_TITLES - statsTitleCount(entries));
  return { unlocked: remaining === 0, remaining };
}

/** "Rate or finish 2 more titles", "Rate or finish 1 more title". */
export function statsRemainingText(remaining: number): string {
  return `Rate or finish ${remaining} more ${remaining === 1 ? "title" : "titles"}`;
}
