import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryEntry, Scored } from "@/lib/types";

import { HomeClient } from "./home-client";

const getFeed = vi.fn();
const listTracking = vi.fn();
const listInteractions = vi.fn();

vi.mock("@/lib/api/reco", () => ({
  getFeed: (...a: unknown[]) => getFeed(...a),
}));
vi.mock("@/lib/api/tracking", () => ({
  listTracking: (...a: unknown[]) => listTracking(...a),
}));
vi.mock("@/lib/api/interactions", () => ({
  listInteractions: (...a: unknown[]) => listInteractions(...a),
}));
vi.mock("@/lib/interactions-batch", () => ({ queueSignal: vi.fn() }));
vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => ({ profile: null }),
}));

function entry(over: Partial<LibraryEntry>): LibraryEntry {
  return {
    mediaId: 1,
    mediaType: "season",
    tmdbId: 95396,
    title: "Severance",
    posterPath: null,
    year: 2022,
    seasonNumber: 2,
    status: "watching",
    score: null,
    progress: 4,
    progressTotal: null,
    notes: null,
    favorite: false,
    updatedAt: "2026-09-01T00:00:00Z",
    ...over,
  };
}

function pick(over: Partial<Scored>): Scored {
  return {
    mediaId: 7,
    mediaType: "movie",
    tmdbId: 496243,
    title: "Parasite",
    posterPath: null,
    backdropPath: null,
    year: 2019,
    voteAverage: 8.5,
    overview: null,
    runtime: null,
    genres: [],
    reasons: [],
    ...over,
  };
}

/** A request that never lands, standing in for a slow feed. */
const pending = () => new Promise<never>(() => {});

describe("HomeClient", () => {
  beforeEach(() => {
    getFeed.mockReset().mockResolvedValue([]);
    listTracking.mockReset().mockResolvedValue([]);
    listInteractions.mockReset().mockResolvedValue([]);
    window.localStorage.clear();
  });

  it("paints the library sections while the feed is still loading", async () => {
    getFeed.mockImplementation(pending);
    listTracking.mockResolvedValue([entry({})]);
    render(<HomeClient />);

    // Continue watching and the activity line both carry the title.
    expect(await screen.findAllByText(/Severance/)).not.toHaveLength(0);
    expect(
      screen.getByRole("heading", { name: "Your top picks" })
    ).toBeInTheDocument();
    // The picks are still loading, so neither their empty nor error copy
    // has been written yet.
    expect(screen.queryByText(/Nothing to pick from yet/)).toBeNull();
    expect(screen.queryByText(/Could not load your picks/)).toBeNull();
  });

  it("keeps the picks when the library fails", async () => {
    getFeed.mockResolvedValue([pick({})]);
    listTracking.mockRejectedValue(new Error("boom"));
    render(<HomeClient />);

    expect(await screen.findByText("Parasite")).toBeInTheDocument();
    expect(
      screen.getByText("Could not load your library right now.")
    ).toBeInTheDocument();
  });

  it("offers a retry only when both pillars are down", async () => {
    getFeed.mockRejectedValueOnce(new Error("boom"));
    listTracking.mockRejectedValueOnce(new Error("boom"));
    listTracking.mockResolvedValueOnce([entry({})]);
    render(<HomeClient />);

    const retry = await screen.findByRole("button", { name: "Try again" });
    retry.click();
    expect(await screen.findAllByText(/Severance/)).not.toHaveLength(0);
    expect(getFeed).toHaveBeenCalledTimes(2);
    expect(listTracking).toHaveBeenCalledTimes(2);
  });
});
