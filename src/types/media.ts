// Types aligned with the eventual Klyvi Go API response shape.
// See klyvi/docs/API.md.

export type WatchStatus =
  | 'planning'
  | 'watching'
  | 'completed'
  | 'paused'
  | 'dropped'
  | 'rewatching';

export type MediaType = 'movie' | 'tv' | 'season' | 'person';

export interface Genre {
  id: number;
  name: string;
}

export interface Keyword {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path?: string;
  order: number;
}

export interface Episode {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  air_date?: string;
  runtime: number;
  still_path?: string;
  vote_average?: number;
  watched?: boolean;
}

export interface Movie {
  id: number;
  title: string;
  original_title?: string;
  release_year: number;
  release_date?: string;
  runtime: number;
  rating: string;             // e.g. "R", "PG-13"
  vote_average: number;       // 0-10
  vote_count: number;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  genres: Genre[];
  keywords: Keyword[];
  cast: CastMember[];
  similar?: Movie[];
  // Beta-only fields (placeholder state)
  status?: WatchStatus;
  userRating?: number;        // 1-5
  loggedAt?: string;
}

export interface Season {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  poster_path: string;
  backdrop_path?: string;
  air_date?: string;
  episode_count: number;
  avg_runtime: number;
  episodes: Episode[];
  series_id: number;
  series_name: string;
  cast: CastMember[];
  status?: WatchStatus;
  userRating?: number;
}

export interface Series {
  id: number;
  name: string;
  release_year: number;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  rating: string;
  vote_average: number;
  vote_count: number;
  genres: Genre[];
  keywords: Keyword[];
  cast: CastMember[];
  seasons: Pick<Season, 'id' | 'season_number' | 'name' | 'episode_count' | 'air_date' | 'poster_path'>[];
}

export type MediaCard =
  | (Pick<Movie, 'id' | 'title' | 'release_year' | 'poster_path' | 'vote_average' | 'overview'> & {
      type: 'movie';
      status?: WatchStatus;
      userRating?: number;
    })
  | (Pick<Series, 'id' | 'name' | 'release_year' | 'poster_path' | 'vote_average' | 'overview'> & {
      type: 'tv';
      status?: WatchStatus;
      userRating?: number;
    });

export interface OnboardingTitle {
  id: number;
  title: string;
  year: number;
  poster_path: string;
  type: MediaType;
}

export interface RecommendationReason {
  headline: string;
  basedOn: { id: number; title: string };
  matchedKeywords: string[];
  matchStrength: number; // 0-100
}
