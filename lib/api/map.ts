/**
 * Wire → UI mappers. Every shape components consume comes out of here in
 * camelCase; every casing quirk of the API stays behind this file.
 */

import type {
  CastMember,
  MovieDetail,
  SeasonInfo,
  TvDetail,
} from "@/lib/mock-media";
import type { PoolEntry } from "@/lib/mock-onboarding";
import type {
  Interaction,
  InteractionKind,
  LibraryEntry,
  MediaSummary,
  PersonResult,
  Reason,
  Scored,
  TrackingStatus,
  UserProfile,
} from "@/lib/types";
import type {
  WireInteraction,
  WireMovie,
  WirePoolEntry,
  WireScored,
  WireSearchResponse,
  WireTrackingEntry,
  WireTvSeason,
  WireTvSeries,
  WireUser,
} from "./wire";

// ---------- helpers ----------

/** TMDB stores paths as "" or null when absent; both mean "no artwork". */
function orNull(s: string | null | undefined): string | null {
  return s ? s : null;
}

function yearOf(date: string | null | undefined): number | null {
  if (!date) return null;
  const y = Number(date.slice(0, 4));
  return Number.isFinite(y) && y > 0 ? y : null;
}

const languageNames =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["en"], { type: "language" })
    : null;

function languageLabel(code: string | null | undefined): string {
  if (!code) return "Unknown";
  try {
    return languageNames?.of(code) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

function keywordList(
  kw: WireMovie["keywords"] | null | undefined
): { id: number; name: string }[] {
  if (!kw) return [];
  if (Array.isArray(kw)) return kw;
  return kw.keywords ?? kw.results ?? [];
}

function topCast(credits: WireMovie["credits"], limit = 12): CastMember[] {
  const cast = credits?.cast ?? [];
  return [...cast]
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
    .slice(0, limit)
    .map((c) => ({ id: c.id, name: c.name }));
}

// ---------- tracking ----------

export function mapTrackingEntry(w: WireTrackingEntry): LibraryEntry {
  return {
    mediaId: w.media_id,
    mediaType: w.media_type,
    tmdbId: w.tmdb_id ?? 0,
    title: w.title ?? "Untitled",
    posterPath: orNull(w.poster_path),
    year: w.release_year,
    seasonNumber: w.season_number ?? undefined,
    status: (w.status ?? "planning") as TrackingStatus,
    score: w.score,
    progress: w.episode_progress,
    // The list payload does not carry episode totals; the season detail
    // call does. Progress renders bare until then.
    progressTotal: null,
    notes: w.notes,
    updatedAt: w.updated_at,
  };
}

// ---------- reco feed ----------

export function mapScored(w: WireScored): Scored {
  return {
    mediaId: w.MediaID,
    mediaType: w.MediaType === "season" ? "season" : "movie",
    tmdbId: w.TMDBID,
    title: w.Title,
    posterPath: orNull(w.PosterPath),
    backdropPath: orNull(w.BackdropPath),
    year: w.ReleaseYear > 0 ? w.ReleaseYear : null,
    voteAverage: w.VoteAverage > 0 ? w.VoteAverage : null,
    // Hydrated from /v1/movies/{id} for the pick being shown.
    overview: null,
    runtime: null,
    genres: [],
    reasons: (w.Reasons ?? []).map(
      (r): Reason => ({
        kind: r.kind === "genre" ? "genre" : "keyword",
        id: r.id,
        name: r.name,
      })
    ),
  };
}

// ---------- catalog ----------

export function mapMovie(w: WireMovie): MovieDetail {
  const director =
    w.credits?.crew?.find((c) => c.job === "Director")?.name ?? null;
  return {
    tmdbId: w.movie_id,
    title: w.title ?? "Untitled",
    year: yearOf(w.release_date),
    posterPath: orNull(w.poster_path),
    backdropPath: orNull(w.backdrop_path),
    tagline: orNull(w.tagline),
    overview: orNull(w.overview),
    runtime: w.runtime > 0 ? w.runtime : null,
    releaseDate: w.release_date,
    status: w.status ?? "Unknown",
    language: languageLabel(w.original_language),
    studio: w.production_companies?.[0]?.name ?? null,
    voteAverage: w.vote_average > 0 ? w.vote_average : null,
    genres: (w.genres ?? []).map((g) => g.name),
    keywords: keywordList(w.keywords),
    cast: topCast(w.credits),
    director,
  };
}

export function mapTvSeries(w: WireTvSeries): TvDetail {
  const seasons: SeasonInfo[] = (w.seasons ?? [])
    // Season 0 is TMDB's specials bucket, not a trackable season.
    .filter((s) => s.season_number >= 1)
    .map((s) => ({
      seasonNumber: s.season_number,
      year: yearOf(s.air_date),
      posterPath: orNull(s.poster_path) ?? orNull(w.poster_path),
      episodeCount: s.episode_count,
    }));
  return {
    tmdbId: w.tv_id,
    title: w.name ?? "Untitled",
    year: yearOf(w.first_air_date),
    posterPath: orNull(w.poster_path),
    backdropPath: orNull(w.backdrop_path),
    tagline: orNull(w.tagline),
    overview: orNull(w.overview),
    releaseDate: w.first_air_date,
    status: w.status ?? "Unknown",
    language: languageLabel(w.original_language),
    studio: null,
    voteAverage: w.vote_average > 0 ? w.vote_average : null,
    genres: (w.genres ?? []).map((g) => g.name),
    keywords: keywordList(w.keywords),
    cast: topCast(w.credits),
    seasons,
    // Not stored by the catalog; the metadata list skips nulls.
    episodeRuntime: null,
    firstAirDate: w.first_air_date,
    lastAirDate: w.last_air_date,
    creator: w.created_by?.length
      ? w.created_by.map((c) => c.name).join(", ")
      : null,
  };
}

/** Season detail payload from GET /v1/tv/{id}?season_num=N. */
export type SeasonDetail = {
  seasonNumber: number;
  name: string | null;
  overview: string | null;
  posterPath: string | null;
  year: number | null;
  episodeCount: number | null;
  voteAverage: number | null;
};

export function mapTvSeason(w: WireTvSeason): SeasonDetail {
  return {
    seasonNumber: w.season_number,
    name: orNull(w.name),
    overview: orNull(w.overview),
    posterPath: orNull(w.poster_path),
    year: yearOf(w.air_date),
    episodeCount: w.episodes?.length ?? null,
    voteAverage: w.vote_average > 0 ? w.vote_average : null,
  };
}

// ---------- users / interactions / onboarding ----------

export function mapUser(w: WireUser): UserProfile {
  return {
    id: w.id,
    username: w.username,
    bio: orNull(w.bio),
    avatarUrl: orNull(w.avatar_url),
    createdAt: w.created_at,
  };
}

export function mapInteraction(w: WireInteraction): Interaction {
  return {
    id: w.id,
    mediaId: w.media_id,
    mediaType: w.media_type,
    kind: w.kind as InteractionKind,
    rating: w.rating,
    source: w.source,
    createdAt: w.created_at,
  };
}

export function mapPoolEntry(w: WirePoolEntry): PoolEntry {
  return {
    tmdbId: w.tmdb_id,
    title: w.title,
    posterPath: orNull(w.poster_path),
    releaseYear: w.release_year,
    dimension: w.dimension,
  };
}

// ---------- search ----------

/** A search/list card plus what Explore's client-side filters need. */
export type SearchMedia = MediaSummary & {
  genreIds: number[];
  voteAverage: number | null;
};

export type SearchResults = {
  movies: SearchMedia[];
  tv: SearchMedia[];
  people: PersonResult[];
};

/**
 * Splits a TMDB search passthrough into typed buckets. For typed searches
 * (type=movie|tv|person) results carry no media_type field, so the caller
 * passes the type it asked for.
 */
export function mapSearchResults(
  w: WireSearchResponse,
  typed?: "movie" | "tv" | "person"
): SearchResults {
  const out: SearchResults = { movies: [], tv: [], people: [] };
  for (const r of w.results ?? []) {
    const kind = r.media_type ?? typed ?? "movie";
    if (kind === "movie") {
      out.movies.push({
        mediaId: 0,
        mediaType: "movie",
        tmdbId: r.id,
        title: r.title ?? "Untitled",
        posterPath: orNull(r.poster_path),
        year: yearOf(r.release_date),
        genreIds: r.genre_ids ?? [],
        voteAverage: r.vote_average && r.vote_average > 0 ? r.vote_average : null,
      });
    } else if (kind === "tv") {
      out.tv.push({
        mediaId: 0,
        mediaType: "tv",
        tmdbId: r.id,
        title: r.name ?? "Untitled",
        posterPath: orNull(r.poster_path),
        year: yearOf(r.first_air_date),
        genreIds: r.genre_ids ?? [],
        voteAverage: r.vote_average && r.vote_average > 0 ? r.vote_average : null,
      });
    } else {
      out.people.push({
        tmdbId: r.id,
        name: r.name ?? "Unknown",
        profilePath: orNull(r.profile_path),
        knownFor: (r.known_for ?? [])
          .map((k) => k.title ?? k.name ?? "")
          .filter(Boolean),
      });
    }
  }
  return out;
}
