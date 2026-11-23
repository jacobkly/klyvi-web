import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryEntry } from "@/lib/types";

import type { ProfileData } from "./profile-shell";
import { ProfileOverview } from "./overview";

let data: ProfileData | null = null;
vi.mock("./profile-shell", () => ({ useProfile: () => data }));

function entry(over: Partial<LibraryEntry>): LibraryEntry {
  return {
    mediaId: 1,
    mediaType: "movie",
    tmdbId: 1,
    title: "A film",
    posterPath: null,
    year: 2020,
    status: "completed",
    score: null,
    progress: null,
    progressTotal: null,
    notes: null,
    favorite: false,
    updatedAt: "2026-11-01T00:00:00Z",
    ...over,
  };
}

describe("ProfileOverview lists (U.25)", () => {
  beforeEach(() => window.localStorage.clear());

  it("labels the taste chips as taste, not as a pick's reasons (#74)", () => {
    data = {
      entries: [],
      taste: [{ kind: "keyword", id: 1, name: "slow burn" }],
      stats: null,
    };
    render(<ProfileOverview />);
    expect(screen.getByRole("list", { name: "Taste tags" })).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Why this was picked" })).toBeNull();
  });

  it("names the season in recent activity and links to it (#75)", () => {
    data = {
      entries: [
        entry({
          mediaId: 7,
          mediaType: "season",
          tmdbId: 95396,
          title: "Severance",
          seasonNumber: 2,
          status: "watching",
        }),
      ],
      taste: [],
      stats: null,
    };
    render(<ProfileOverview />);
    const list = screen.getByRole("list", { name: "Recent activity" });
    const link = within(list).getByRole("link", { name: "Watching: Severance Season 2" });
    expect(link).toHaveAttribute("href", "/tv/95396/season/2");
  });

  it("shows favorites, best rated first", () => {
    data = {
      entries: [
        entry({ mediaId: 1, tmdbId: 1, title: "Liked", favorite: true }),
        entry({ mediaId: 2, tmdbId: 2, title: "Loved", favorite: true, score: 95 }),
        entry({ mediaId: 3, tmdbId: 3, title: "Plain" }),
      ],
      taste: [],
      stats: null,
    };
    render(<ProfileOverview />);
    const section = screen
      .getByRole("heading", { name: "Favorites" })
      .closest("section") as HTMLElement;
    const titles = within(section)
      .getAllByRole("link")
      .map((l) => l.getAttribute("href"));
    expect(titles).toContain("/library/favorites");
    expect(titles.indexOf("/movie/2")).toBeLessThan(titles.indexOf("/movie/1"));
    expect(titles).not.toContain("/movie/3");
  });

  it("says how to add one when there are none", () => {
    data = { entries: [entry({})], taste: [], stats: null };
    render(<ProfileOverview />);
    expect(screen.getByText(/Tap the heart/)).toBeInTheDocument();
  });
});
