import type { Scored } from "@/lib/types";

/**
 * The picks Find next last showed, so coming back from a title's page lands
 * on the same pick. Kept in memory for this tab only.
 */
export type LastPicks = {
  userId: string | null;
  mood: string;
  count: 3 | 5 | 7;
  picks: Scored[];
  index: number;
  reserve: Scored[];
  size: number;
};

let last: LastPicks | null = null;

export function rememberPicks(p: LastPicks) {
  last = p;
}

/** The picks to show again, when this history entry is one that had them:
 *  the page's own picks step, or a page the pop-up was open over. */
export function returningPicks(userId: string | null, embedded: boolean): LastPicks | null {
  if (!last || last.userId !== userId) return null;
  const state = window.history.state;
  const here = embedded ? state?.findOpen === true : state?.findStage === "picks";
  return here ? last : null;
}

/** Marks this history entry as having the pop-up open over it, or clears
 *  the mark. Next's own state on the entry is kept. */
export function markPopUp(open: boolean) {
  if ((window.history.state?.findOpen === true) === open) return;
  const state = { ...window.history.state };
  if (open) state.findOpen = true;
  else delete state.findOpen;
  window.history.replaceState(state, "");
}
