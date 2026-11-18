import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryEntry, UserStats } from "@/lib/types";

import type { ProfileData } from "./profile-shell";
import { ProfileOverview } from "./overview";
import { ProfileStats } from "./stats";

let data: ProfileData | null = null;

vi.mock("./profile-shell", () => ({
  useProfile: () => data,
}));

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
    updatedAt: "2026-07-01T00:00:00Z",
    ...over,
  };
}

const many = (n: number, over: Partial<LibraryEntry>) =>
  Array.from({ length: n }, (_, i) =>
    entry({ mediaId: i + 1, tmdbId: i + 1, title: `Film ${i + 1}`, ...over })
  );

const STATS: UserStats = {
  kpis: {
    totalFilms: 10,
    totalSeasons: 0,
    episodesWatched: 0,
    daysWatched: 0.8,
    daysPlanned: 0,
    meanScore: 0,
    scoreStddev: 0,
  },
  scoreDistribution: [],
  releaseYears: [],
  watchYears: [],
  genres: [{ name: "Drama", count: 6, meanScore: 0, hours: 12 }],
  formats: [],
  countries: [],
  activity: [],
};

beforeEach(() => {
  window.localStorage.clear();
});
afterEach(() => {
  cleanup();
  data = null;
});

describe("the Stats tab's threshold", () => {
  it("waits for 10 titles and says how many are left", () => {
    data = { entries: many(8, { score: 70 }), taste: [], stats: STATS };
    render(<ProfileStats />);
    expect(screen.getByText("Your stats need more data")).toBeInTheDocument();
    expect(screen.getByText(/Rate or finish 2 more titles/)).toBeInTheDocument();
  });

  it("opens on finished titles with no scores, and claims no mean score", () => {
    data = { entries: many(10, {}), taste: [], stats: STATS };
    render(<ProfileStats />);
    expect(screen.queryByText("Your stats need more data")).toBeNull();
    expect(screen.getByText("Total films")).toBeInTheDocument();
    for (const label of screen.getAllByText("Mean score")) {
      expect(label.previousElementSibling?.textContent).toBe("–");
    }
    expect(screen.queryByText("Score distribution")).toBeNull();
  });
});

describe("the Overview's threshold", () => {
  it("holds back the genre overview below the same threshold", () => {
    data = { entries: many(8, { score: 70 }), taste: [], stats: STATS };
    render(<ProfileOverview />);
    expect(screen.queryByText("Genre overview")).toBeNull();
    expect(screen.getByText(/Rate or finish 2 more titles/)).toBeInTheDocument();
  });

  it("shows the genre overview once Stats opens", () => {
    data = { entries: many(10, {}), taste: [], stats: STATS };
    render(<ProfileOverview />);
    expect(screen.getByText("Genre overview")).toBeInTheDocument();
    expect(screen.queryByText(/more titles? and your stats/)).toBeNull();
  });
});
