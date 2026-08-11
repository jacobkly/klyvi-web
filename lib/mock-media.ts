import type { MediaSummary } from "./types";

/**
 * Mock detail payloads matching the API's Movie / TV shapes (klyvi/docs/API.md)
 * until the client lands. One movie and one TV series with seasons, plus
 * deliberate gaps (no overview on one season, missing provider data) so the
 * missing-data copy paths render.
 */

export type CastMember = { id: number; name: string };
export type Keyword = { id: number; name: string };
/** Crew grouped by the role we surface (Director, Writers, ...). */
export type CrewGroup = { role: string; names: string[] };

export type MovieDetail = {
  tmdbId: number;
  title: string;
  year: number | null;
  posterPath: string | null;
  backdropPath: string | null;
  tagline: string | null;
  overview: string | null;
  runtime: number | null;
  releaseDate: string | null;
  status: string;
  language: string;
  studio: string | null;
  voteAverage: number | null;
  genres: string[];
  keywords: Keyword[];
  cast: CastMember[];
  director: string | null;
  crew: CrewGroup[];
};

export type SeasonInfo = {
  seasonNumber: number;
  year: number | null;
  posterPath: string | null;
  episodeCount: number;
};

export type TvDetail = Omit<MovieDetail, "runtime" | "director"> & {
  seasons: SeasonInfo[];
  episodeRuntime: number | null;
  firstAirDate: string | null;
  lastAirDate: string | null;
  creator: string | null;
};

export const MOCK_MOVIE: MovieDetail = {
  tmdbId: 496243,
  title: "Parasite",
  year: 2019,
  posterPath: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
  backdropPath: "/hiKmpZMGZsrkA3cdce8a7Dpos1j.jpg",
  tagline: "Act like you own the place.",
  overview:
    "All unemployed, Ki-taek's family takes peculiar interest in the wealthy and glamorous Parks for their livelihood until they get entangled in an unexpected incident.",
  runtime: 132,
  releaseDate: "2019-05-30",
  status: "Released",
  language: "Korean",
  studio: "Barunson E&A",
  voteAverage: 8.5,
  genres: ["Comedy", "Thriller", "Drama"],
  keywords: [
    { id: 10453, name: "con artist" },
    { id: 12565, name: "psychological thriller" },
    { id: 13126, name: "dark comedy" },
    { id: 14602, name: "class differences" },
    { id: 17997, name: "basement" },
    { id: 33421, name: "social satire" },
  ],
  cast: [
    { id: 1, name: "Song Kang-ho" },
    { id: 2, name: "Lee Sun-kyun" },
    { id: 3, name: "Cho Yeo-jeong" },
    { id: 4, name: "Choi Woo-shik" },
    { id: 5, name: "Park So-dam" },
    { id: 6, name: "Jang Hye-jin" },
    { id: 7, name: "Lee Jung-eun" },
    { id: 8, name: "Park Myung-hoon" },
  ],
  director: "Bong Joon Ho",
  crew: [
    { role: "Director", names: ["Bong Joon Ho"] },
    { role: "Writers", names: ["Bong Joon Ho", "Han Jin-won"] },
    { role: "Cinematography", names: ["Hong Kyung-pyo"] },
    { role: "Music", names: ["Jung Jae-il"] },
  ],
};

export const MOCK_TV: TvDetail = {
  tmdbId: 95396,
  title: "Severance",
  year: 2022,
  posterPath: "/lFf6LLrQjYldcZItzOkGmMMigP7.jpg",
  backdropPath: "/is9bmV6uYXu7LjZGJczxrjJDlv8.jpg",
  tagline: null,
  overview:
    "Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives. When a mysterious colleague appears outside of work, it begins a journey to discover the truth about their jobs.",
  releaseDate: "2022-02-17",
  status: "Returning Series",
  language: "English",
  studio: "Red Hour",
  voteAverage: 8.3,
  genres: ["Drama", "Mystery", "Sci-Fi"],
  keywords: [
    { id: 1, name: "workplace" },
    { id: 2, name: "memory" },
    { id: 3, name: "corporate dystopia" },
    { id: 4, name: "double life" },
  ],
  cast: [
    { id: 1, name: "Adam Scott" },
    { id: 2, name: "Britt Lower" },
    { id: 3, name: "Zach Cherry" },
    { id: 4, name: "John Turturro" },
    { id: 5, name: "Patricia Arquette" },
    { id: 6, name: "Tramell Tillman" },
  ],
  creator: "Dan Erickson",
  crew: [
    { role: "Creator", names: ["Dan Erickson"] },
    { role: "Directors", names: ["Ben Stiller", "Aoife McArdle"] },
    { role: "Music", names: ["Theodore Shapiro"] },
  ],
  episodeRuntime: 50,
  firstAirDate: "2022-02-17",
  lastAirDate: "2025-03-20",
  seasons: [
    { seasonNumber: 1, year: 2022, posterPath: "/lFf6LLrQjYldcZItzOkGmMMigP7.jpg", episodeCount: 9 },
    { seasonNumber: 2, year: 2025, posterPath: "/lFf6LLrQjYldcZItzOkGmMMigP7.jpg", episodeCount: 10 },
  ],
};

export function summaryOf(d: MovieDetail): MediaSummary {
  return {
    mediaId: -1,
    mediaType: "movie",
    tmdbId: d.tmdbId,
    title: d.title,
    posterPath: d.posterPath,
    year: d.year,
  };
}

/** "2h 12m" / "48m" per the number rules in 06-copy.md. */
export function formatRuntime(minutes: number | null): string | null {
  if (minutes == null) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** "4 November 2023", no ordinal. */
export function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
