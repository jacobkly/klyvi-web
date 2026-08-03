import { describe, expect, it } from "vitest";

import {
  mapMovie,
  mapPoolEntry,
  mapRanking,
  mapScored,
  mapSearchResults,
  mapStats,
  mapTrackingEntry,
  mapTvSeries,
  mapUser,
} from "./map";
import type {
  WireMovie,
  WireScored,
  WireStats,
  WireTrackingEntry,
  WireTvSeries,
} from "./wire";

/** Verbatim from klyvi/docs/API.md, GET /v1/tracking (season row). */
const SEASON_ROW = {
  id: 19,
  user_id: "abc",
  media_id: 955,
  media_type: "season",
  status: "watching",
  score: null,
  episode_progress: 3,
  notes: null,
  updated_at: "2026-07-28T10:00:00Z",
  tmdb_id: 1396,
  title: "Breaking Bad",
  season_number: 1,
  season_name: "Season 1",
  poster_path: "/1yeVJox3rjo2jBKrrihIMj7uoS9.jpg",
  backdrop_path: "/x.jpg",
  release_year: 2008,
} as WireTrackingEntry;

/** Verbatim from API.md, GET /v1/tracking (movie row). */
const MOVIE_ROW = {
  id: 18,
  user_id: "abc",
  media_id: 142,
  media_type: "movie",
  status: "completed",
  score: 95,
  episode_progress: null,
  notes: null,
  updated_at: "2026-07-27T10:00:00Z",
  tmdb_id: 550,
  title: "Fight Club",
  poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
  backdrop_path: "/rr7E0NoGKxvbkb89eR1GwfoYjpA.jpg",
  release_year: 1999,
  season_number: null,
  season_name: null,
} as WireTrackingEntry;

describe("mapTrackingEntry", () => {
  it("maps the enriched season row", () => {
    const e = mapTrackingEntry(SEASON_ROW);
    expect(e).toMatchObject({
      mediaId: 955,
      mediaType: "season",
      tmdbId: 1396,
      title: "Breaking Bad",
      seasonNumber: 1,
      status: "watching",
      score: null,
      progress: 3,
      year: 2008,
    });
  });

  it("maps the movie row with a score and no season fields", () => {
    const e = mapTrackingEntry(MOVIE_ROW);
    expect(e.mediaType).toBe("movie");
    expect(e.score).toBe(95);
    expect(e.seasonNumber).toBeUndefined();
    expect(e.progress).toBeNull();
  });

  it("survives a cold row whose display fields are all null", () => {
    const e = mapTrackingEntry({
      ...MOVIE_ROW,
      tmdb_id: null,
      title: null,
      poster_path: null,
      release_year: null,
    });
    expect(e.tmdbId).toBe(0);
    expect(e.title).toBe("Untitled");
    expect(e.posterPath).toBeNull();
    expect(e.year).toBeNull();
  });
});

/** Verbatim from API.md, GET /v1/reco/feed: PascalCase except reasons. */
const SCORED: WireScored = {
  MediaID: 142,
  MediaType: "movie",
  TMDBID: 11423,
  Title: "Memories of Murder",
  PosterPath: "/74gE8YyApcoUKj4tFPmuTBlAOPK.jpg",
  BackdropPath: "/srGy65EpFp2Fnp1jpVRWWVF4Vox.jpg",
  ReleaseYear: 2003,
  VoteAverage: 8.1,
  Score: 1.42,
  Reasons: [
    { kind: "keyword", id: 9826, name: "slow-burn" },
    { kind: "genre", id: 18, name: "Drama" },
  ],
};

describe("mapScored", () => {
  it("maps the PascalCase feed item with lowercase reasons", () => {
    const s = mapScored(SCORED);
    expect(s).toMatchObject({
      mediaId: 142,
      mediaType: "movie",
      tmdbId: 11423,
      title: "Memories of Murder",
      year: 2003,
      voteAverage: 8.1,
      reasons: [
        { kind: "keyword", id: 9826, name: "slow-burn" },
        { kind: "genre", id: 18, name: "Drama" },
      ],
    });
    // Hydrated later, absent from the feed.
    expect(s.overview).toBeNull();
    expect(s.runtime).toBeNull();
    expect(s.genres).toEqual([]);
  });

  it("keeps a nameless reason and tolerates null Reasons (Tier 0)", () => {
    const s = mapScored({
      ...SCORED,
      Reasons: [{ kind: "keyword", id: 42 }],
    });
    expect(s.reasons).toEqual([{ kind: "keyword", id: 42, name: undefined }]);
    expect(mapScored({ ...SCORED, Reasons: null }).reasons).toEqual([]);
  });

  it("treats empty display strings and zero year as absent", () => {
    const s = mapScored({
      ...SCORED,
      PosterPath: "",
      BackdropPath: "",
      ReleaseYear: 0,
      VoteAverage: 0,
    });
    expect(s.posterPath).toBeNull();
    expect(s.backdropPath).toBeNull();
    expect(s.year).toBeNull();
    expect(s.voteAverage).toBeNull();
  });
});

