import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
const search = vi.fn();
vi.mock("@/lib/api/search", () => ({
  search: (...a: unknown[]) => search(...a),
}));

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

describe("ExploreClient search", () => {
  beforeEach(() => {
    getMovieList.mockReset().mockResolvedValue([]);
    getTvList.mockReset().mockResolvedValue([]);
    getRankings.mockReset().mockResolvedValue([]);
    search.mockReset();
  });

  function results(title: string) {
    return {
      movies: [{ ...media(title, 9), genreIds: [], voteAverage: null }],
      tv: [],
      people: [],
    };
  }

  it("recovers from a failed search with Try again", async () => {
    search
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce(results("Parasite"));
    render(<ExploreClient />);

    await userEvent.type(
      screen.getByRole("textbox", { name: "Search films, TV, and people" }),
      "parasite"
    );
    expect(await screen.findByText("Search is not responding.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findAllByText("Parasite")).not.toHaveLength(0);
    expect(screen.queryByText("Search is not responding.")).toBeNull();
  });

  it("hides the last query's results while the next one is searching", async () => {
    search
      .mockResolvedValueOnce(results("Parasite"))
      .mockReturnValueOnce(new Promise(() => {}));
    render(<ExploreClient />);
    const box = screen.getByRole("textbox", { name: "Search films, TV, and people" });

    await userEvent.type(box, "parasite");
    expect(await screen.findAllByText("Parasite")).not.toHaveLength(0);

    await userEvent.type(box, "s");
    expect(screen.queryByText("Parasite")).toBeNull();
  });

  // #24: the query lives in the URL, so Back, reload and a shared link keep
  // the results.
  it("fills the box and the results from ?q=", async () => {
    search.mockResolvedValue(results("Dune"));
    render(<ExploreClient initialQuery="dune" />);

    expect(
      screen.getByRole("textbox", { name: "Search films, TV, and people" })
    ).toHaveValue("dune");
    expect(await screen.findAllByText("Dune")).not.toHaveLength(0);
    expect(search).toHaveBeenCalledWith("dune", "multi", expect.anything());
  });

  it("writes the query to the URL as it settles", async () => {
    window.history.replaceState(null, "", "/explore?focus=1");
    search.mockResolvedValue(results("Parasite"));
    render(<ExploreClient />);

    await userEvent.type(
      screen.getByRole("textbox", { name: "Search films, TV, and people" }),
      "parasite"
    );
    await screen.findAllByText("Parasite");
    expect(window.location.pathname + window.location.search).toBe(
      "/explore?q=parasite"
    );

    await userEvent.clear(
      screen.getByRole("textbox", { name: "Search films, TV, and people" })
    );
    await waitFor(() => expect(window.location.search).toBe(""));
  });
});
