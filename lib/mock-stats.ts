/**
 * SAMPLE DATA for the profile Overview and Stats tabs.
 *
 * Everything in this file is invented so the pages can be judged as
 * layouts before the backend can compute any of it. Every surface that
 * renders from here carries one visible sample-data note. When the stats
 * endpoints ship, this file is deleted and the mappers take over; nothing
 * else should have to change.
 */

export const SAMPLE_NOTE = "Sample data until your history fills in.";

// ---------- KPI strip ----------

export const MOCK_KPIS = {
  totalFilms: 284,
  totalSeasons: 61,
  episodesWatched: 743,
  daysWatched: 38.4,
  daysPlanned: 6.2,
  meanScore: 78.6,
  standardDeviation: 12.4,
  hoursWatched: 922,
};

// ---------- activity heatmap ----------

/** Deterministic PRNG so the heatmap pattern never shifts between builds. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 53 weeks x 7 days of activity intensity, 0 to 4. Weekends run hotter,
 * with a believable dead stretch and a binge streak baked in.
 */
export const MOCK_HEATMAP: number[][] = (() => {
  const rand = mulberry32(20260731);
  const weeks: number[][] = [];
  for (let w = 0; w < 53; w++) {
    const days: number[] = [];
    for (let d = 0; d < 7; d++) {
      const weekend = d >= 5 ? 0.25 : 0;
      // A quiet spring and a September binge.
      const dead = w >= 14 && w <= 18 ? -0.5 : 0;
      const binge = w >= 36 && w <= 38 ? 0.45 : 0;
      const p = rand() + weekend + dead + binge;
      days.push(p < 0.55 ? 0 : p < 0.75 ? 1 : p < 0.88 ? 2 : p < 0.96 ? 3 : 4);
    }
    weeks.push(days);
  }
  return weeks;
})();

// ---------- genre overview ----------

export type MockGenre = {
  name: string;
  count: number;
  meanScore: number;
  hoursWatched: number;
};

export const MOCK_GENRES: MockGenre[] = [
  { name: "Drama", count: 96, meanScore: 81.2, hoursWatched: 214 },
  { name: "Thriller", count: 74, meanScore: 83.6, hoursWatched: 168 },
  { name: "Sci-Fi", count: 52, meanScore: 79.1, hoursWatched: 131 },
  { name: "Comedy", count: 47, meanScore: 72.4, hoursWatched: 96 },
  { name: "Horror", count: 31, meanScore: 68.9, hoursWatched: 58 },
  { name: "Documentary", count: 18, meanScore: 84.3, hoursWatched: 33 },
];

// ---------- distributions ----------

/** Score bands of 10, the AniList shape: label is the band ceiling. */
export const MOCK_SCORE_DIST: {
  band: string;
  titles: number;
  hours: number;
}[] = [
  { band: "10", titles: 2, hours: 3 },
  { band: "20", titles: 3, hours: 5 },
  { band: "30", titles: 6, hours: 11 },
  { band: "40", titles: 11, hours: 21 },
  { band: "50", titles: 19, hours: 38 },
  { band: "60", titles: 34, hours: 71 },
  { band: "70", titles: 68, hours: 148 },
  { band: "80", titles: 92, hours: 209 },
  { band: "90", titles: 71, hours: 166 },
  { band: "100", titles: 39, hours: 88 },
];

export const MOCK_RELEASE_YEARS: {
  year: number;
  titles: number;
  hours: number;
}[] = [
  { year: 2008, titles: 6, hours: 12 },
  { year: 2009, titles: 8, hours: 17 },
  { year: 2010, titles: 11, hours: 24 },
  { year: 2011, titles: 9, hours: 19 },
  { year: 2012, titles: 14, hours: 31 },
  { year: 2013, titles: 17, hours: 36 },
  { year: 2014, titles: 21, hours: 44 },
  { year: 2015, titles: 18, hours: 39 },
  { year: 2016, titles: 24, hours: 52 },
  { year: 2017, titles: 27, hours: 58 },
  { year: 2018, titles: 25, hours: 55 },
  { year: 2019, titles: 33, hours: 72 },
  { year: 2020, titles: 22, hours: 47 },
  { year: 2021, titles: 28, hours: 61 },
  { year: 2022, titles: 31, hours: 66 },
  { year: 2023, titles: 36, hours: 79 },
  { year: 2024, titles: 41, hours: 92 },
  { year: 2025, titles: 38, hours: 84 },
  { year: 2026, titles: 19, hours: 40 },
];

export const MOCK_WATCH_YEARS: {
  year: number;
  titles: number;
  hours: number;
}[] = [
  { year: 2022, titles: 41, hours: 89 },
  { year: 2023, titles: 74, hours: 163 },
  { year: 2024, titles: 96, hours: 218 },
  { year: 2025, titles: 88, hours: 197 },
  { year: 2026, titles: 46, hours: 108 },
];

export const MOCK_FORMAT_DIST: { label: string; pct: number }[] = [
  { label: "Films", pct: 74 },
  { label: "TV seasons", pct: 26 },
];

export const MOCK_COUNTRY_DIST: { label: string; pct: number }[] = [
  { label: "United States", pct: 48 },
  { label: "South Korea", pct: 17 },
  { label: "United Kingdom", pct: 12 },
  { label: "Japan", pct: 11 },
  { label: "France", pct: 7 },
  { label: "Elsewhere", pct: 5 },
];
