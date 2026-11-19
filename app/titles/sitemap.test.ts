import { beforeEach, describe, expect, it, vi } from "vitest";

const getRankings = vi.fn();
const getMovieList = vi.fn();
const getTvList = vi.fn();
vi.mock("@/lib/api/catalog", () => ({
  getRankings: (...a: unknown[]) => getRankings(...a),
  getMovieList: (...a: unknown[]) => getMovieList(...a),
  getTvList: (...a: unknown[]) => getTvList(...a),
}));

import sitemap from "./sitemap";

const row = (tmdbId: number) => ({ tmdbId });

beforeEach(() => {
  getRankings.mockReset().mockImplementation(async (kind: string) =>
    kind === "movies" ? [row(550), row(680)] : [row(1396)]
  );
  getMovieList.mockReset().mockResolvedValue([row(550), row(27205)]);
  getTvList.mockReset().mockResolvedValue([row(1399)]);
});

describe("the title sitemap", () => {
  it("lists the top lists and this week's titles, once each, on www", async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toEqual(
      expect.arrayContaining([
        "https://www.klyvi.net/movie/550",
        "https://www.klyvi.net/movie/680",
        "https://www.klyvi.net/movie/27205",
        "https://www.klyvi.net/tv/1396",
        "https://www.klyvi.net/tv/1399",
      ])
    );
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("keeps whatever loaded when one list fails", async () => {
    getRankings.mockRejectedValue(new Error("down"));
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain("https://www.klyvi.net/movie/27205");
    expect(urls).not.toContain("https://www.klyvi.net/movie/680");
  });
});
