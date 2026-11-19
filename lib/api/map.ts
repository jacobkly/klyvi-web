/**
 * Wire → UI mappers. Every shape components consume comes out of here in
 * camelCase; every casing quirk of the API stays behind this file.
 */

import type {
  CastMember,
  CrewGroup,
  EpisodeRef,
  MovieDetail,
  SeasonInfo,
  TvDetail,
} from "@/lib/mock-media";
import type { PoolEntry } from "@/lib/mock-onboarding";
import { trailerKey } from "@/lib/trailer";
import type {
  AppNotification,
  Episode,
  ImportJob,
  ImportStatus,
  Interaction,
  InteractionKind,
  LibraryEntry,
  MediaSummary,
  NotificationPage,
  PersonResult,
  Ranking,
  Reason,
  Scored,
  SimilarTitle,
  TrackingStatus,
  UserProfile,
  UserStats,
  WatchProvider,
  WatchProviders,
} from "@/lib/types";
import type {
  WireEpisodeRef,
  WireImportJob,
  WireInteraction,
  WireMovie,
  WireNotification,
  WireNotificationPage,
  WirePoolEntry,
  WireRanking,
  WireScored,
  WireSearchResponse,
  WireSimilar,
  WireWatchProvider,
  WireWatchProviders,
  WireStats,
  WireTrackingEntry,
  WireEpisode,
  WireTvSeason,
  WireTvSeries,
  WireUser,
} from "./wire";

// ---------- helpers ----------

/** TMDB stores paths as "" or null when absent; both mean "no artwork". */
function orNull(s: string | null | undefined): string | null {
  return s ? s : null;
}

/** The feed and the similar shelves share one explainability token. */
function mapReasons(
  reasons: { kind: string; id: number; name?: string }[] | null
): Reason[] {
  return (reasons ?? []).map((r) => ({
    kind: reasonKind(r.kind),
    id: r.id,
    name: r.name,
  }));
}

/** An unknown kind reads as a keyword, the most common token. */
function reasonKind(kind: string): Reason["kind"] {
  return kind === "because" || kind === "genre" ? kind : "keyword";
}

export function yearOf(date: string | null | undefined): number | null {
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

function topCast(credits: WireMovie["credits"], limit = 30): CastMember[] {
  const cast = credits?.cast ?? [];
  return [...cast]
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
    .slice(0, limit)
    .map((c) => ({ id: c.id, name: c.name }));
}

// The crew roles Klyvi surfaces, in display order. TMDB job strings on the
// left map to the human role label; several jobs can feed one label (a film
// with a Screenplay and a Story credit both read as Writers).
const CREW_ROLES: { role: string; jobs: string[] }[] = [
  { role: "Director", jobs: ["Director"] },
  { role: "Writers", jobs: ["Screenplay", "Writer", "Story", "Author", "Novel"] },
  { role: "Producers", jobs: ["Producer"] },
  { role: "Cinematography", jobs: ["Director of Photography"] },
  { role: "Editing", jobs: ["Editor"] },
  { role: "Music", jobs: ["Original Music Composer", "Music"] },
  { role: "Production Design", jobs: ["Production Design"] },
];

/** Each name once, in credit order, for the given jobs. */
function crewNames(credits: WireMovie["credits"], jobs: string[]): string[] {
  const names: string[] = [];
  for (const c of credits?.crew ?? []) {
    if (c.job && c.name && jobs.includes(c.job) && !names.includes(c.name)) {
      names.push(c.name);
    }
  }
  return names;
}

function names(list: { name?: string | null }[] | null | undefined): string[] {
  return (list ?? []).map((x) => x.name ?? "").filter((n) => n !== "");
}

function spokenNames(list: WireMovie["spoken_languages"]): string[] {
  return (list ?? [])
    .map((l) => l.english_name || l.name || "")
    .filter((n) => n !== "");
}

function episodeRef(w: WireEpisodeRef | null | undefined): EpisodeRef | null {
  if (!w || !w.season_number || !w.episode_number) return null;
  return {
    season: w.season_number,
    episode: w.episode_number,
    airDate: orNull(w.air_date),
  };
}

/** TMDB stores an unknown budget or revenue as 0. */
function money(n: number | undefined): number | null {
  return n != null && n > 0 ? n : null;
}

function groupCrew(credits: WireMovie["credits"], perRole = 6): CrewGroup[] {
  const crew = credits?.crew ?? [];
  const out: CrewGroup[] = [];
  for (const { role, jobs } of CREW_ROLES) {
    const names: string[] = [];
    for (const c of crew) {
      if (!c.job || !c.name || !jobs.includes(c.job)) continue;
      if (!names.includes(c.name)) names.push(c.name);
      if (names.length >= perRole) break;
    }
    if (names.length > 0) out.push({ role, names });
  }
  return out;
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
    // Null for movies and for a season not cached yet, where progress
    // renders bare.
    progressTotal: w.episode_count ?? null,
    notes: w.notes,
    favorite: w.favorite ?? false,
    updatedAt: w.updated_at,
    backdropPath: orNull(w.backdrop_path),
  };
}

