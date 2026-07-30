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
