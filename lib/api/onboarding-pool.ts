/**
 * Curated onboarding pool. Hardcoded TMDB IDs from
 * `klyvi/docs/onboarding-spec.md` §4. Swap to `GET /v1/onboarding/pool`
 * when Backend Task 2 lands.
 *
 * Each entry must remain in the seeded movies cache (~457 titles) or be
 * fetchable via TMDB.
 */

export interface OnboardingPoolItem {
  tmdb_id: number;
  title: string;
  year: number;
  dimension: string;
}

export const ONBOARDING_POOL: OnboardingPoolItem[] = [
  // Polarizing arthouse / slow cinema
  { tmdb_id: 8967, title: 'The Tree of Life', year: 2011, dimension: 'slow' },
  { tmdb_id: 503919, title: 'The Lighthouse', year: 2019, dimension: 'slow' },
  { tmdb_id: 62, title: '2001: A Space Odyssey', year: 1968, dimension: 'slow' },
  { tmdb_id: 466272, title: 'Uncut Gems', year: 2019, dimension: 'slow' },

  // Auteur signatures
  { tmdb_id: 680, title: 'Pulp Fiction', year: 1994, dimension: 'auteur' },
  { tmdb_id: 120467, title: 'The Grand Budapest Hotel', year: 2014, dimension: 'auteur' },
  { tmdb_id: 545611, title: 'Everything Everywhere All at Once', year: 2022, dimension: 'auteur' },
  { tmdb_id: 64690, title: 'Drive', year: 2011, dimension: 'auteur' },

  // Modern crowd-pleasers (still polarizing on tone)
  { tmdb_id: 313369, title: 'La La Land', year: 2016, dimension: 'tone' },
  { tmdb_id: 546554, title: 'Knives Out', year: 2019, dimension: 'tone' },
  { tmdb_id: 361743, title: 'Top Gun: Maverick', year: 2022, dimension: 'tone' },
  { tmdb_id: 324857, title: 'Spider-Man: Into the Spider-Verse', year: 2018, dimension: 'tone' },

  // Intense drama
  { tmdb_id: 244786, title: 'Whiplash', year: 2014, dimension: 'drama' },
  { tmdb_id: 492188, title: 'Marriage Story', year: 2019, dimension: 'drama' },
  { tmdb_id: 37799, title: 'The Social Network', year: 2010, dimension: 'drama' },
  { tmdb_id: 666277, title: 'Past Lives', year: 2023, dimension: 'drama' },

  // Genre anchors
  { tmdb_id: 493922, title: 'Hereditary', year: 2018, dimension: 'genre_horror' },
  { tmdb_id: 245891, title: 'John Wick', year: 2014, dimension: 'genre_action' },
  { tmdb_id: 419430, title: 'Get Out', year: 2017, dimension: 'genre_horror' },
  { tmdb_id: 76341, title: 'Mad Max: Fury Road', year: 2015, dimension: 'genre_action' },

  // International / non-Hollywood
  { tmdb_id: 496243, title: 'Parasite', year: 2019, dimension: 'international' },
  { tmdb_id: 915935, title: 'Anatomy of a Fall', year: 2023, dimension: 'international' },
  { tmdb_id: 670, title: 'Oldboy', year: 2003, dimension: 'international' },

  // Coming of age / character study
  { tmdb_id: 391713, title: 'Lady Bird', year: 2017, dimension: 'character' },
  { tmdb_id: 376867, title: 'Moonlight', year: 2016, dimension: 'character' },
  { tmdb_id: 38, title: 'Eternal Sunshine of the Spotless Mind', year: 2004, dimension: 'character' },

  // Classic / era test
  { tmdb_id: 769, title: 'Goodfellas', year: 1990, dimension: 'classic' },
  { tmdb_id: 829, title: 'Chinatown', year: 1974, dimension: 'classic' },
  { tmdb_id: 289, title: 'Casablanca', year: 1942, dimension: 'classic' },

  // Popcorn baseline
  { tmdb_id: 24428, title: 'The Avengers', year: 2012, dimension: 'popcorn' },
  { tmdb_id: 329, title: 'Jurassic Park', year: 1993, dimension: 'popcorn' },
];

/**
 * Deterministically pick `n` items from the pool. Order-stable per user via
 * a simple hash so refreshing doesn't reshuffle.
 */
export function pickOnboardingPool(n: number, seed = 'jacob'): OnboardingPoolItem[] {
  // Tiny deterministic shuffle (FNV-1a hash → seeded Fisher-Yates).
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const arr = [...ONBOARDING_POOL];
  for (let i = arr.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 13), 1597334677);
    const j = Math.abs(h) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}