describe("mapMovie", () => {
  const WIRE: WireMovie = {
    movie_id: 496243,
    title: "Parasite",
    overview: "All unemployed, Ki-taek's family takes peculiar interest...",
    tagline: "Act like you own the place.",
    poster_path: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    backdrop_path: "/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg",
    release_date: "2019-05-30T00:00:00Z",
    runtime: 133,
    status: "Released",
    original_language: "ko",
    genres: [
      { id: 35, name: "Comedy" },
      { id: 53, name: "Thriller" },
    ],
    production_companies: [{ id: 1, name: "Barunson E&A" }],
    vote_average: 8.5,
    vote_count: 17000,
    keywords: {
      keywords: [
        { id: 10, name: "class differences" },
        { id: 11, name: "con artist" },
      ],
    },
    credits: {
      cast: [
        { id: 20, name: "Song Kang-ho", order: 0 },
        { id: 21, name: "Lee Sun-kyun", order: 1 },
      ],
      crew: [
        { id: 30, name: "Bong Joon-ho", job: "Director" },
        { id: 31, name: "Someone Else", job: "Producer" },
      ],
    },
  };

  it("maps the full movie payload", () => {
    const m = mapMovie(WIRE);
    expect(m).toMatchObject({
      tmdbId: 496243,
      title: "Parasite",
      year: 2019,
      runtime: 133,
      director: "Bong Joon-ho",
      genres: ["Comedy", "Thriller"],
      studio: "Barunson E&A",
      voteAverage: 8.5,
    });
    expect(m.keywords).toHaveLength(2);
    expect(m.cast[0]).toEqual({ id: 20, name: "Song Kang-ho" });
    expect(m.language).toBe("Korean");
    expect(m.releaseDate).toBe("2019-05-30T00:00:00Z");
  });

  it("accepts keywords as a bare array (what the live API stores)", () => {
    const m = mapMovie({
      ...WIRE,
      keywords: [{ id: 99, name: "heist" }],
    });
    expect(m.keywords).toEqual([{ id: 99, name: "heist" }]);
  });

  it("handles a bare cache row with null JSONB fields", () => {
    const m = mapMovie({
      ...WIRE,
      genres: null,
      keywords: null,
      credits: null,
      production_companies: null,
      release_date: null,
      title: null,
      runtime: 0,
    });
    expect(m.title).toBe("Untitled");
    expect(m.genres).toEqual([]);
    expect(m.keywords).toEqual([]);
    expect(m.cast).toEqual([]);
    expect(m.director).toBeNull();
    expect(m.year).toBeNull();
    expect(m.runtime).toBeNull();
  });
});

describe("mapTvSeries", () => {
  const WIRE = {
    tv_id: 1396,
    name: "Breaking Bad",
    overview: "A chemistry teacher...",
    tagline: "Change the equation.",
    poster_path: "/p.jpg",
    backdrop_path: "/b.jpg",
    first_air_date: "2008-01-20T00:00:00Z",
    last_air_date: "2013-09-29T00:00:00Z",
    number_of_episodes: 62,
    number_of_seasons: 5,
    original_language: "en",
    status: "Ended",
    genres: [{ id: 18, name: "Drama" }],
    created_by: [{ id: 66633, name: "Vince Gilligan" }],
    seasons: [
      {
        season_number: 0,
        air_date: null,
        poster_path: "/sp.jpg",
        episode_count: 9,
        name: "Specials",
        overview: "",
      },
      {
        season_number: 1,
        air_date: "2008-01-20",
        poster_path: "/s1.jpg",
        episode_count: 7,
        name: "Season 1",
        overview: "High school chemistry teacher...",
      },
    ],
    vote_average: 8.9,
    vote_count: 12000,
    keywords: { results: [{ id: 15, name: "drug cartel" }] },
    credits: { cast: [{ id: 17419, name: "Bryan Cranston", order: 0 }] },
  } as WireTvSeries;

  it("maps the series with specials filtered out", () => {
    const t = mapTvSeries(WIRE);
    expect(t.title).toBe("Breaking Bad");
    expect(t.creator).toBe("Vince Gilligan");
    expect(t.seasons).toHaveLength(1);
    expect(t.seasons[0]).toMatchObject({
      seasonNumber: 1,
      year: 2008,
      episodeCount: 7,
    });
    expect(t.keywords).toEqual([{ id: 15, name: "drug cartel" }]);
    expect(t.year).toBe(2008);
  });
});

