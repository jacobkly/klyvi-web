import { describe, expect, it } from "vitest";

import { noticeHref, noticeText } from "./notification-text";

const TODAY = new Date(2026, 9, 20);

describe("noticeText", () => {
  it.each([
    ["2026-10-27", "Season 4 premieres Oct 27"],
    ["2026-10-20", "Season 4 premieres today"],
    ["2026-10-15", "Season 4 premiered Oct 15"],
  ])("words a season premiere dated %s", (eventDate, text) => {
    expect(
      noticeText({ kind: "season_premiere", seasonNumber: 4, eventDate }, TODAY)
    ).toBe(text);
  });

  it.each([
    ["2026-10-19", "Film, came out Oct 19"],
    ["2026-10-20", "Film, out today"],
    // The job works in UTC, so for someone west of it a film can still be a
    // day away locally.
    ["2026-10-21", "Film, comes out Oct 21"],
  ])("words a film release dated %s", (eventDate, text) => {
    expect(
      noticeText({ kind: "film_release", seasonNumber: null, eventDate }, TODAY)
    ).toBe(text);
  });

  it("names the year of a date outside this one", () => {
    expect(
      noticeText(
        { kind: "film_release", seasonNumber: null, eventDate: "2025-12-30" },
        new Date(2026, 0, 2)
      )
    ).toBe("Film, came out Dec 30, 2025");
  });

  it("keeps the calendar day whatever the time of day", () => {
    // Parsed as UTC, this date reads as Oct 14 anywhere west of Greenwich.
    expect(
      noticeText(
        { kind: "season_premiere", seasonNumber: 2, eventDate: "2026-10-15" },
        new Date(2026, 9, 15, 23, 30)
      )
    ).toBe("Season 2 premieres today");
  });
});

describe("noticeText for a policy notice", () => {
  it.each([
    ["2026-10-20", "Policy update, today"],
    ["2026-10-02", "Policy update, Oct 2"],
  ])("says when one dated %s was posted", (eventDate, text) => {
    expect(
      noticeText({ kind: "policy", seasonNumber: null, eventDate }, TODAY)
    ).toBe(text);
  });
});

describe("noticeHref", () => {
  it("opens the season for a premiere", () => {
    expect(
      noticeHref({ kind: "season_premiere", tmdbId: 1416, seasonNumber: 23 })
    ).toBe("/tv/1416/season/23");
  });

  it("opens the film for a release", () => {
    expect(
      noticeHref({ kind: "film_release", tmdbId: 791523, seasonNumber: null })
    ).toBe("/movie/791523");
  });

  it("opens the policy page a policy notice names", () => {
    expect(
      noticeHref({ kind: "policy", tmdbId: null, seasonNumber: null, link: "/privacy" })
    ).toBe("/privacy");
  });

  it.each([null, "https://example.com", "//example.com", "terms"])(
    "falls back to the terms for a link that isn't a site path: %s",
    (link) => {
      expect(
        noticeHref({ kind: "policy", tmdbId: null, seasonNumber: null, link })
      ).toBe("/terms");
    }
  );
});
