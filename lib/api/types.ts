/**
 * Types mirror the Klyvi Go API schema in `klyvi/docs/openapi.yaml`.
 * Only what the frontend actually consumes — keep narrow on purpose.
 */

// ---------- Common ----------

export interface SuccessEnvelope<T> {
  version: string;
  stats: { duration_ms: number };
  data: T;
}

export interface ErrorEnvelope {
  error: string;
}

export type MediaType = 'movie' | 'tv' | 'season' | 'person';

export type TrackingStatus =
  | 'watching'
  | 'planning'
  | 'completed'
  | 'rewatching'
  | 'paused'
  | 'dropped';

export type InteractionKind =
  | 'logged'
  | 'rated'
  | 'dismissed'
  | 'saved'
  | 'impression'
  | 'clicked';

export type InteractionSource = 'search' | 'detail' | 'feed' | 'onboarding';

export interface TMDBNameRef {
  id: number;
  name: string;
}

// ---------- Catalog: Movie ----------

export interface ApiMovieCastMember {
  id: number;
  name: string;
  character: string;
  profile_path?: string | null;
  order: number;
}

export interface ApiMovieCredits {
  cast?: ApiMovieCastMember[];
  crew?: Array<{ id: number; name: string; job: string }>;
}

export interface ApiMovie {
  movie_id: number;
  adult: boolean;
  backdrop_path: string | null;
  belongs_to_collection: { id: number; name: string; poster_path?: string | null } | null;
  budget: number;
  genres: TMDBNameRef[] | null;
  homepage: string | null;
  imdb_id: string | null;
  original_language: string | null;
  original_title: string | null;
  overview: string | null;
  popularity: number;
  poster_path: string | null;
  release_date: string | null;
  revenue: number;
  runtime: number;
  status: string | null;
  tagline: string | null;
  title: string | null;
  vote_average: number;
  vote_count: number;
  keywords: TMDBNameRef[] | null;
  credits: ApiMovieCredits | null;
  created_at: string;
  updated_at: string;
}

// `/v1/movies/?type=...` returns a TMDB-shaped list passthrough. We type it
// loosely because we only render a poster row.
export interface TmdbListItem {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  overview?: string;
  vote_average?: number;
  vote_count?: number;
  media_type?: 'movie' | 'tv' | 'person';
}

export interface TmdbListResponse {
  page?: number;
  results: TmdbListItem[];
  total_pages?: number;
  total_results?: number;
}

// ---------- Catalog: TV ----------

export interface ApiTVSeriesSeasonRef {
  id?: number;
  season_number: number;
  name?: string;
  episode_count?: number;
  air_date?: string | null;
  poster_path?: string | null;
  overview?: string;
}

export interface ApiTVSeries {
  tv_id: number;
  adult: boolean;
  backdrop_path: string | null;
  first_air_date: string | null;
  last_air_date: string | null;
  genres: TMDBNameRef[] | null;
  homepage: string | null;
  in_production: boolean;
  number_of_episodes: number;
  number_of_seasons: number;
  original_language: string | null;
  original_name: string | null;
  overview: string | null;
  popularity: number;
  poster_path: string | null;
  seasons: ApiTVSeriesSeasonRef[] | null;
  status: string | null;
  tagline: string | null;
  type: string | null;
  vote_average: number;
  vote_count: number;
  keywords: TMDBNameRef[] | null;
  credits: ApiMovieCredits | null;
  // Convenience: not in the schema, but TMDB tends to embed a `name`. We
  // tolerate it at runtime via the API.
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiTVEpisode {
  id: number;
  episode_number: number;
  name?: string;
  overview?: string;
  air_date?: string | null;
  runtime?: number;
  still_path?: string | null;
  vote_average?: number;
  vote_count?: number;
}

export interface ApiTVSeason {
  tv_id: number;
  season_number: number;
  air_date: string | null;
  name: string | null;
  overview: string | null;
  poster_path: string | null;
  vote_average: number;
  vote_count: number;
  episodes: ApiTVEpisode[] | null;
  networks: Array<Record<string, unknown>> | null;
  created_at: string;
  updated_at: string;
}

// ---------- Users ----------

export interface ApiUser {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  favorite_media: Array<Record<string, unknown>> | null;
  favorite_people: Array<Record<string, unknown>> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileRequest {
  username?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
}

// ---------- Tracking ----------

export interface ApiTrackingEntry {
  id: number;
  user_id: string;
  media_id: number;
  media_type: 'movie' | 'season';
  status: TrackingStatus;
  score: number | null;
  episode_progress: number | null;
  start_date: string | null;
  finish_date: string | null;
  total_rewatches: number;
  notes: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddTrackingRequest {
  tmdb_id: number;
  media_type: 'movie' | 'season';
  season_number?: number | null;
  status: TrackingStatus;
  score?: number | null;
  episode_progress?: number | null;
  notes?: string | null;
}

export interface UpdateTrackingRequest {
  status?: TrackingStatus;
  score?: number | null;
  episode_progress?: number | null;
  notes?: string | null;
}

// ---------- Interactions ----------

export interface ApiInteraction {
  id: number;
  user_id: string;
  media_id: number;
  media_type: 'movie' | 'season';
  kind: InteractionKind;
  rating: number | null;
  source: InteractionSource | null;
  created_at: string;
}

export interface RecordInteractionRequest {
  tmdb_id: number;
  media_type: 'movie' | 'season';
  season_number?: number | null;
  kind: InteractionKind;
  rating?: number | null;
  source?: InteractionSource;
}

// ---------- Recommendations ----------

export interface MediaFeatures {
  MediaID: number;
  MediaType: 'movie' | 'season';
  GenreIDs: number[];
  KeywordIDs: number[];
  Year: number;
  VoteAverage: number;
  VoteCount: number;
}

/**
 * Structured explainability token attached to a feed item. `name` is the
 * server-resolved human label, omitted when the catalog can't resolve the id.
 */
export interface Reason {
  kind: 'keyword' | 'genre';
  id: number;
  name?: string;
}

/**
 * One ranked entry from `/v1/reco/feed`. Backend inlines display fields so
 * the frontend never needs a follow-up lookup per item.
 * Empty strings for `Title` / `PosterPath` / `BackdropPath` when the catalog
 * doesn't have them (rare); `ReleaseYear` is 0 in that case.
 *
 * `Reasons` is `null` for Tier 0 (cold-start) items — frontend should treat
 * `null | []` the same.
 */
export interface Scored {
  MediaID: number;
  MediaType: 'movie' | 'season';
  TMDBID: number;
  Title: string;
  PosterPath: string;
  BackdropPath: string;
  ReleaseYear: number;
  VoteAverage: number;
  Features: MediaFeatures;
  Score: number;
  Reasons: Reason[] | null;
}

// ---------- Onboarding ----------

export interface EnrichedPoolEntry {
  tmdb_id: number;
  title: string;
  poster_path: string;
  release_year: number;
  dimension: string;
}