describe("mapUser + mapPoolEntry", () => {
  it("maps the user row, defaulting a null settings blob to {}", () => {
    const u = mapUser({
      id: "uuid-1",
      username: "user_abc12345",
      username_changed_at: null,
      bio: null,
      avatar_url: null,
      banner_url: null,
      birthday: null,
      settings: null,
      is_active: true,
      created_at: "2026-07-01T00:00:00Z",
    });
    expect(u.username).toBe("user_abc12345");
    expect(u.avatarUrl).toBeNull();
    expect(u.birthday).toBeNull();
    expect(u.settings).toEqual({});
  });

  it("carries through birthday and the settings blob", () => {
    const u = mapUser({
      id: "u2",
      username: "jacob",
      username_changed_at: "2026-07-20T00:00:00Z",
      bio: "arthouse",
      avatar_url: "https://cdn/a.jpg",
      banner_url: null,
      birthday: "1999-04-12",
      settings: { themeAccent: "blue", textSize: "large" },
      is_active: true,
      created_at: "2026-01-01T00:00:00Z",
    });
    expect(u.birthday).toBe("1999-04-12");
    expect(u.settings).toEqual({ themeAccent: "blue", textSize: "large" });
  });

  it("maps the verbatim pool entry from API.md", () => {
    const p = mapPoolEntry({
      tmdb_id: 680,
      title: "Pulp Fiction",
      poster_path: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
      release_year: 1994,
      dimension: "auteur",
    });
    expect(p).toEqual({
      tmdbId: 680,
      title: "Pulp Fiction",
      posterPath: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
      releaseYear: 1994,
      dimension: "auteur",
    });
  });
});

describe("mapRanking", () => {
  it("maps a ranking row from API.md", () => {
    const r = mapRanking({
      rank: 1,
      tmdb_id: 238,
      media_id: 12,
      title: "The Godfather",
      year: 1972,
      poster_path: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
      genres: ["Drama", "Crime"],
      score: 8.7,
    });
    expect(r).toEqual({
      rank: 1,
      tmdbId: 238,
      mediaId: 12,
      title: "The Godfather",
      year: 1972,
      posterPath: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
      genres: ["Drama", "Crime"],
      score: 8.7,
    });
  });

  it("null media_id (uncached / TV) and null genres survive", () => {
    const r = mapRanking({
      rank: 4,
      tmdb_id: 999,
      media_id: null,
      title: "Some Series",
      year: null,
      poster_path: null,
      genres: null,
      score: null,
    });
    expect(r.mediaId).toBeNull();
    expect(r.genres).toEqual([]);
    expect(r.score).toBeNull();
  });
});

describe("mapStats", () => {
  it("camel-cases kpis and defaults null arrays to []", () => {
    const wire: WireStats = {
      kpis: {
        total_films: 284,
        total_seasons: 61,
        episodes_watched: 743,
        days_watched: 38.4,
        days_planned: 6.2,
        mean_score: 78.6,
        score_stddev: 12.4,
      },
      score_distribution: [{ band: "91-100", titles: 39, hours: 88 }],
      release_years: null,
      watch_years: [{ year: 2025, titles: 88, hours: 0 }],
      genres: [{ name: "Drama", count: 96, mean_score: 81.2, hours: 214 }],
      formats: [{ label: "Films", pct: 74 }],
      countries: null,
      activity: [{ date: "2026-08-03", count: 3 }],
    };
    const s = mapStats(wire);
    expect(s.kpis.totalFilms).toBe(284);
    expect(s.kpis.scoreStddev).toBe(12.4);
    expect(s.releaseYears).toEqual([]);
    expect(s.countries).toEqual([]);
    expect(s.genres[0]).toEqual({
      name: "Drama",
      count: 96,
      meanScore: 81.2,
      hours: 214,
    });
    expect(s.activity[0]).toEqual({ date: "2026-08-03", count: 3 });
  });
});

describe("mapSearchResults", () => {
  it("splits a multi response into movies, tv, and people", () => {
    const out = mapSearchResults({
      page: 1,
      total_pages: 1,
      total_results: 3,
      results: [
        {
          id: 550,
          media_type: "movie",
          title: "Fight Club",
          poster_path: "/fc.jpg",
          release_date: "1999-10-15",
          vote_average: 8.4,
        },
        {
          id: 1396,
          media_type: "tv",
          name: "Breaking Bad",
          poster_path: "/bb.jpg",
          first_air_date: "2008-01-20",
        },
        {
          id: 525,
          media_type: "person",
          name: "Christopher Nolan",
          profile_path: "/cn.jpg",
          known_for_department: "Directing",
          known_for: [{ title: "Inception" }, { title: "Interstellar" }],
        },
      ],
    });
    expect(out.movies).toHaveLength(1);
    expect(out.movies[0]).toMatchObject({
      mediaType: "movie",
      tmdbId: 550,
      year: 1999,
    });
    expect(out.tv[0]).toMatchObject({
      mediaType: "tv",
      tmdbId: 1396,
      title: "Breaking Bad",
      year: 2008,
    });
    expect(out.people[0]).toMatchObject({
      tmdbId: 525,
      name: "Christopher Nolan",
      knownFor: ["Inception", "Interstellar"],
    });
  });

  it("treats a typed movie search (no media_type field) as movies", () => {
    const out = mapSearchResults(
      {
        page: 1,
        total_pages: 1,
        total_results: 1,
        results: [
          { id: 496, title: "Oldboy", poster_path: null, release_date: "" },
        ],
      },
      "movie"
    );
    expect(out.movies).toHaveLength(1);
    expect(out.movies[0].year).toBeNull();
  });
});
