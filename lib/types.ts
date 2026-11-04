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
 * catalog surfaces (search, TV rails) and the feed also show series-level
 * cards, which link to /tv/{id}. Interactions take a series too, as feed
 * signal on the whole show.
 */
export type SummaryKind = MediaType | "tv";

/** The feed's `?media=` filter. `all` mixes films and series. */
export type FeedMedia = "all" | "movie" | "tv";

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
  /** Marked for the favorites shelf. */
  favorite: boolean;
  updatedAt: string;
  /** From the tracking list. Absent on entries the client builds itself. */
  backdropPath?: string | null;
};

/** One item from GET /v1/reco/feed, enriched server-side: a film or a whole
 *  series, never a season. The card details (overview, runtime, season
 *  count, genres) ride along in the feed, so a pick never needs a follow-up
 *  detail request. */
export type Scored = MediaSummary & {
  backdropPath: string | null;
  voteAverage: number | null;
  overview: string | null;
  /** Minutes, null for a series or when unknown. */
  runtime: number | null;
  /** Null for a film. */
  seasonCount: number | null;
  genres: string[];
  reasons: Reason[];
};

/** The authenticated user's row from GET /v1/users/me. */
export type UserProfile = {
  id: string;
  username: string;
  /** Null when the name has never been changed, so the first change is free. */
  usernameChangedAt: string | null;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  /** "YYYY-MM-DD" or null. */
  birthday: string | null;
  /** Opaque client-owned preferences blob. `{}` for a fresh user. */
  settings: Record<string, unknown>;
  /** Whether the nightly job writes season premiere notices for this user. */
  notifyPremieres: boolean;
  /** Whether the nightly job writes film release notices for this user. */
  notifyReleases: boolean;
  createdAt: string;
};

/**
 * One notice from GET /v1/notifications. Named to stay clear of the browser's
 * own `Notification`.
 */
export type AppNotification = {
  id: number;
  kind: "season_premiere" | "film_release";
  tmdbId: number;
  /** Null for a film. */
  seasonNumber: number | null;
  title: string;
  posterPath: string | null;
  /** Plain "YYYY-MM-DD". */
  eventDate: string;
  readAt: string | null;
};

export type NotificationPage = {
  notifications: AppNotification[];
  /** Every unread notice the user has, not just those on this page. */
  unreadCount: number;
  hasMore: boolean;
};

/** One row of a public Top 100 ranking (GET /v1/rankings/{movies,tv}). */
export type Ranking = {
  rank: number;
  tmdbId: number;
  /** Internal catalog id, or null when not yet cached (always null for TV). */
  mediaId: number | null;
  title: string;
  year: number | null;
  posterPath: string | null;
  genres: string[];
  /** TMDB vote average, 0..10, or null. */
  score: number | null;
};

/** One title from GET /v1/{movies,tv}/{id}/similar. `reasons` is empty for
 *  a title that came from TMDB's own list rather than keyword overlap. */
export type SimilarTitle = MediaSummary & {
  reasons: Reason[];
};

/** Aggregated profile stats (GET /v1/users/me/stats). */
export type UserStats = {
  kpis: {
    totalFilms: number;
    totalSeasons: number;
    episodesWatched: number;
    daysWatched: number;
    daysPlanned: number;
    meanScore: number;
    scoreStddev: number;
  };
  scoreDistribution: { band: string; titles: number; hours: number }[];
  releaseYears: { year: number; titles: number; hours: number }[];
  watchYears: { year: number; titles: number; hours: number }[];
  genres: { name: string; count: number; meanScore: number; hours: number }[];
  formats: { label: string; pct: number }[];
  countries: { label: string; pct: number }[];
  activity: { date: string; count: number }[];
};

export type ImportStatus = "pending" | "running" | "done" | "failed";

/** A row the import could not match to a catalog film, for manual rating. */
export type UnmatchedTitle = { title: string; year: number };

/** An async import job (POST /v1/imports, GET /v1/imports/{id}). */
export type ImportJob = {
  id: string;
  source: string;
  status: ImportStatus;
  total: number;
  matched: number;
  unmatched: number;
  /** The unmatched rows themselves (capped at 200 server-side), so the user
   *  can find and rate them by hand. `unmatched` stays the exact count. */
  unmatchedTitles: UnmatchedTitle[];
  error: string | null;
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
  mediaType: SummaryKind;
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
