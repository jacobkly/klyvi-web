import { beforeEach, describe, expect, it, vi } from "vitest";

import { getFamily, getMovieCollection } from "./catalog";
import { apiFetch } from "./http";
import type { WireCollectionMovie, WireFamilyTitle } from "./wire";

vi.mock("./http", () => ({ apiFetch: vi.fn() }));

const fetchMock = vi.mocked(apiFetch);

function part(
  movie_id: number,
  name: string,
  release_date: string | null,
  position: number | null
): WireCollectionMovie {
  return {
    collection_id: 263,
    movie_id,
    name,
    poster_path: `/p${movie_id}.jpg`,
    vote_average: 8,
    position,
    release_date,
  };
}

describe("getMovieCollection", () => {
  beforeEach(() => fetchMock.mockReset());

  it("puts the films in release order with their years, undated last", async () => {
    // TMDB's own order is not release order.
    fetchMock.mockResolvedValueOnce([
      part(49026, "The Dark Knight Rises", "2012-07-17T00:00:00Z", 0),
      part(999, "Untitled sequel", null, 1),
      part(272, "Batman Begins", "2005-06-10T00:00:00Z", 2),
      part(155, "The Dark Knight", "2008-07-14T00:00:00Z", 3),
    ]);
    const films = await getMovieCollection(155);
    expect(films.map((f) => [f.title, f.year])).toEqual([
      ["Batman Begins", 2005],
      ["The Dark Knight", 2008],
      ["The Dark Knight Rises", 2012],
      ["Untitled sequel", null],
    ]);
  });

  it("falls back to TMDB's position for rows cached without dates", async () => {
    fetchMock.mockResolvedValueOnce([part(2, "Second", null, 1), part(1, "First", null, 0)]);
    expect((await getMovieCollection(1)).map((f) => f.tmdbId)).toEqual([1, 2]);
  });

  it("is empty when the film has no collection", async () => {
    fetchMock.mockResolvedValueOnce({ details: "No collection found" });
    expect(await getMovieCollection(550)).toEqual([]);
  });
});

describe("getFamily", () => {
  beforeEach(() => fetchMock.mockReset());

  it("asks for the series' family and maps films and series", async () => {
    const rows: WireFamilyTitle[] = [
      {
        media_type: "tv",
        tmdb_id: 60059,
        title: "Better Call Saul",
        poster_path: "/bcs.jpg",
        release_date: "2015-02-08T00:00:00Z",
      },
      {
        media_type: "movie",
        tmdb_id: 559969,
        title: "El Camino: A Breaking Bad Movie",
        poster_path: null,
        release_date: null,
      },
    ];
    fetchMock.mockResolvedValueOnce(rows);
    const family = await getFamily("tv", 1396);

    expect(fetchMock.mock.calls[0][0]).toBe("/v1/tv/1396/family");
    expect(family).toEqual([
      {
        mediaId: 0,
        mediaType: "tv",
        tmdbId: 60059,
        title: "Better Call Saul",
        posterPath: "/bcs.jpg",
        year: 2015,
      },
      {
        mediaId: 0,
        mediaType: "movie",
        tmdbId: 559969,
        title: "El Camino: A Breaking Bad Movie",
        posterPath: null,
        year: null,
      },
    ]);
  });

  it("is empty when the API has none", async () => {
    fetchMock.mockResolvedValueOnce(null);
    expect(await getFamily("movies", 1)).toEqual([]);
  });
});
