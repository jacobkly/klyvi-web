/**
 * Shapes shared across the UI, matching the Klyvi API contract in
 * klyvi/docs/API.md. Field names are normalised to camelCase at the fetch
 * layer; these are the shapes components consume.
 */

export type MediaType = "movie" | "season";

export type TrackingStatus =
  | "watching"
  | "planning"
  | "completed"
  | "rewatching"
  | "paused"
  | "dropped";

/** Labels from docs/planning/06-copy.md §3. */
export const STATUS_LABELS: Record<TrackingStatus, string> = {
  watching: "Watching",
  planning: "Planning",
  completed: "Completed",
  rewatching: "Rewatching",
  paused: "Paused",
  dropped: "Dropped",
};

/** Past-tense verb forms for toasts and activity lines. */
export const STATUS_VERBS: Record<TrackingStatus, string> = {
  watching: "Started watching",
  planning: "Added to your watchlist",
  completed: "Marked as completed",
  rewatching: "Started rewatching",
  paused: "Paused",
  dropped: "Dropped",
};

/** The reco feed's structured explainability token. `name` can be absent. */
export type Reason = {
  kind: "keyword" | "genre";
  id: number;
  name?: string;
};

/** The minimum a poster card needs to render. */
export type MediaSummary = {
  mediaId: number;
  mediaType: MediaType;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  year: number | null;
  /** Present on seasons. */
  seasonNumber?: number;
};

/** A tracked library entry, enriched server-side. */
export type LibraryEntry = MediaSummary & {
  status: TrackingStatus;
  /** 0 to 100, null when unrated. */
  score: number | null;
  /** Episodes watched; null for movies. */
  progress: number | null;
  /** Total episodes; null for movies or unknown. */
  progressTotal: number | null;
  updatedAt: string;
};

/** TMDB image base. Sizes per TMDB's configuration documentation. */
export function posterUrl(
  path: string | null,
  size: "w342" | "w500" = "w342"
): string | null {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}
