import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryEntry } from "@/lib/types";

import { ProfileShell, useProfile } from "./profile-shell";

const getMe = vi.fn();
const listTracking = vi.fn();
const getFeed = vi.fn();
const getMovie = vi.fn();

vi.mock("@/lib/api/users", () => ({
  getMe: (...a: unknown[]) => getMe(...a),
}));
vi.mock("@/lib/api/tracking", () => ({
  listTracking: (...a: unknown[]) => listTracking(...a),
}));
vi.mock("@/lib/api/reco", () => ({
  getFeed: (...a: unknown[]) => getFeed(...a),
}));
vi.mock("@/lib/api/catalog", () => ({
  getMovie: (...a: unknown[]) => getMovie(...a),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/profile",
}));

function entry(over: Partial<LibraryEntry>): LibraryEntry {
  return {
    mediaId: 1,
    mediaType: "movie",
    tmdbId: 496243,
    title: "Parasite",
    posterPath: null,
    year: 2019,
    status: "completed",
    score: 95,
    progress: null,
    progressTotal: null,
    notes: null,
    favorite: false,
    updatedAt: "2026-07-01T00:00:00Z",
    ...over,
  };
}

function Probe() {
  const data = useProfile();
  return <p>context entries: {data ? data.entries.length : "none"}</p>;
}

describe("ProfileShell", () => {
  beforeEach(() => {
    getMe.mockReset().mockResolvedValue({
      id: "u1",
      username: "jacob",
      usernameChangedAt: null,
      bio: null,
      avatarUrl: null,
      createdAt: "2026-01-01T00:00:00Z",
    });
    listTracking.mockReset().mockResolvedValue([entry({})]);
    getFeed.mockReset().mockResolvedValue([]);
    getMovie.mockReset().mockResolvedValue(null);
    window.localStorage.clear();
  });

  it("renders identity, both tabs, and provides data to children", async () => {
    render(
      <ProfileShell>
        <Probe />
      </ProfileShell>
    );

    expect(await screen.findByText("jacob")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "href",
      "/profile"
    );
    expect(screen.getByRole("link", { name: "Stats" })).toHaveAttribute(
      "href",
      "/profile/stats"
    );
    expect(screen.getByText("context entries: 1")).toBeInTheDocument();
    // Overview is the current route, so it is marked current.
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("asks the catalog for the highest-rated film's backdrop", async () => {
    listTracking.mockResolvedValue([
      entry({ mediaId: 1, tmdbId: 100, score: 80 }),
      entry({ mediaId: 2, tmdbId: 200, score: 97 }),
    ]);
    render(
      <ProfileShell>
        <Probe />
      </ProfileShell>
    );
    await screen.findByText("jacob");
    expect(getMovie).toHaveBeenCalledWith(200);
  });

  it("shows the error state when everything fails", async () => {
    getMe.mockRejectedValue(new Error("boom"));
    listTracking.mockRejectedValue(new Error("boom"));
    getFeed.mockRejectedValue(new Error("boom"));
    render(
      <ProfileShell>
        <Probe />
      </ProfileShell>
    );
    expect(
      await screen.findByText("Could not load your profile.")
    ).toBeInTheDocument();
  });
});
