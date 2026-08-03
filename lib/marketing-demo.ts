import type { Scored } from "./types";

/**
 * The five films behind the landing page's live Find Next demo: big,
 * instantly recognizable titles, because the demo's job is "oh, it knows
 * films I love", not deep-cut credibility. Poster paths are the same real
 * TMDB paths the onboarding pool and mock library carry; backdrops
 * hydrate from the public catalog at runtime. The reasons are curated to
 * read like a formed taste profile, which is the product moment the demo
 * exists to show.
 */

export const DEMO_PICKS: Scored[] = [
  {
    mediaId: 901,
    mediaType: "movie",
    tmdbId: 27205,
    title: "Inception",
    posterPath: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    backdropPath: null,
    year: 2010,
    voteAverage: 8.4,
    runtime: 148,
    genres: ["Action", "Sci-Fi", "Adventure"],
    overview:
      "A thief who steals secrets from inside dreams is offered a way home: plant an idea in a sleeping mind and make it stick.",
    reasons: [
      { kind: "keyword", id: 1, name: "mind-bender" },
      { kind: "keyword", id: 2, name: "heist" },
      { kind: "keyword", id: 3, name: "because you liked The Matrix" },
    ],
  },
  {
    mediaId: 902,
    mediaType: "movie",
    tmdbId: 155,
    title: "The Dark Knight",
    posterPath: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    backdropPath: null,
    year: 2008,
    voteAverage: 8.5,
    runtime: 152,
    genres: ["Drama", "Action", "Crime"],
    overview:
      "Batman raises the stakes in his war on crime, setting out to dismantle the remaining criminal organisations that plague Gotham.",
    reasons: [
      { kind: "keyword", id: 4, name: "crime epic" },
      { kind: "keyword", id: 5, name: "vigilante" },
      { kind: "keyword", id: 6, name: "because you rate villains highly" },
    ],
  },
  {
    mediaId: 903,
    mediaType: "movie",
    tmdbId: 693134,
    title: "Dune: Part Two",
    posterPath: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    backdropPath: null,
    year: 2024,
    voteAverage: 8.2,
    runtime: 167,
    genres: ["Sci-Fi", "Adventure"],
    overview:
      "Paul Atreides unites with the Fremen to wage war on House Harkonnen, torn between the love of his life and the fate of the known universe.",
    reasons: [
      { kind: "keyword", id: 7, name: "epic world-building" },
      { kind: "keyword", id: 8, name: "because you liked Blade Runner 2049" },
      { kind: "keyword", id: 9, name: "chosen one" },
    ],
  },
  {
    mediaId: 904,
    mediaType: "movie",
    tmdbId: 550,
    title: "Fight Club",
    posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    backdropPath: null,
    year: 1999,
    voteAverage: 8.4,
    runtime: 139,
    genres: ["Drama", "Thriller"],
    overview:
      "An insomniac office worker and a devil-may-care soap maker build an underground club where men fight, until the idea outgrows its basement.",
    reasons: [
      { kind: "keyword", id: 10, name: "unreliable narrator" },
      { kind: "keyword", id: 11, name: "twist ending" },
      { kind: "keyword", id: 12, name: "because you liked Se7en" },
    ],
  },
  {
    mediaId: 905,
    mediaType: "movie",
    tmdbId: 244786,
    title: "Whiplash",
    posterPath: "/7fn624j5lj3xTme2SgiLCeuedmO.jpg",
    backdropPath: null,
    year: 2014,
    voteAverage: 8.4,
    runtime: 107,
    genres: ["Drama", "Music"],
    overview:
      "A young drummer enrols at a cutthroat conservatory, where a feared instructor pushes his obsession with greatness to the edge.",
    reasons: [
      { kind: "keyword", id: 13, name: "obsession" },
      { kind: "keyword", id: 14, name: "because you rate intense dramas highly" },
    ],
  },
];

/** Start in the middle so both neighbours peek in from the first frame. */
export const DEMO_START_INDEX = 2;
