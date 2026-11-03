import { describe, expect, it } from "vitest";

import { mediaHref } from "./media-href";

describe("mediaHref", () => {
  it("links a film to its film page", () => {
    expect(mediaHref({ mediaType: "movie", tmdbId: 496243 })).toBe(
      "/movie/496243"
    );
  });

  it("links a series to its series page, never a film page", () => {
    expect(mediaHref({ mediaType: "tv", tmdbId: 1399 })).toBe("/tv/1399");
  });

  it("links a season to its season page under the series", () => {
    expect(
      mediaHref({ mediaType: "season", tmdbId: 95396, seasonNumber: 2 })
    ).toBe("/tv/95396/season/2");
  });

  it("falls back to season 1 when a season has no number", () => {
    expect(mediaHref({ mediaType: "season", tmdbId: 95396 })).toBe(
      "/tv/95396/season/1"
    );
  });
});
