import { beforeEach, describe, expect, it, vi } from "vitest";

import { browserFetch } from "./http";
import { lookupTracking } from "./tracking";
import type { WireTrackingEntry } from "./wire";

vi.mock("./http", () => ({ browserFetch: vi.fn() }));

const fetchMock = vi.mocked(browserFetch);

/** Shape from klyvi/docs/API.md, GET /v1/tracking/lookup (movie row). */
const MOVIE_ROW: WireTrackingEntry = {
  id: 7,
  user_id: "abc",
  media_id: 142,
  media_type: "movie",
  status: "completed",
  score: 90,
  episode_progress: null,
  notes: "Rewatch in winter",
  favorite: false,
  updated_at: "2026-09-20T10:00:00Z",
  tmdb_id: 11423,
  title: "Memories of Murder",
  poster_path: "/74gE8YyApcoUKj4tFPmuTBlAOPK.jpg",
  backdrop_path: "/srGy65EpFp2Fnp1jpVRWWVF4Vox.jpg",
  release_year: 2003,
  season_number: null,
  season_name: null,
};

describe("lookupTracking", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("asks for one movie by TMDB id and maps the entry", async () => {
    fetchMock.mockResolvedValueOnce(MOVIE_ROW);
    const entry = await lookupTracking({ tmdbId: 11423, mediaType: "movie" });

    const [path, opts] = fetchMock.mock.calls[0];
    expect(path).toBe("/v1/tracking/lookup?tmdb_id=11423&media_type=movie");
    expect(opts).toEqual({ allow404: true });
    expect(entry).toMatchObject({
      mediaId: 142,
      status: "completed",
      score: 90,
      notes: "Rewatch in winter",
    });
  });

  it("sends the season number only for a season", async () => {
    fetchMock.mockResolvedValueOnce(null);
    await lookupTracking({ tmdbId: 1396, mediaType: "season", seasonNumber: 2 });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "/v1/tracking/lookup?tmdb_id=1396&media_type=season&season_number=2"
    );

    fetchMock.mockResolvedValueOnce(null);
    await lookupTracking({ tmdbId: 11423, mediaType: "movie", seasonNumber: 2 });
    expect(fetchMock.mock.calls[1][0]).toBe(
      "/v1/tracking/lookup?tmdb_id=11423&media_type=movie"
    );
  });

  it("returns null when the title is not tracked (404)", async () => {
    fetchMock.mockResolvedValueOnce(null);
    expect(
      await lookupTracking({ tmdbId: 550, mediaType: "movie" })
    ).toBeNull();
  });
});
