import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BrowseCategory } from "@/lib/browse-categories";
import type { MediaSummary } from "@/lib/types";

import { BrowseClient } from "./browse-client";

const getMovieList = vi.fn();
vi.mock("@/lib/api/catalog", () => ({
  getMovieList: (...a: unknown[]) => getMovieList(...a),
  getTvList: vi.fn(),
}));

const CATEGORY: BrowseCategory = {
  slug: "popular-films",
  title: "Popular films",
  kind: "movie",
  type: "popular",
};

function media(id: number): MediaSummary {
  return {
    mediaId: 0,
    mediaType: "movie",
    tmdbId: id,
    title: `Film ${id}`,
    posterPath: null,
    year: 2024,
  };
}

describe("BrowseClient", () => {
  beforeEach(() => getMovieList.mockReset());

  it("renders the first page and appends only fresh items from the next", async () => {
    const pageOne = [media(1), media(2), media(3)];
    // Page 2 overlaps page 1: only the genuinely new film may append.
    const pageTwo = [media(3), media(4)];
    getMovieList
      .mockResolvedValueOnce(pageOne)
      .mockResolvedValueOnce(pageTwo);

    const user = userEvent.setup();
    render(<BrowseClient category={CATEGORY} />);

    expect(await screen.findByText("Film 1")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Load more" }));

    expect(await screen.findByText("Film 4")).toBeInTheDocument();
    expect(screen.getAllByText("Film 3")).toHaveLength(1);
    expect(getMovieList).toHaveBeenLastCalledWith(
      "popular",
      undefined,
      2
    );
  });

  it("ends quietly when a page adds nothing new (today's pinned backend)", async () => {
    const pageOne = [media(1), media(2)];
    getMovieList
      .mockResolvedValueOnce(pageOne)
      // The backend pins page 1, so page 2 returns the same list.
      .mockResolvedValueOnce(pageOne);

    const user = userEvent.setup();
    render(<BrowseClient category={CATEGORY} />);

    await screen.findByText("Film 1");
    await user.click(screen.getByRole("button", { name: "Load more" }));

    expect(
      await screen.findByText("That is the whole list for now.")
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Load more" })
    ).not.toBeInTheDocument();
  });

  it("shows the error state with retry when the first page fails", async () => {
    getMovieList
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce([media(9)]);

    const user = userEvent.setup();
    render(<BrowseClient category={CATEGORY} />);

    await user.click(
      await screen.findByRole("button", { name: "Try again" })
    );
    expect(await screen.findByText("Film 9")).toBeInTheDocument();
  });
});
