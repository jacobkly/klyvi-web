import type { LibraryEntry, MediaType, TrackingStatus } from "./types";

/** The library's client-side slice controls (06-copy.md §3 option labels). */
export type LibraryFilters = {
  status: TrackingStatus | "all";
  type: MediaType | "all";
  query: string;
};

export type LibrarySortKey = "title" | "score" | "added" | "year" | "progress" | "updated";
export type SortOrder = "asc" | "desc";

export function filterLibrary(
  entries: LibraryEntry[],
  filters: LibraryFilters
): LibraryEntry[] {
  const q = filters.query.trim().toLowerCase();
  return entries.filter((e) => {
    if (filters.status !== "all" && e.status !== filters.status) return false;
    if (filters.type !== "all" && e.mediaType !== filters.type) return false;
    if (q && !e.title.toLowerCase().includes(q)) return false;
    return true;
  });
}

/** Null scores and years always sort last regardless of order. */
export function sortLibrary(
  entries: LibraryEntry[],
  key: LibrarySortKey,
  order: SortOrder
): LibraryEntry[] {
  const dir = order === "asc" ? 1 : -1;
  return [...entries].sort((a, b) => {
    switch (key) {
      case "title":
        return dir * a.title.localeCompare(b.title);
      case "score": {
        if (a.score == null && b.score == null) return 0;
        if (a.score == null) return 1;
        if (b.score == null) return -1;
        return dir * (a.score - b.score);
      }
      case "year": {
        if (a.year == null && b.year == null) return 0;
        if (a.year == null) return 1;
        if (b.year == null) return -1;
        return dir * (a.year - b.year);
      }
      case "progress": {
        const pa = a.progress ?? -1;
        const pb = b.progress ?? -1;
        return dir * (pa - pb);
      }
      case "added":
      case "updated":
        return dir * a.updatedAt.localeCompare(b.updatedAt);
    }
  });
}

/**
 * The library's sort before you pick one, from Settings' default list order.
 * Titles read A to Z, everything else best or newest first.
 */
/** Each sort's natural direction: titles A to Z, everything else high to
 *  low (best score, newest, most progress first). */
export function defaultOrder(key: LibrarySortKey): SortOrder {
  return key === "title" ? "asc" : "desc";
}

export function startingSort(
  listOrder: "updated" | "title" | "score" | "added"
): { key: LibrarySortKey; order: SortOrder } {
  return { key: listOrder, order: defaultOrder(listOrder) };
}

/**
 * Recent activity on home and the profile: the newest updates first, minus
 * the statuses switched off under Settings, List activity creation. A status
 * with no setting yet counts as on.
 */
export function recentActivity(
  entries: LibraryEntry[],
  feed: Partial<Record<TrackingStatus, boolean>>,
  limit: number
): LibraryEntry[] {
  return entries
    .filter((e) => feed[e.status] !== false)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit);
}

/**
 * Surprise me's pick: something you meant to watch, so Planning first, then
 * Watching. Never a title you've finished or dropped. Null with neither.
 */
export function pickSurprise(
  entries: LibraryEntry[],
  random: () => number = Math.random
): LibraryEntry | null {
  const planned = entries.filter((e) => e.status === "planning");
  const pool = planned.length
    ? planned
    : entries.filter((e) => e.status === "watching");
  if (pool.length === 0) return null;
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}
