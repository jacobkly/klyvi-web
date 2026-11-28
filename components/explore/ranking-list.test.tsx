import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { writePref } from "@/lib/local-prefs";
import type { Ranking, Watched } from "@/lib/types";

const getRankings = vi.fn();
vi.mock("@/lib/api/catalog", () => ({
  getRankings: (...a: unknown[]) => getRankings(...a),
  RANKING_PAGE_SIZE: 100,
  // Two, not ten, so the last page is reached without rendering 1,000 rows.
  RANKING_MAX_PAGE: 2,
}));

const session = vi.hoisted(() => ({
  user: null as { id: string } | null,
  loading: false,
}));
vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => session,
}));

const seen = vi.hoisted(() => ({
  value: { movies: new Set<number>(), tv: new Set<number>() } as Watched,
}));
vi.mock("@/components/klyvi/watched-provider", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/klyvi/watched-provider")>()),
  useWatched: () => seen.value,
}));

import { RankingList } from "./ranking-list";

function ranking(rank: number, title = `Title ${rank}`): Ranking {
  return {
    rank,
    tmdbId: rank * 10,
    mediaId: null,
    title,
    year: 2019,
    posterPath: null,
    genres: [],
    score: 8.5,
  };
}

/** Ranks from..to, one page of a top list. */
function ranks(from: number, to: number): Ranking[] {
  const out: Ranking[] = [];
  for (let r = from; r <= to; r++) out.push(ranking(r));
  return out;
}

describe("RankingList", () => {
  beforeEach(() => {
    getRankings.mockReset();
    window.localStorage.clear();
    session.user = null;
    seen.value = { movies: new Set(), tv: new Set() };
  });

  it("shows only the first rows when a limit is set, with no paging", async () => {
    getRankings.mockResolvedValue([
      ranking(1, "Parasite"),
      ranking(2, "Whiplash"),
      ranking(3, "Dune"),
    ]);
    render(<RankingList kind="movies" limit={2} />);

    expect(await screen.findByText("Parasite")).toBeInTheDocument();
    expect(screen.getByText("Whiplash")).toBeInTheDocument();
    expect(screen.queryByText("Dune")).toBeNull();
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });

  it("asks for the ranking without anime by default, with it when let in", async () => {
    getRankings.mockResolvedValue([ranking(1, "Parasite")]);
    const { unmount } = render(<RankingList kind="tv" limit={10} />);
    await screen.findByText("Parasite");
    expect(getRankings).toHaveBeenLastCalledWith("tv", expect.any(AbortSignal), {
      anime: false,
      page: 1,
    });
    unmount();

    writePref("browseFilters", { watched: "show", anime: true });
    render(<RankingList kind="tv" limit={10} />);
    await screen.findByText("Parasite");
    expect(getRankings).toHaveBeenLastCalledWith("tv", expect.any(AbortSignal), {
      anime: true,
      page: 1,
    });
  });

  it("pages on a hundred at a time and ends at a short page", async () => {
    getRankings.mockResolvedValueOnce(ranks(1, 100)).mockResolvedValueOnce(ranks(101, 150));
    const user = userEvent.setup();
    render(<RankingList kind="movies" />);

    await screen.findByText("Title 1");
    await user.click(screen.getByRole("button", { name: "Load more" }));

    expect(await screen.findByText("Title 150")).toBeInTheDocument();
    expect(getRankings).toHaveBeenLastCalledWith("movies", undefined, {
      anime: false,
      page: 2,
    });
    expect(screen.getByText("That is the whole list.")).toBeInTheDocument();
  });

  it("stops at the last page even when it is full", async () => {
    getRankings.mockResolvedValueOnce(ranks(1, 100)).mockResolvedValueOnce(ranks(101, 200));
    const user = userEvent.setup();
    render(<RankingList kind="movies" />);

    await screen.findByText("Title 1");
    await user.click(screen.getByRole("button", { name: "Load more" }));

    expect(await screen.findByText("Title 200")).toBeInTheDocument();
    expect(screen.getByText("That is the whole list.")).toBeInTheDocument();
    expect(getRankings).toHaveBeenCalledTimes(2);
  });

  it("hides watched titles on the full list", async () => {
    session.user = { id: "u1" };
    seen.value = { movies: new Set([10]), tv: new Set() };
    writePref("browseFilters", { watched: "hide", anime: false });
    getRankings.mockResolvedValue([ranking(1, "Parasite"), ranking(2, "Whiplash")]);
    render(<RankingList kind="movies" />);

    expect(await screen.findByText("Whiplash")).toBeInTheDocument();
    expect(screen.queryByText("Parasite")).toBeNull();
  });

  it("keeps watched titles in the preview, marked", async () => {
    session.user = { id: "u1" };
    seen.value = { movies: new Set([10]), tv: new Set() };
    writePref("browseFilters", { watched: "hide", anime: false });
    getRankings.mockResolvedValue([ranking(1, "Parasite"), ranking(2, "Whiplash")]);
    render(<RankingList kind="movies" limit={10} />);

    expect(await screen.findByText("Parasite")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "Watched" })).toHaveLength(1);
  });

  it("offers a retry that refetches after a failure", async () => {
    getRankings
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce([ranking(1, "Parasite")]);
    render(<RankingList kind="tv" />);

    await userEvent.click(
      await screen.findByRole("button", { name: "Try again" })
    );
    expect(await screen.findByText("Parasite")).toBeInTheDocument();
    expect(getRankings).toHaveBeenCalledTimes(2);
  });
});
