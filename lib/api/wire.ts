/**
 * Raw wire shapes from the Klyvi Go API, verified against the Go structs
 * in the klyvi repo's internal packages, not assumed.
 *
 * Everything is snake_case. The Go structs all carry json tags, including
 * the reco feed's Scored/Candidate, which were snake_cased in the contract
 * cleanup (they used to serialize Go-default PascalCase). A reason's name
 * is omitted when the catalog cannot resolve its id.
 *
 * JSONB columns (genres, keywords, credits, seasons) arrive as TMDB's own
 * nested payloads, stored verbatim server-side.
 */

// ---------- shared TMDB JSONB fragments ----------

export type WireGenre = { id: number; name: string };
export type WireKeyword = { id: number; name: string };

export type WireCredits = {
  cast?: { id: number; name: string; character?: string; order?: number }[];
  crew?: { id: number; name: string; job?: string }[];
};

/**
 * Keywords: the live API stores the EXTRACTED array (verified against a
 * running instance), but TMDB's own wrappers ({keywords: []} for movies,
 * {results: []} for TV) are kept accepted in case older cache rows carry
 * them.
 */
export type WireKeywords =
  | WireKeyword[]
  | { keywords?: WireKeyword[]; results?: WireKeyword[] };

// ---------- catalog ----------

export type WireMovie = {
  movie_id: number;
  backdrop_path: string | null;
  genres: WireGenre[] | null;
  original_language: string | null;
  overview: string | null;
  poster_path: string | null;
  production_companies: { id: number; name: string }[] | null;
  release_date: string | null;
  runtime: number;
  status: string | null;
  tagline: string | null;
  title: string | null;
  vote_average: number;
  vote_count: number;
  keywords: WireKeywords | null;
  credits: WireCredits | null;
};

export type WireTvSeries = {
  tv_id: number;
  backdrop_path: string | null;
  created_by: { id: number; name: string }[] | null;
  first_air_date: string | null;
  last_air_date: string | null;
  genres: WireGenre[] | null;
  number_of_episodes: number;
  number_of_seasons: number;
  name: string | null;
  original_language: string | null;
  overview: string | null;
  poster_path: string | null;
  seasons:
    | {
        season_number: number;
        air_date: string | null;
        poster_path: string | null;
        episode_count: number;
        name: string | null;
        overview: string | null;
      }[]
    | null;
  status: string | null;
  tagline: string | null;
  vote_average: number;
  vote_count: number;
  keywords: WireKeywords | null;
  credits: WireCredits | null;
};

export type WireTvSeason = {
  tv_id: number;
  season_number: number;
  air_date: string | null;
  name: string | null;
  overview: string | null;
  poster_path: string | null;
  vote_average: number;
  episodes: unknown[] | null;
};

export type WireCollectionMovie = {
  collection_id: number;
  movie_id: number;
  name: string;
  poster_path: string | null;
  vote_average: number | null;
  position: number | null;
};

// ---------- tracking ----------

export type WireTrackingEntry = {
  id: number;
  user_id: string;
  media_id: number;
  media_type: "movie" | "season";
  status: string | null;
  score: number | null;
  episode_progress: number | null;
  notes: string | null;
  favorite: boolean;
  updated_at: string;
  // Display fields joined from the catalog; null when not yet cached.
  tmdb_id: number | null;
  title: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  release_year: number | null;
  season_number: number | null;
  season_name: string | null;
};

/** POST /v1/tracking/reset-scores and DELETE /v1/tracking. */
export type WireAffected = { affected: number };

// ---------- interactions ----------

export type WireInteraction = {
  id: number;
  media_id: number;
  media_type: "movie" | "season";
  kind: string;
  rating: number | null;
  source: string | null;
  created_at: string;
};

// ---------- reco feed (flat snake_case; Candidate is embedded in Scored) ----------

export type WireScored = {
  media_id: number;
  media_type: string;
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_year: number;
  vote_average: number;
  /** Debug/explainability passthrough; the frontend ignores it. */
  features?: unknown;
  score: number;
  /** name absent when the catalog can't resolve the id; Tier 0 sends []. */
  reasons: { kind: string; id: number; name?: string }[] | null;
};

// ---------- users ----------

export type WireUser = {
  id: string;
  username: string;
  /** Null until the user renames away from the auto-generated name, which
   *  is what makes their first change free. */
  username_changed_at: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  /** "YYYY-MM-DD" or null. */
  birthday: string | null;
  /** Opaque client-owned blob; `{}` for a fresh user. */
  settings: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
};

// ---------- rankings / stats / imports ----------

export type WireRanking = {
  rank: number;
  tmdb_id: number;
  media_id: number | null;
  title: string;
  year: number | null;
  poster_path: string | null;
  genres: string[] | null;
  score: number | null;
};

export type WireStats = {
  kpis: {
    total_films: number;
    total_seasons: number;
    episodes_watched: number;
    days_watched: number;
    days_planned: number;
    mean_score: number;
    score_stddev: number;
  };
  score_distribution: { band: string; titles: number; hours: number }[] | null;
  release_years: { year: number; titles: number; hours: number }[] | null;
  watch_years: { year: number; titles: number; hours: number }[] | null;
  genres:
    | { name: string; count: number; mean_score: number; hours: number }[]
    | null;
  formats: { label: string; pct: number }[] | null;
  countries: { label: string; pct: number }[] | null;
  activity: { date: string; count: number }[] | null;
};

export type WireImportJob = {
  id: string;
  source: string;
  status: string;
  total: number;
  matched: number;
  unmatched: number;
  error: string | null;
  created_at: string;
  updated_at: string;
};

export type WireBatchResult = { accepted: number; rejected: number };

/** GET /v1/users/username-available. Reason is null when available. */
export type WireUsernameAvailability = {
  username: string;
  available: boolean;
  reason: "invalid" | "reserved" | "taken" | null;
};

// ---------- onboarding ----------

export type WirePoolEntry = {
  tmdb_id: number;
  title: string;
  poster_path: string;
  release_year: number;
  dimension: string;
};

// ---------- TMDB search passthrough ----------

export type WireSearchResult = {
  id: number;
  media_type?: "movie" | "tv" | "person";
  // movie
  title?: string;
  release_date?: string;
  // tv
  name?: string;
  first_air_date?: string;
  // shared
  poster_path?: string | null;
  genre_ids?: number[];
  vote_average?: number;
  // person
  profile_path?: string | null;
  known_for_department?: string;
  known_for?: { title?: string; name?: string }[];
};

export type WireSearchResponse = {
  page: number;
  results: WireSearchResult[];
  total_pages: number;
  total_results: number;
};
