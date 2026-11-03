import { beforeEach, describe, expect, it, vi } from "vitest";

import { trackFirstUntrackedSeason } from "./track-show";

const addTracking = vi.fn();
const listTracking = vi.fn();
const getTvSeries = vi.fn();

vi.mock("@/lib/api/tracking", () => ({
  addTracking: (...a: unknown[]) => addTracking(...a),
  listTracking: (...a: unknown[]) => listTracking(...a),
}));
vi.mock("@/lib/api/catalog", () => ({
  getTvSeries: (...a: unknown[]) => getTvSeries(...a),
}));

/** A tracked season, with only the fields the helper reads. */
const tracked = (tmdbId: number, seasonNumber: number) => ({
  mediaType: "season",
  tmdbId,
  seasonNumber,
});

const series = (...numbers: number[]) => ({
  seasons: numbers.map((seasonNumber) => ({ seasonNumber })),
});

describe("trackFirstUntrackedSeason", () => {
  beforeEach(() => {
    addTracking.mockReset().mockResolvedValue(undefined);
    listTracking.mockReset().mockResolvedValue([]);
    getTvSeries.mockReset().mockResolvedValue(series(1, 2, 3));
  });

  it("tracks season 1 as Planning when none of the show is tracked", async () => {
    expect(await trackFirstUntrackedSeason(1399)).toBe(1);
    expect(addTracking).toHaveBeenCalledWith({
      tmdbId: 1399,
      mediaType: "season",
      seasonNumber: 1,
      status: "planning",
    });
  });

  it("takes the lowest season not yet tracked, ignoring other shows", async () => {
    listTracking.mockResolvedValue([
      tracked(1399, 1),
      tracked(1399, 3),
      tracked(95396, 2),
    ]);

    expect(await trackFirstUntrackedSeason(1399)).toBe(2);
    expect(listTracking).toHaveBeenCalledWith({ mediaType: "season" });
    expect(addTracking).toHaveBeenCalledWith(
      expect.objectContaining({ seasonNumber: 2, status: "planning" })
    );
  });

  it("writes nothing when every season is already tracked", async () => {
    listTracking.mockResolvedValue([
      tracked(1399, 1),
      tracked(1399, 2),
      tracked(1399, 3),
    ]);

    expect(await trackFirstUntrackedSeason(1399)).toBeNull();
    expect(addTracking).not.toHaveBeenCalled();
  });

  it("uses the seasons it is given instead of fetching the series", async () => {
    expect(await trackFirstUntrackedSeason(1399, [3, 1, 2])).toBe(1);
    expect(getTvSeries).not.toHaveBeenCalled();
  });

  it("fails rather than guess when the series has no seasons", async () => {
    getTvSeries.mockResolvedValue(null);

    await expect(trackFirstUntrackedSeason(1399)).rejects.toThrow();
    expect(addTracking).not.toHaveBeenCalled();
  });
});
