import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { LibraryEntry, UserStats } from "@/lib/types";

import type { ProfileData } from "./profile-shell";
import { ProfileStats } from "./stats";

let data: ProfileData | null = null;

vi.mock("./profile-shell", () => ({
  useProfile: () => data,
}));

const entries: LibraryEntry[] = Array.from({ length: 10 }, (_, i) => ({
  mediaId: i + 1,
  mediaType: "movie",
  tmdbId: i + 1,
  title: `Film ${i + 1}`,
  posterPath: null,
  year: 2020,
  status: "completed",
  score: 80,
  progress: null,
  progressTotal: null,
  notes: null,
  favorite: false,
  updatedAt: "2026-07-01T00:00:00Z",
}));

function stats(over: Partial<UserStats> = {}): UserStats {
  return {
    kpis: {
      totalFilms: 10,
      totalSeasons: 2,
      episodesWatched: 16,
      daysWatched: 0.8,
      daysPlanned: 0,
      meanScore: 80,
      scoreStddev: 0,
    },
    scoreDistribution: [],
    releaseYears: [],
    watchYears: [{ year: 2026, titles: 10, hours: 20 }],
    genres: [{ name: "Drama", count: 6, meanScore: 80, hours: 9.233333333333333 }],
    formats: [
      { label: "movie", pct: 83 },
      { label: "season", pct: 17 },
    ],
    countries: [
      { label: "US", pct: 70 },
      { label: "KR", pct: 30 },
    ],
    activity: [],
    ...over,
  };
}

afterEach(() => {
  cleanup();
  data = null;
});

describe("ProfileStats (U.18)", () => {
  it("prints a genre's hours as hours and minutes (#55)", () => {
    data = { entries, taste: [], stats: stats() };
    render(<ProfileStats />);
    expect(screen.getByText("9h 14m")).toBeInTheDocument();
    expect(screen.queryByText(/9\.23/)).toBeNull();
  });

  it("shows a dash, not 0.0, for a genre with nothing scored", () => {
    data = {
      entries,
      taste: [],
      stats: stats({
        genres: [
          { name: "Drama", count: 6, meanScore: 80, hours: 9 },
          { name: "War & Politics", count: 1, meanScore: null, hours: 0 },
        ],
      }),
    };
    render(<ProfileStats />);
    const card = screen.getByText("War & Politics").closest("div.rounded-lg");
    expect(card).not.toBeNull();
    expect(within(card as HTMLElement).getByText("–")).toBeInTheDocument();
    expect(within(card as HTMLElement).queryByText("0.0")).toBeNull();
  });

  it("holds Watch year back until there are two years (#57)", () => {
    data = { entries, taste: [], stats: stats() };
    render(<ProfileStats />);
    expect(screen.queryByText("Watch year")).toBeNull();
  });

  it("titles Watch year above its chart once there are two years (#57)", () => {
    data = {
      entries,
      taste: [],
      stats: stats({
        watchYears: [
          { year: 2025, titles: 4, hours: 8 },
          { year: 2026, titles: 6, hours: 12 },
        ],
      }),
    };
    render(<ProfileStats />);
    const section = screen.getByRole("region", { name: "Watch year" });
    const header = within(section).getByRole("heading", { name: "Watch year" });
    expect(section.firstElementChild?.contains(header)).toBe(true);
    expect(section.firstElementChild?.querySelector("[data-chart]")).toBeNull();
  });

  it("names the formats and countries (#58)", () => {
    data = { entries, taste: [], stats: stats() };
    render(<ProfileStats />);
    expect(screen.getByText("Movies")).toBeInTheDocument();
    expect(screen.getByText("TV seasons")).toBeInTheDocument();
    expect(screen.getByText("United States")).toBeInTheDocument();
    expect(screen.getByText("South Korea")).toBeInTheDocument();
    expect(screen.queryByText("movie")).toBeNull();
  });

  it("waits with a skeleton shaped like the page (#62)", () => {
    data = { entries, taste: [], stats: undefined };
    render(<ProfileStats />);
    const loading = screen.getByRole("status", { name: "Loading your stats" });
    expect(loading.querySelectorAll("[data-skeleton='chart']")).toHaveLength(2);
    expect(loading.querySelectorAll("[data-skeleton='genre']").length).toBeGreaterThan(0);
  });
});