// ---------- reco feed ----------

export function mapScored(w: WireScored): Scored {
  return {
    mediaId: w.media_id,
    mediaType: w.media_type === "tv" ? "tv" : "movie",
    tmdbId: w.tmdb_id,
    title: w.title,
    posterPath: orNull(w.poster_path),
    backdropPath: orNull(w.backdrop_path),
    year: w.release_year > 0 ? w.release_year : null,
    voteAverage: w.vote_average > 0 ? w.vote_average : null,
    overview: orNull(w.overview),
    runtime: w.runtime > 0 ? w.runtime : null,
    seasonCount: w.season_count && w.season_count > 0 ? w.season_count : null,
    genres: w.genres ?? [],
    reasons: mapReasons(w.reasons),
  };
}

// ---------- similar titles ----------

function mapProviderList(w: WireWatchProvider[] | null | undefined): WatchProvider[] {
  return (w ?? []).map((p) => ({
    id: p.provider_id,
    name: p.provider_name,
    logoPath: p.logo_path ?? null,
  }));
}

/** The API passes on only TMDB's own watch page. Checked again here, since
 *  the link becomes an href. */
const TMDB_WATCH_PAGE = "https://www.themoviedb.org/";

export function mapWatchProviders(w: WireWatchProviders): WatchProviders {
  return {
    region: w.region,
    regions: w.regions ?? [],
    link: w.link && w.link.startsWith(TMDB_WATCH_PAGE) ? w.link : null,
    stream: mapProviderList(w.stream),
    free: mapProviderList(w.free),
    ads: mapProviderList(w.ads),
    rent: mapProviderList(w.rent),
    buy: mapProviderList(w.buy),
  };
}

export function mapSimilar(w: WireSimilar): SimilarTitle {
  return {
    mediaId: w.media_id ?? 0,
    mediaType: w.media_type === "tv" ? "tv" : "movie",
    tmdbId: w.tmdb_id,
    title: w.title,
    year: w.year > 0 ? w.year : null,
    posterPath: orNull(w.poster_path),
    reasons: mapReasons(w.reasons),
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
    crew: groupCrew(w.credits),
    originalTitle: orNull(w.original_title),
    directors: crewNames(w.credits, ["Director"]),
    writers: crewNames(w.credits, ["Screenplay", "Writer"]),
    studios: names(w.production_companies),
    countries: names(w.production_countries),
    spokenLanguages: spokenNames(w.spoken_languages),
    budget: money(w.budget),
    revenue: money(w.revenue),
    imdbId: orNull(w.imdb_id),
    homepage: orNull(w.homepage),
    collectionName: orNull(w.belongs_to_collection?.name),
    certification: orNull(w.certification),
    trailerKey: trailerKey(w.trailer_key),
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
    studio: w.production_companies?.[0]?.name ?? null,
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
    crew: groupCrew(w.credits),
    originalTitle: orNull(w.original_name),
    studios: names(w.production_companies),
    countries: names(w.production_countries),
    spokenLanguages: spokenNames(w.spoken_languages),
    homepage: orNull(w.homepage),
    imdbId: orNull(w.imdb_id),
    certification: orNull(w.certification),
    trailerKey: trailerKey(w.trailer_key),
    networks: names(w.networks),
    showType: orNull(w.type),
    inProduction: w.in_production === true,
    nextEpisode: episodeRef(w.next_episode_to_air),
    lastEpisode: episodeRef(w.last_episode_to_air),
  };
}

/** Season detail payload from GET /v1/tv/{id}?season_num=N. */
export type SeasonDetail = {
  seasonNumber: number;
  name: string | null;
  overview: string | null;
  posterPath: string | null;
  year: number | null;
  /** The season's own first air date, not the series'. */
  airDate: string | null;
  episodeCount: number | null;
  voteAverage: number | null;
  /** In airing order. Empty before the season is cached. */
  episodes: Episode[];
};

