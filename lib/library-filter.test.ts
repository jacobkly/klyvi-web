import { describe, expect, it } from "vitest";

import { filterLibrary, sortLibrary, type LibraryFilters } from "./library-filter";
import type { LibraryEntry } from "./types";

function entry(over: Partial<LibraryEntry>): LibraryEntry {
  return {
    mediaId: 1,
    mediaType: "movie",
    tmdbId: 1,
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

const entries: LibraryEntry[] = [
  entry({ mediaId: 1, title: "Parasite", status: "completed", score: 95, year: 2019 }),
  entry({ mediaId: 2, title: "Whiplash", status: "completed", score: 88, year: 2014 }),
  entry({
    mediaId: 3,
    title: "Severance",
    mediaType: "season",
    seasonNumber: 1,
    status: "watching",
    score: null,
    progress: 7,
    progressTotal: 9,
    year: 2022,
    updatedAt: "2026-07-20T00:00:00Z",
  }),
  entry({ mediaId: 4, title: "Dune", status: "planning", score: null, year: 2021 }),
  entry({ mediaId: 5, title: "The Idol", status: "dropped", score: 20, year: 2023 }),
];

const none: LibraryFilters = { status: "all", type: "all", query: "" };

describe("filterLibrary", () => {
  it("passes everything through with no filters", () => {
    expect(filterLibrary(entries, none)).toHaveLength(5);
  });

  it("filters by status", () => {
    const out = filterLibrary(entries, { ...none, status: "completed" });
    expect(out.map((e) => e.title)).toEqual(["Parasite", "Whiplash"]);
  });

  it("filters by type", () => {
    const tv = filterLibrary(entries, { ...none, type: "season" });
    expect(tv.map((e) => e.title)).toEqual(["Severance"]);
    const films = filterLibrary(entries, { ...none, type: "movie" });
    expect(films).toHaveLength(4);
  });

  it("matches the query case-insensitively on the title", () => {
    const out = filterLibrary(entries, { ...none, query: "sever" });
    expect(out.map((e) => e.title)).toEqual(["Severance"]);
  });

  it("combines filters", () => {
    const out = filterLibrary(entries, {
      status: "completed",
      type: "movie",
      query: "whip",
    });
    expect(out.map((e) => e.title)).toEqual(["Whiplash"]);
  });
});

describe("sortLibrary", () => {
  it("sorts by title ascending", () => {
    const out = sortLibrary(entries, "title", "asc");
    expect(out[0].title).toBe("Dune");
    expect(out.at(-1)?.title).toBe("Whiplash");
  });

  it("sorts by score descending with unrated last", () => {
    const out = sortLibrary(entries, "score", "desc");
    expect(out[0].title).toBe("Parasite");
    expect(out.at(-1)?.score).toBeNull();
  });

  it("sorts by last updated descending", () => {
    const out = sortLibrary(entries, "updated", "desc");
    expect(out[0].title).toBe("Severance");
  });

  it("does not mutate the input", () => {
    const before = entries.map((e) => e.mediaId);
    sortLibrary(entries, "title", "asc");
    expect(entries.map((e) => e.mediaId)).toEqual(before);
  });
});
