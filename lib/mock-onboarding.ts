/**
 * Mock of GET /v1/onboarding/pool (public, no auth). Shape and dimensions per
 * klyvi/docs/API.md and onboarding-spec.md.
 */
export type PoolEntry = {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseYear: number;
  dimension: string;
};

export const MOCK_POOL: PoolEntry[] = [
  { tmdbId: 680, title: "Pulp Fiction", posterPath: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg", releaseYear: 1994, dimension: "auteur" },
  { tmdbId: 496243, title: "Parasite", posterPath: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg", releaseYear: 2019, dimension: "arthouse" },
  { tmdbId: 27205, title: "Inception", posterPath: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg", releaseYear: 2010, dimension: "modern_crowdpleaser" },
  { tmdbId: 244786, title: "Whiplash", posterPath: "/7fn624j5lj3xTme2SgiLCeuedmO.jpg", releaseYear: 2014, dimension: "intense_drama" },
  { tmdbId: 419430, title: "Get Out", posterPath: "/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg", releaseYear: 2017, dimension: "genre_horror" },
  { tmdbId: 245891, title: "John Wick", posterPath: "/fZPSd91yGE9fCcCe6OoQr6E3Bev.jpg", releaseYear: 2014, dimension: "genre_action" },
  { tmdbId: 129, title: "Spirited Away", posterPath: "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg", releaseYear: 2001, dimension: "international" },
  { tmdbId: 84892, title: "The Perks of Being a Wallflower", posterPath: "/aKCvdFFF5n80P2VdS7d8YBwbCjh.jpg", releaseYear: 2012, dimension: "coming_of_age" },
  { tmdbId: 238, title: "The Godfather", posterPath: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg", releaseYear: 1972, dimension: "classic" },
  { tmdbId: 634649, title: "Spider-Man: No Way Home", posterPath: "/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg", releaseYear: 2021, dimension: "popcorn" },
  { tmdbId: 155, title: "The Dark Knight", posterPath: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", releaseYear: 2008, dimension: "modern_crowdpleaser" },
  { tmdbId: 77, title: "Memento", posterPath: "/fQMSaP88cf1nz4qwuNEEFtazuDM.jpg", releaseYear: 2000, dimension: "auteur" },
  { tmdbId: 550, title: "Fight Club", posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", releaseYear: 1999, dimension: "modern_crowdpleaser" },
  { tmdbId: 391713, title: "Lady Bird", posterPath: "/iySFtKLrWvVzXzlFj7x1zalxi5G.jpg", releaseYear: 2017, dimension: "coming_of_age" },
  { tmdbId: 76341, title: "Mad Max: Fury Road", posterPath: "/hA2ple9q4qnwxp3hKVNhroipsir.jpg", releaseYear: 2015, dimension: "genre_action" },
  { tmdbId: 372058, title: "Your Name", posterPath: "/q719jXXEzOoYaps6babgKnONONX.jpg", releaseYear: 2016, dimension: "international" },
  { tmdbId: 599, title: "Sunset Boulevard", posterPath: "/sC4Dpmn87oz9AuxZ15Lmip0Ftgr.jpg", releaseYear: 1950, dimension: "classic" },
  { tmdbId: 493922, title: "Hereditary", posterPath: "/p9fmuz2Oj3HtEJEqbIwkFGUhVXD.jpg", releaseYear: 2018, dimension: "genre_horror" },
  { tmdbId: 120467, title: "The Grand Budapest Hotel", posterPath: "/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg", releaseYear: 2014, dimension: "auteur" },
  { tmdbId: 313369, title: "La La Land", posterPath: "/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg", releaseYear: 2016, dimension: "popcorn" },
];
