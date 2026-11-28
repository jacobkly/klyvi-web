import { beforeEach, describe, expect, it, vi } from "vitest";

import { browserFetch } from "./http";
import {
  deleteTracking,
  getWatched,
  listTracking,
  listTrackingPaged,
  lookupTracking,
  TRACKING_CHANGED,
  TRACKING_PAGE,
  updateTracking,
} from "./tracking";
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
  episode_count: null,
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

/** n rows with ids from `from` downward, as one page of the list. */
function rows(from: number, n: number): WireTrackingEntry[] {
  return Array.from({ length: n }, (_, i) => ({
    ...MOVIE_ROW,
    id: from - i,
    media_id: 1000 + from - i,
    updated_at: `2026-09-20T10:00:${String(59 - i).padStart(2, "0")}.5+02:00`,
  }));
}

describe("listTrackingPaged", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("resolves with the first page, then hands over the rest a page at a time", async () => {
    const first = rows(900, TRACKING_PAGE);
    const second = rows(500, TRACKING_PAGE);
    const last = rows(100, 3);
    fetchMock
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second)
      .mockResolvedValueOnce(last);
    const pages: number[][] = [];
    let done!: () => void;
    const finished = new Promise<void>((r) => (done = r));

    const head = await listTrackingPaged({
      page: (p) => {
        pages.push(p.map((e) => e.mediaId));
        if (pages.length === 2) done();
      },
      failed: () => {},
      live: () => true,
    });

    expect(head).toHaveLength(TRACKING_PAGE);
    await finished;
    expect(pages.map((p) => p.length)).toEqual([TRACKING_PAGE, 3]);

    const paths = fetchMock.mock.calls.map((c) => c[0] as string);
    expect(paths[0]).toBe(`/v1/tracking?limit=${TRACKING_PAGE}`);
    // The cursor is the last row's updated_at and id, URL-encoded.
    const tail = first[first.length - 1];
    expect(paths[1]).toBe(
      `/v1/tracking?limit=${TRACKING_PAGE}&cursor=${encodeURIComponent(`${tail.updated_at},${tail.id}`)}`
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("stops after a short first page", async () => {
    fetchMock.mockResolvedValueOnce(rows(10, 4));
    const page = vi.fn();
    const head = await listTrackingPaged({ page, failed: vi.fn(), live: () => true });
    expect(head).toHaveLength(4);
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(page).not.toHaveBeenCalled();
  });

  it("stops asking once the screen has gone", async () => {
    fetchMock.mockResolvedValueOnce(rows(900, TRACKING_PAGE));
    let live = true;
    const head = listTrackingPaged({ page: vi.fn(), failed: vi.fn(), live: () => live });
    await head;
    live = false;
    await new Promise((r) => setTimeout(r, 0));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("says so when a later page fails", async () => {
    fetchMock
      .mockResolvedValueOnce(rows(900, TRACKING_PAGE))
      .mockRejectedValueOnce(new Error("down"));
    let failed!: () => void;
    const sawFailure = new Promise<void>((r) => (failed = r));
    await listTrackingPaged({ page: vi.fn(), failed, live: () => true });
    await sawFailure;
  });

  it("fetches every page when nobody is listening for them", async () => {
    fetchMock
      .mockResolvedValueOnce(rows(900, TRACKING_PAGE))
      .mockResolvedValueOnce(rows(100, 2));
    const all = await listTrackingPaged();
    expect(all).toHaveLength(TRACKING_PAGE + 2);
  });
});

describe("listTracking", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("asks for the rows of a set of titles in one request", async () => {
    fetchMock.mockResolvedValueOnce([MOVIE_ROW]);
    const rows = await listTracking({ mediaType: "movie", tmdbIds: [272, 155] });

    expect(fetchMock.mock.calls[0][0]).toBe(
      "/v1/tracking?media_type=movie&tmdb_ids=272%2C155"
    );
    expect(rows[0]).toMatchObject({ status: "completed", score: 90 });
  });
});

describe("getWatched", () => {
  beforeEach(() => fetchMock.mockReset());

  it("turns the id lists into sets, and a missing list into an empty one", async () => {
    fetchMock.mockResolvedValueOnce({ movies: [550, 680], tv: null });
    const w = await getWatched();
    expect(fetchMock).toHaveBeenCalledWith("/v1/tracking/watched", { signal: undefined });
    expect([...w.movies]).toEqual([550, 680]);
    expect(w.tv.size).toBe(0);
  });
});

describe("tracking writes", () => {
  beforeEach(() => fetchMock.mockReset());

  it("tell the page after an edit or a removal, so marks can catch up", async () => {
    const heard = vi.fn();
    window.addEventListener(TRACKING_CHANGED, heard);
    fetchMock.mockResolvedValueOnce(MOVIE_ROW).mockResolvedValueOnce({ deleted: true });

    await updateTracking(142, { status: "completed" });
    await deleteTracking(142);

    expect(heard).toHaveBeenCalledTimes(2);
    window.removeEventListener(TRACKING_CHANGED, heard);
  });

  it("stay quiet when the write fails", async () => {
    const heard = vi.fn();
    window.addEventListener(TRACKING_CHANGED, heard);
    fetchMock.mockRejectedValueOnce(new Error("down"));

    await expect(updateTracking(142, { status: "completed" })).rejects.toThrow();

    expect(heard).not.toHaveBeenCalled();
    window.removeEventListener(TRACKING_CHANGED, heard);
  });
});
