import type { LibraryEntry } from "./types";

/**
 * Mock data standing in for GET /v1/lists until auth and the API client land
 * (BUILD.md: the shell runs against mock data through step 4). Shapes match
 * the enriched tracking response in klyvi/docs/API.md. Real TMDB poster paths
 * so artwork renders; two entries deliberately artless to exercise the
 * missing-artwork state.
 */
export const MOCK_LIBRARY: LibraryEntry[] = [
  {
    mediaId: 1, mediaType: "movie", tmdbId: 496243, title: "Parasite",
    posterPath: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg", year: 2019,
    status: "completed", score: 95, progress: null, progressTotal: null,
    notes: null,
    updatedAt: "2026-06-02T19:20:00Z",
  },
  {
    mediaId: 2, mediaType: "movie", tmdbId: 244786, title: "Whiplash",
    posterPath: "/7fn624j5lj3xTme2SgiLCeuedmO.jpg", year: 2014,
    status: "completed", score: 88, progress: null, progressTotal: null,
    notes: null,
    updatedAt: "2026-05-12T21:00:00Z",
  },
  {
    mediaId: 3, mediaType: "season", tmdbId: 95396, seasonNumber: 1,
    title: "Severance",
    posterPath: "/lFf6LLrQjYldcZItzOkGmMMigP7.jpg", year: 2022,
    status: "rewatching", score: 92, progress: 4, progressTotal: 9,
    notes: "Rewatch before season 2.", updatedAt: "2026-07-25T22:10:00Z",
  },
  {
    mediaId: 4, mediaType: "season", tmdbId: 95396, seasonNumber: 2,
    title: "Severance",
    posterPath: "/lFf6LLrQjYldcZItzOkGmMMigP7.jpg", year: 2025,
    status: "watching", score: null, progress: 7, progressTotal: 10,
    notes: null,
    updatedAt: "2026-07-28T23:41:00Z",
  },
  {
    mediaId: 5, mediaType: "movie", tmdbId: 438631, title: "Dune",
    posterPath: "/d5NXSklXo0qyIYkgV94XAgMIckC.jpg", year: 2021,
    status: "planning", score: null, progress: null, progressTotal: null,
    notes: null,
    updatedAt: "2026-07-01T10:00:00Z",
  },
  {
    mediaId: 6, mediaType: "movie", tmdbId: 693134, title: "Dune: Part Two",
    posterPath: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg", year: 2024,
    status: "planning", score: null, progress: null, progressTotal: null,
    notes: null,
    updatedAt: "2026-07-01T10:01:00Z",
  },
  {
    mediaId: 7, mediaType: "season", tmdbId: 1396, seasonNumber: 1,
    title: "Breaking Bad",
    posterPath: "/1BP4xYv9ZG4ZVHkL7ocOziBbSYH.jpg", year: 2008,
    status: "completed", score: 84, progress: 7, progressTotal: 7,
    notes: null,
    updatedAt: "2026-03-18T20:00:00Z",
  },
  {
    mediaId: 8, mediaType: "season", tmdbId: 1396, seasonNumber: 2,
    title: "Breaking Bad",
    posterPath: "/e3oGYpoTUhOFK0BJfloru5ZmGV.jpg", year: 2009,
    status: "paused", score: 78, progress: 5, progressTotal: 13,
    notes: null,
    updatedAt: "2026-04-02T20:00:00Z",
  },
  {
    mediaId: 9, mediaType: "movie", tmdbId: 84892, title: "The Perks of Being a Wallflower",
    posterPath: null, year: 2012,
    status: "completed", score: 74, progress: null, progressTotal: null,
    notes: null,
    updatedAt: "2026-02-14T18:30:00Z",
  },
  {
    mediaId: 10, mediaType: "season", tmdbId: 66732, seasonNumber: 4,
    title: "Stranger Things",
    posterPath: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg", year: 2022,
    status: "dropped", score: 45, progress: 3, progressTotal: 9,
    notes: null,
    updatedAt: "2026-01-20T21:00:00Z",
  },
  {
    mediaId: 11, mediaType: "movie", tmdbId: 129, title: "Spirited Away",
    posterPath: "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg", year: 2001,
    status: "completed", score: 97, progress: null, progressTotal: null,
    notes: null,
    updatedAt: "2026-06-30T20:15:00Z",
  },
  {
    mediaId: 12, mediaType: "movie", tmdbId: 27205, title: "Inception",
    posterPath: null, year: 2010,
    status: "watching", score: null, progress: null, progressTotal: null,
    notes: null,
    updatedAt: "2026-07-29T22:00:00Z",
  },
];