export function mapTvSeason(w: WireTvSeason): SeasonDetail {
  return {
    seasonNumber: w.season_number,
    name: orNull(w.name),
    overview: orNull(w.overview),
    posterPath: orNull(w.poster_path),
    year: yearOf(w.air_date),
    airDate: orNull(w.air_date),
    episodeCount: w.episodes?.length ?? null,
    voteAverage: w.vote_average > 0 ? w.vote_average : null,
    episodes: mapEpisodes(w.episodes),
  };
}

/** Skips anything without an episode number: it can't be placed. */
function mapEpisodes(raw: WireEpisode[] | null): Episode[] {
  return (raw ?? [])
    .filter(
      (e): e is WireEpisode & { episode_number: number } =>
        !!e && typeof e.episode_number === "number" && e.episode_number > 0
    )
    .map((e) => ({
      number: e.episode_number,
      name: orNull(e.name),
      airDate: orNull(e.air_date),
      runtime: e.runtime && e.runtime > 0 ? e.runtime : null,
      stillPath: orNull(e.still_path),
      overview: orNull(e.overview),
    }))
    .sort((a, b) => a.number - b.number);
}

// ---------- users / interactions / onboarding ----------

export function mapUser(w: WireUser): UserProfile {
  return {
    id: w.id,
    username: w.username,
    usernameChangedAt: w.username_changed_at ?? null,
    bio: orNull(w.bio),
    avatarUrl: orNull(w.avatar_url),
    bannerUrl: orNull(w.banner_url),
    birthday: w.birthday ?? null,
    settings: w.settings ?? {},
    notifyPremieres: w.notify_premieres,
    notifyReleases: w.notify_releases,
    createdAt: w.created_at,
  };
}

// ---------- notifications ----------

export function mapNotification(w: WireNotification): AppNotification {
  return {
    id: w.id,
    kind: w.kind,
    tmdbId: w.tmdb_id,
    seasonNumber: w.season_number,
    title: w.title,
    posterPath: orNull(w.poster_path),
    eventDate: w.event_date,
    link: w.link ?? null,
    readAt: w.read_at,
  };
}

export function mapNotificationPage(
  w: WireNotificationPage
): NotificationPage {
  return {
    notifications: (w.notifications ?? []).map(mapNotification),
    unreadCount: w.unread_count,
    hasMore: w.has_more,
  };
}

// ---------- rankings / stats / imports ----------

export function mapRanking(w: WireRanking): Ranking {
  return {
    rank: w.rank,
    tmdbId: w.tmdb_id,
    mediaId: w.media_id ?? null,
    title: w.title,
    year: w.year && w.year > 0 ? w.year : null,
    posterPath: orNull(w.poster_path),
    genres: w.genres ?? [],
    score: w.score != null && w.score > 0 ? w.score : null,
  };
}

export function mapStats(w: WireStats): UserStats {
  const k = w.kpis;
  return {
    kpis: {
      totalFilms: k.total_films,
      totalSeasons: k.total_seasons,
      episodesWatched: k.episodes_watched,
      daysWatched: k.days_watched,
      daysPlanned: k.days_planned,
      meanScore: k.mean_score,
      scoreStddev: k.score_stddev,
    },
    scoreDistribution: w.score_distribution ?? [],
    releaseYears: w.release_years ?? [],
    watchYears: w.watch_years ?? [],
    genres: (w.genres ?? []).map((g) => ({
      name: g.name,
      count: g.count,
      meanScore: g.mean_score,
      hours: g.hours,
    })),
    formats: w.formats ?? [],
    countries: w.countries ?? [],
    activity: w.activity ?? [],
  };
}

const IMPORT_STATUSES = new Set<ImportStatus>([
  "pending",
  "running",
  "done",
  "failed",
]);

export function mapImportJob(w: WireImportJob): ImportJob {
  return {
    id: w.id,
    source: w.source,
    status: IMPORT_STATUSES.has(w.status as ImportStatus)
      ? (w.status as ImportStatus)
      : "pending",
    total: w.total,
    matched: w.matched,
    unmatched: w.unmatched,
    unmatchedTitles: (w.unmatched_titles ?? []).map((t) => ({
      title: t.title,
      year: t.year,
    })),
    error: w.error ?? null,
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
