import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Scored } from "@/lib/types";

import { FindClient } from "./find-client";

const getFeed = vi.fn();
const getMovie = vi.fn();

vi.mock("@/lib/api/reco", () => ({
  getFeed: (...a: unknown[]) => getFeed(...a),
}));
vi.mock("@/lib/api/catalog", () => ({
  getMovie: (...a: unknown[]) => getMovie(...a),
}));
vi.mock("@/lib/api/interactions", () => ({
  listInteractions: vi.fn(() => Promise.resolve([])),
  recordInteraction: vi.fn(() => Promise.resolve()),
}));
vi.mock("@/lib/api/tracking", () => ({
  addTracking: vi.fn(() => Promise.resolve()),
}));
vi.mock("@/lib/interactions-batch", () => ({ queueSignal: vi.fn() }));
vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => ({ user: { id: "u1" } }),
}));

function pick(over: Partial<Scored>): Scored {
  return {
    mediaId: 1,
    mediaType: "movie",
    tmdbId: 1,
    title: "Untitled",
    posterPath: null,
    backdropPath: null,
    year: 2010,
    voteAverage: 7.5,
    overview: null,
    runtime: null,
    genres: [],
    reasons: [],
    ...over,
  };
}

const FEED: Scored[] = [
  pick({
    mediaId: 1,
    tmdbId: 11423,
    title: "Memories of Murder",
    runtime: 131,
    genres: ["Crime", "Drama"],
    overview: "Two detectives hunt a killer in rural Korea.",
  }),
  pick({
    mediaId: 2,
    tmdbId: 496243,
    title: "Parasite",
    runtime: 133,
    genres: ["Comedy", "Thriller", "Drama"],
  }),
  pick({
    mediaId: 3,
    tmdbId: 1018,
    title: "Mulholland Drive",
    runtime: 147,
    genres: ["Mystery", "Drama"],
  }),
  pick({
    mediaId: 4,
    tmdbId: 598,
    title: "City of God",
    runtime: 118,
    genres: ["Crime", "Drama"],
  }),
];

describe("FindClient", () => {
  beforeEach(() => {
    getFeed.mockReset().mockResolvedValue(FEED);
    getMovie.mockReset().mockResolvedValue(null);
  });

  it("shows the pick's synopsis, genres, and runtime straight from the feed", async () => {
    render(<FindClient />);
    fireEvent.click(screen.getByRole("button", { name: /Find something/ }));

    expect(
      await screen.findByText("Two detectives hunt a killer in rural Korea.")
    ).toBeInTheDocument();
    expect(screen.getByText(/Crime · Drama/)).toBeInTheDocument();
    expect(getMovie).not.toHaveBeenCalled();
  });

  it("filters a mood with one feed request and no per-pick lookups", async () => {
    render(<FindClient />);
    fireEvent.click(screen.getByRole("button", { name: "Under 2 hours" }));
    fireEvent.click(screen.getByRole("button", { name: /Find something/ }));

    expect(
      await screen.findByRole("heading", { name: "City of God" })
    ).toBeInTheDocument();
    // Only the 118-minute film fits, so the set is a single pick.
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /^Your pick for/
    );
    expect(getFeed).toHaveBeenCalledTimes(1);
    expect(getMovie).not.toHaveBeenCalled();
  });

  it("reads the slow-burn lens from the feed's genres and reasons", async () => {
    getFeed.mockResolvedValue([
      pick({
        mediaId: 5,
        tmdbId: 155,
        title: "The Dark Knight",
        genres: ["Action", "Drama"],
        reasons: [{ kind: "keyword", id: 9826, name: "slow burn" }],
      }),
      pick({
        mediaId: 6,
        tmdbId: 562,
        title: "Die Hard",
        genres: ["Action", "Thriller"],
      }),
    ]);
    render(<FindClient />);
    fireEvent.click(screen.getByRole("button", { name: "Slow burn" }));
    fireEvent.click(screen.getByRole("button", { name: /Find something/ }));

    expect(
      await screen.findByRole("heading", { name: "The Dark Knight" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Die Hard" })).toBeNull();
    expect(getMovie).not.toHaveBeenCalled();
  });
});
