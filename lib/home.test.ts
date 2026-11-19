import { describe, expect, it } from "vitest";

import type { LibraryEntry, Scored } from "@/lib/types";

import {
  activityLine,
  comingUp,
  greetingName,
  heroStart,
  reasonRails,
  tasteKeywords,
} from "./home";

function entry(over: Partial<LibraryEntry>): LibraryEntry {
  return {
    mediaId: 1,
    mediaType: "movie",
    tmdbId: 1,
    title: "Dune",
    posterPath: null,
    year: 2021,
    status: "planning",
    score: null,
    progress: null,
    progressTotal: null,
    notes: null,
    favorite: false,
    updatedAt: "2026-11-01T00:00:00Z",
    ...over,
  };
}

function pick(id: number, reasons: Scored["reasons"] = []): Scored {
  return {
    mediaId: id,
    mediaType: "movie",
    tmdbId: id,
    title: `Film ${id}`,
    posterPath: null,
    backdropPath: null,
    year: 2020,
    voteAverage: null,
    overview: null,
    runtime: null,
    seasonCount: null,
    genres: [],
    reasons,
  };
}

describe("greetingName", () => {
  it("uses the display name from the account when there is one", () => {
    expect(
      greetingName({ username: "jacob_k" }, { full_name: "Jacob Klymenko" })
    ).toBe("Jacob");
  });

  it("uses a chosen username when there is no display name", () => {
    expect(greetingName({ username: "jacob_k" }, {})).toBe("jacob_k");
  });

  it("says no name rather than a generated handle", () => {
    expect(greetingName({ username: "user_3f9a0c12" }, null)).toBeNull();
  });

  it("says no name before the profile has loaded", () => {
    expect(greetingName(null, null)).toBeNull();
  });
});

describe("heroStart", () => {
  it("moves one pick along on each visit, within the top few", () => {
    expect([0, 1, 2, 3, 4, 5].map((turn) => heroStart(turn, 10))).toEqual([
      0, 1, 2, 3, 0, 1,
    ]);
  });

  it("stays within a short feed", () => {
    expect(heroStart(5, 2)).toBe(1);
    expect(heroStart(5, 0)).toBe(0);
  });
});

describe("reasonRails", () => {
  const knight = { kind: "because" as const, id: 155, name: "The Dark Knight" };
  const heat = { kind: "because" as const, id: 949, name: "Heat" };

  it("groups picks that share a title they were picked because of", () => {
    const picks = [
      pick(1, [knight]),
      pick(2, [heat]),
      pick(3, [knight]),
      pick(4, [knight, heat]),
      pick(5, [heat]),
    ];
    const rails = reasonRails(picks, { min: 3 });
    expect(rails.map((r) => r.title)).toEqual([
      "Because you liked The Dark Knight",
      "Because you liked Heat",
    ]);
    expect(rails[0].picks.map((p) => p.mediaId)).toEqual([1, 3, 4]);
  });

  it("leaves out a reason with too few picks for a row", () => {
    expect(reasonRails([pick(1, [knight]), pick(2, [knight])], { min: 3 })).toEqual([]);
  });

  it("ignores genres and unnamed reasons", () => {
    const drama = { kind: "genre" as const, id: 18, name: "Drama" };
    const nameless = { kind: "because" as const, id: 7 };
    const picks = [1, 2, 3].map((i) => pick(i, [drama, nameless]));
    expect(reasonRails(picks, { min: 3 })).toEqual([]);
  });

  it("keeps to the most rails asked for", () => {
    const picks = [1, 2, 3, 4, 5, 6].map((i) =>
      pick(i, [knight, heat, { kind: "because", id: 680, name: "Pulp Fiction" }])
    );
    expect(reasonRails(picks, { min: 3, max: 2 })).toHaveLength(2);
  });
});

describe("tasteKeywords", () => {
  it("keeps the keywords that recur across the picks, most common first", () => {
    const heist = { kind: "keyword" as const, id: 1, name: "heist" };
    const noir = { kind: "keyword" as const, id: 2, name: "neo-noir" };
    const drama = { kind: "genre" as const, id: 18, name: "Drama" };
    const picks = [
      pick(1, [noir, drama]),
      pick(2, [heist, noir]),
      pick(3, [heist]),
      pick(4, [noir]),
    ];
    expect(tasteKeywords(picks).map((r) => r.name)).toEqual(["neo-noir", "heist"]);
  });

  it("leaves out a keyword that turns up only once", () => {
    expect(
      tasteKeywords([pick(1, [{ kind: "keyword", id: 1, name: "heist" }])])
    ).toEqual([]);
  });
});

describe("comingUp", () => {
  const now = new Date("2026-11-18T12:00:00Z");

  it("lists only planned titles with a date still ahead, soonest first", () => {
    const rows = comingUp(
      [
        entry({ mediaId: 1, title: "Later", releaseDate: "2027-03-05" }),
        entry({ mediaId: 2, title: "Undated", releaseDate: null }),
        entry({ mediaId: 3, title: "Out already", releaseDate: "2024-01-01" }),
        entry({ mediaId: 4, title: "Soon", releaseDate: "2026-12-16" }),
        entry({
          mediaId: 5,
          title: "Watching",
          status: "watching",
          releaseDate: "2026-12-01",
        }),
      ],
      now
    );
    expect(rows.map((r) => [r.entry.title, r.label])).toEqual([
      ["Soon", "Out 16 December"],
      ["Later", "Out 5 March 2027"],
    ]);
  });
});

describe("activityLine", () => {
  it("names the score you gave", () => {
    expect(activityLine(entry({ status: "completed", score: 95 }))).toEqual({
      lead: "You rated",
      tail: "",
      score: 95,
    });
  });

  it("says what changed when there is no score", () => {
    expect(activityLine(entry({ status: "planning" }))).toEqual({
      lead: "You added",
      tail: "to your watchlist",
      score: null,
    });
    expect(activityLine(entry({ status: "watching" })).lead).toBe("You started");
    expect(activityLine(entry({ status: "completed" })).lead).toBe("You finished");
    expect(activityLine(entry({ status: "dropped" })).lead).toBe("You dropped");
  });
});
