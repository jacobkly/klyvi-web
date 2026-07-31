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

/**
 * What a poster card can point at. Tracking knows only movie | season, but
 * catalog surfaces (search, TV rails) also show series-level cards, which
 * link to /tv/{id}.
 */
export type SummaryKind = MediaType | "tv";

/** The minimum a poster card needs to render. */
export type MediaSummary = {
  /** Internal media_index id. 0 for catalog cards that never carried one. */
  mediaId: number;
  mediaType: SummaryKind;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  year: number | null;
  /** Present on seasons. */
  seasonNumber?: number;
};

/** A summary that can actually be tracked: movie or season, never series. */
export type TrackableSummary = Omit<MediaSummary, "mediaType"> & {
  mediaType: MediaType;
};

/** A tracked library entry, enriched server-side. */
export type LibraryEntry = TrackableSummary & {
  status: TrackingStatus;
  /** 0 to 100, null when unrated. */
  score: number | null;
  /** Episodes watched; null for movies. */
  progress: number | null;
  /** Total episodes; null for movies or unknown. */
  progressTotal: number | null;
  /** Private free text; null when empty. */
  notes: string | null;
  updatedAt: string;
};

/** One item from GET /v1/reco/feed, enriched server-side. Overview, runtime,
 *  and genres are NOT in the feed payload; the client hydrates them from
 *  /v1/movies/{id} for the pick being shown. */
export type Scored = MediaSummary & {
  backdropPath: string | null;
  voteAverage: number | null;
  overview: string | null;
  runtime: number | null;
  genres: string[];
  reasons: Reason[];
};

/** The authenticated user's row from GET /v1/users/me. */
export type UserProfile = {
  id: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
};

export type InteractionKind =
  | "logged"
  | "rated"
  | "dismissed"
  | "saved"
  | "impression"
  | "clicked";

export type InteractionSource = "search" | "detail" | "feed" | "onboarding";

/** One recommender signal event from GET /v1/interactions. */
export type Interaction = {
  id: number;
  mediaId: number;
  mediaType: MediaType;
  kind: InteractionKind;
  rating: number | null;
  source: string | null;
  createdAt: string;
};

/** A person from search results. Not a MediaSummary: people have no year,
 *  no tracking, and no detail page yet. */
export type PersonResult = {
  tmdbId: number;
  name: string;
  profilePath: string | null;
  knownFor: string[];
};

/** TMDB image base. Sizes per TMDB's configuration documentation. */
export function posterUrl(
  path: string | null,
  size: "w342" | "w500" = "w342"
): string | null {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}
