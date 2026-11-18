import { describe, expect, it } from "vitest";

import type { LibraryEntry } from "@/lib/types";

import {
  STATS_MIN_TITLES,
  statsProgress,
  statsTitleCount,
} from "./stats-threshold";

function entry(over: Partial<LibraryEntry>): LibraryEntry {
  return {
    mediaId: 1,
    mediaType: "movie",
    tmdbId: 1,
    title: "A film",
    posterPath: null,
    year: 2020,
    status: "planning",
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
  Array.from({ length: n }, (_, i) => entry({ mediaId: i + 1, ...over }));

describe("the stats threshold", () => {
  it("is 10 titles", () => {
    expect(STATS_MIN_TITLES).toBe(10);
  });

  it("counts rated titles and finished ones, scored or not", () => {
    const entries = [
      entry({ mediaId: 1, score: 80, status: "watching" }),
      entry({ mediaId: 2, status: "completed" }),
      entry({ mediaId: 3, status: "completed", score: 40 }),
      entry({ mediaId: 4, status: "planning" }),
      entry({ mediaId: 5, status: "dropped" }),
    ];
    expect(statsTitleCount(entries)).toBe(3);
  });

  it("opens once onboarding answers fill the library, with no scores", () => {
    expect(statsProgress(many(10, { status: "completed" }))).toEqual({
      unlocked: true,
      remaining: 0,
    });
  });

  it("says how many titles are left before it opens", () => {
    expect(statsProgress(many(8, { score: 70 }))).toEqual({
      unlocked: false,
      remaining: 2,
    });
    expect(statsProgress([])).toEqual({ unlocked: false, remaining: 10 });
  });
});
