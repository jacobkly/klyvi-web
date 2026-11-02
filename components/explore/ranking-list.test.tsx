import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Ranking } from "@/lib/types";

import { RankingList } from "./ranking-list";

const getRankings = vi.fn();
vi.mock("@/lib/api/catalog", () => ({
  getRankings: (...a: unknown[]) => getRankings(...a),
}));

function ranking(rank: number, title: string): Ranking {
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

describe("RankingList", () => {
  beforeEach(() => {
    getRankings.mockReset();
  });

  it("shows only the first rows when a limit is set", async () => {
    getRankings.mockResolvedValue([
      ranking(1, "Parasite"),
      ranking(2, "Whiplash"),
      ranking(3, "Dune"),
    ]);
    render(<RankingList kind="movies" limit={2} />);

    expect(await screen.findByText("Parasite")).toBeInTheDocument();
    expect(screen.getByText("Whiplash")).toBeInTheDocument();
    expect(screen.queryByText("Dune")).toBeNull();
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
