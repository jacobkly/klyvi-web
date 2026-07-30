import type { MediaSummary, Reason } from "./types";

/**
 * Mock recommendation feed matching GET /v1/reco/feed (klyvi/docs/API.md):
 * enriched display fields plus Reasons. Tier is a parameter so every copy
 * path renders: Tier 0 has no reasons at all, and one Tier 1 entry carries a
 * nameless reason to exercise the null-render rule.
 */
export type Scored = MediaSummary & {
  backdropPath: string | null;
  voteAverage: number | null;
  reasons: Reason[];
};

const BASE: Omit<Scored, "reasons">[] = [
  {
    mediaId: 142, mediaType: "movie", tmdbId: 11423, title: "Memories of Murder",
    posterPath: "/74gE8YyApcoUKj4tFPmuTBlAOPK.jpg",
    backdropPath: "/srGy65EpFp2Fnp1jpVRWWVF4Vox.jpg",
    year: 2003, voteAverage: 8.1,
  },
  {
    mediaId: 143, mediaType: "movie", tmdbId: 496, title: "Oldboy",
    posterPath: "/pWDtjs568ZfOTMbURQBYuT4Qxka.jpg",
    backdropPath: null,
    year: 2003, voteAverage: 8.3,
  },
  {
    mediaId: 144, mediaType: "movie", tmdbId: 546554, title: "Knives Out",
    posterPath: "/pThyQovXQrw2m0s9x82twj48Jq4.jpg",
    backdropPath: null,
    year: 2019, voteAverage: 7.8,
  },
  {
    mediaId: 145, mediaType: "movie", tmdbId: 375262, title: "The Handmaiden",
    posterPath: "/dLlH4aNHdnmf62umnInL8xPlPzw.jpg",
    backdropPath: null,
    year: 2016, voteAverage: 8.3,
  },
  {
    mediaId: 146, mediaType: "movie", tmdbId: 1018, title: "Mulholland Drive",
    posterPath: "/opnjWCsUqSlIYqhRWd2WQEsRGKZ.jpg",
    backdropPath: null,
    year: 2001, voteAverage: 7.9,
  },
  {
    mediaId: 147, mediaType: "movie", tmdbId: 77, title: "Memento",
    posterPath: "/fQMSaP88cf1nz4qwuNEEFtazuDM.jpg",
    backdropPath: null,
    year: 2000, voteAverage: 8.2,
  },
  {
    mediaId: 148, mediaType: "movie", tmdbId: 4547, title: "Zodiac",
    posterPath: "/6yfaMhaJcJXQBanPDosCkbO4kNi.jpg",
    backdropPath: null,
    year: 2007, voteAverage: 7.5,
  },
];

const TIER_REASONS: Reason[][] = [
  [
    { kind: "keyword", id: 9826, name: "slow-burn" },
    { kind: "genre", id: 80, name: "Crime" },
    { kind: "keyword", id: 10714, name: "serial killer" },
  ],
  [
    { kind: "keyword", id: 12565, name: "psychological thriller" },
    { kind: "keyword", id: 33421 }, // nameless: must not render
    { kind: "genre", id: 53, name: "Thriller" },
  ],
  [
    { kind: "keyword", id: 13141, name: "whodunit" },
    { kind: "genre", id: 9648, name: "Mystery" },
  ],
  [
    { kind: "keyword", id: 128, name: "con artist" },
    { kind: "keyword", id: 549, name: "period drama" },
  ],
  [
    { kind: "keyword", id: 1811, name: "surrealism" },
    { kind: "genre", id: 18, name: "Drama" },
  ],
  [
    { kind: "keyword", id: 470, name: "nonlinear timeline" },
    { kind: "genre", id: 9648, name: "Mystery" },
  ],
  [
    { kind: "keyword", id: 10714, name: "serial killer" },
    { kind: "keyword", id: 9826, name: "slow-burn" },
  ],
];

export type RecoTier = 0 | 1 | 2;

export function mockFeed(tier: RecoTier, count: number): Scored[] {
  return BASE.slice(0, count).map((m, i) => ({
    ...m,
    reasons: tier === 0 ? [] : TIER_REASONS[i % TIER_REASONS.length],
  }));
}

/** Interactions so far; drives the tier progress line (threshold 20). */
export function mockInteractionCount(tier: RecoTier): number {
  return tier === 0 ? 0 : tier === 1 ? 8 : 34;
}
