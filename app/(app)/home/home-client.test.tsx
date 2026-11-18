import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mapTrackingEntry } from "@/lib/api/map";
import { writePref } from "@/lib/local-prefs";
import type { WireTrackingEntry } from "@/lib/api/wire";
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
    seasonCount: null,
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

  it("leaves the statuses switched off in settings out of recent activity", async () => {
    writePref("activityFeed", { planning: false });
    listTracking.mockResolvedValue([
      entry({ mediaId: 1, mediaType: "movie", title: "Dune", status: "planning" }),
      entry({ mediaId: 2, mediaType: "movie", title: "Arrival", status: "completed" }),
    ]);
    render(<HomeClient />);

    const heading = await screen.findByRole("heading", { name: "Recent activity" });
    const section = heading.closest("section")!;
    expect(await within(section).findByText(/Arrival/)).toBeInTheDocument();
    expect(within(section).queryByText(/Dune/)).toBeNull();
  });

  it("shows a season's progress against its episode total", async () => {
    const wire = {
      media_id: 955,
      media_type: "season",
      status: "watching",
      score: null,
      episode_progress: 3,
      notes: null,
      favorite: false,
      updated_at: "2026-09-01T00:00:00Z",
      tmdb_id: 1396,
      title: "Breaking Bad",
      poster_path: "/1yeVJox3rjo2jBKrrihIMj7uoS9.jpg",
      backdrop_path: null,
      release_year: 2008,
      season_number: 1,
      season_name: "Season 1",
      episode_count: 10,
    } as WireTrackingEntry;
    listTracking.mockResolvedValue([
      mapTrackingEntry(wire),
      entry({
        mediaId: 2,
        mediaType: "movie",
        title: "Dune",
        seasonNumber: undefined,
        progress: null,
      }),
    ]);
    render(<HomeClient />);

    expect(await screen.findByText("3 / 10")).toBeInTheDocument();
    // A film has no episodes, so nothing reads as a count out of a total.
    expect(screen.queryAllByText(/^\d+ \/ \d+$/)).toHaveLength(1);
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

  it("links a show pick to its series page, not a film page", async () => {
    getFeed.mockResolvedValue([
      pick({ mediaId: 9, mediaType: "tv", tmdbId: 1399, title: "Game of Thrones" }),
    ]);
    render(<HomeClient />);

    const title = await screen.findByText("Game of Thrones");
    expect(title.closest("a")).toHaveAttribute("href", "/tv/1399");
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

  it("keeps the taste nudge away once dismissed, on later visits too", async () => {
    const nudge = "Klyvi does not know your taste yet";
    const { unmount } = render(<HomeClient />);
    expect(await screen.findByText(nudge)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText(nudge)).toBeNull();
    unmount();

    render(<HomeClient />);
    await expect(
      screen.findByText(nudge, undefined, { timeout: 300 })
    ).rejects.toThrow();
  });
});
