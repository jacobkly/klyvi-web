import type { Reason, Scored } from "./types";

/**
 * Mock recommendation feed matching GET /v1/reco/feed (klyvi/docs/API.md):
 * enriched display fields plus Reasons. Tier is a parameter so every copy
 * path renders: Tier 0 has no reasons at all, and one Tier 1 entry carries a
 * nameless reason to exercise the null-render rule.
 *
 * The Scored type now lives in lib/types.ts; re-exported here so existing
 * imports keep working.
 */
export type { Scored } from "./types";

const BASE: Omit<Scored, "reasons">[] = [
  {
    mediaId: 142, mediaType: "movie", tmdbId: 419430, title: "Get Out",
    overview:
      "A young Black man visits his white girlfriend’s family estate for the weekend, where his unease about their reception of him eventually reaches a boiling point.",
    runtime: 104, genres: ["Horror", "Mystery", "Thriller"],
    posterPath: "/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg",
    backdropPath: null,
    year: 2017, voteAverage: 7.8,
  },
  {
    mediaId: 143, mediaType: "movie", tmdbId: 496, title: "Oldboy",
    overview:
      "After being kidnapped and imprisoned for fifteen years, a man is released and given four days to find his captor and understand why.",
    runtime: 120, genres: ["Drama", "Thriller", "Action"],
    posterPath: "/pWDtjs568ZfOTMbURQBYuT4Qxka.jpg",
    backdropPath: null,
    year: 2003, voteAverage: 8.3,
  },
  {
    mediaId: 144, mediaType: "movie", tmdbId: 546554, title: "Knives Out",
    overview:
      "A detective investigates the death of the patriarch of an eccentric, combative family after his eighty-fifth birthday party.",
    runtime: 130, genres: ["Comedy", "Crime", "Mystery"],
    posterPath: "/pThyQovXQrw2m0s9x82twj48Jq4.jpg",
    backdropPath: null,
    year: 2019, voteAverage: 7.8,
  },
  {
    mediaId: 145, mediaType: "movie", tmdbId: 375262, title: "The Handmaiden",
    overview:
      "A woman is hired as a handmaiden to a Japanese heiress, but secretly she is involved in a plot to defraud her.",
    runtime: 145, genres: ["Drama", "Romance", "Thriller"],
    posterPath: "/dLlH4aNHdnmf62umnInL8xPlPzw.jpg",
    backdropPath: null,
    year: 2016, voteAverage: 8.3,
  },
  {
    mediaId: 146, mediaType: "movie", tmdbId: 493922, title: "Hereditary",
    overview:
      "When the matriarch of a family passes away, her daughter and grandchildren begin to unravel cryptic and increasingly terrifying secrets about their ancestry.",
    runtime: 127, genres: ["Horror", "Mystery", "Thriller"],
    posterPath: "/p9fmuz2Oj3HtEJEqbIwkFGUhVXD.jpg",
    backdropPath: null,
    year: 2018, voteAverage: 7.3,
  },
  {
    mediaId: 147, mediaType: "movie", tmdbId: 155, title: "The Dark Knight",
    overview:
      "Batman raises the stakes in his war on crime, setting out to dismantle the remaining criminal organisations that plague Gotham.",
    runtime: 152, genres: ["Drama", "Action", "Crime"],
    posterPath: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    backdropPath: null,
    year: 2008, voteAverage: 8.5,
  },
  {
    mediaId: 148, mediaType: "movie", tmdbId: 129, title: "Spirited Away",
    overview:
      "A young girl wanders into a world ruled by gods and witches, where humans are turned into beasts, and must find a way to free her family.",
    runtime: 125, genres: ["Animation", "Family", "Fantasy"],
    posterPath: "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
    backdropPath: null,
    year: 2001, voteAverage: 8.5,
  },
];

const TIER_REASONS: Reason[][] = [
  [
    { kind: "keyword", id: 9826, name: "social thriller" },
    { kind: "genre", id: 27, name: "Horror" },
    { kind: "keyword", id: 14602, name: "class differences" },
  ],
  [
    { kind: "keyword", id: 12565, name: "psychological thriller" },
    { kind: "keyword", id: 33421 }, // nameless: must not render
    { kind: "keyword", id: 470, name: "revenge" },
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
    { kind: "keyword", id: 1811, name: "slow-burn" },
    { kind: "genre", id: 27, name: "Horror" },
  ],
  [
    { kind: "keyword", id: 471, name: "vigilante" },
    { kind: "genre", id: 28, name: "Action" },
  ],
  [
    { kind: "keyword", id: 1299, name: "coming of age" },
    { kind: "genre", id: 16, name: "Animation" },
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
