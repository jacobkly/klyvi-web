import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MediaSummary } from "@/lib/types";

import { ExploreClient } from "./explore-client";

const getMovieList = vi.fn();
const getTvList = vi.fn();
const getRankings = vi.fn();

vi.mock("@/lib/api/catalog", () => ({
  getMovieList: (...a: unknown[]) => getMovieList(...a),
  getTvList: (...a: unknown[]) => getTvList(...a),
  getRankings: (...a: unknown[]) => getRankings(...a),
}));
vi.mock("@/lib/api/search", () => ({ search: vi.fn() }));

function media(title: string, tmdbId: number): MediaSummary {
  return {
    mediaId: 0,
    mediaType: "movie",
    tmdbId,
    title,
    posterPath: null,
    year: 2024,
  };
}

// jsdom has no layout, and the rails measure themselves on mount.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("ExploreClient browse rails", () => {
  beforeEach(() => {
    getMovieList.mockReset().mockImplementation(async (type: string) => {
      if (type === "popular") throw new Error("boom");
      if (type === "trending") return [media("Trending Film", 1)];
      return [media("Top Film", 2)];
    });
    getTvList.mockReset().mockResolvedValue([
      { ...media("Popular Series", 3), mediaType: "tv" },
    ]);
    getRankings.mockReset().mockResolvedValue([]);
  });

  // A card with no artwork prints its title in the placeholder too, hence
  // findAllByText.
  it("keeps the other rails when one list fails", async () => {
    render(<ExploreClient />);

    expect(await screen.findAllByText("Trending Film")).not.toHaveLength(0);
    expect(await screen.findAllByText("Top Film")).not.toHaveLength(0);
    expect(await screen.findAllByText("Popular Series")).not.toHaveLength(0);
    // The failed rail says so in place, under its own header.
    expect(
      screen.getByRole("heading", { name: "Popular films" })
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Could not load this list right now.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Could not load the catalog.")).toBeNull();
  });

  it("retries only the rail that failed", async () => {
    render(<ExploreClient />);

    const retry = await screen.findByRole("button", { name: "Try again" });
    getMovieList.mockResolvedValueOnce([media("Popular Film", 4)]);
    retry.click();

    expect(await screen.findAllByText("Popular Film")).not.toHaveLength(0);
    const popularCalls = getMovieList.mock.calls.filter(
      ([type]) => type === "popular"
    );
    const trendingCalls = getMovieList.mock.calls.filter(
      ([type]) => type === "trending"
    );
    expect(popularCalls).toHaveLength(2);
    expect(trendingCalls).toHaveLength(1);
  });
});
