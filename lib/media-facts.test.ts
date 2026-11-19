import { describe, expect, it } from "vitest";

import { MOCK_MOVIE, MOCK_TV } from "@/lib/mock-media";

import {
  byLine,
  formatEpisode,
  formatMoney,
  movieFacts,
  movieStrip,
  seasonFacts,
  tvFacts,
  tvStrip,
} from "./media-facts";

function labels(facts: { label: string }[]) {
  return facts.map((f) => f.label);
}

function value(facts: { label: string; value: unknown }[], label: string) {
  return facts.find((f) => f.label === label)?.value;
}

describe("movieFacts", () => {
  it("shows no budget row for a film with no budget", () => {
    const facts = movieFacts({ ...MOCK_MOVIE, budget: null, revenue: null });
    expect(labels(facts)).not.toContain("Budget");
    expect(labels(facts)).not.toContain("Box office");
  });

  it("dates the release from the API's full timestamp", () => {
    // The API sends "2010-07-15T00:00:00Z", not a bare date.
    const facts = movieFacts({ ...MOCK_MOVIE, releaseDate: "2010-07-15T00:00:00Z" });
    expect(value(facts, "Released")).toBe("15 July 2010");
  });

  it("shows budget and box office when TMDB has them", () => {
    const facts = movieFacts({ ...MOCK_MOVIE, budget: 11_400_000, revenue: 262_133_000 });
    expect(value(facts, "Budget")).toBe("$11.4M");
    expect(value(facts, "Box office")).toBe("$262.1M");
  });

  it("shows the original title only when it differs", () => {
    expect(
      value(movieFacts({ ...MOCK_MOVIE, originalTitle: "기생충" }), "Original title")
    ).toBe("기생충");
    expect(
      labels(movieFacts({ ...MOCK_MOVIE, originalTitle: MOCK_MOVIE.title }))
    ).not.toContain("Original title");
    expect(
      labels(movieFacts({ ...MOCK_MOVIE, originalTitle: null }))
    ).not.toContain("Original title");
  });

  it("names every studio, country and spoken language", () => {
    const facts = movieFacts({
      ...MOCK_MOVIE,
      studios: ["Barunson E&A", "CJ Entertainment"],
      countries: ["South Korea"],
      spokenLanguages: ["Korean", "English"],
    });
    expect(value(facts, "Studios")).toBe("Barunson E&A, CJ Entertainment");
    expect(value(facts, "Country")).toBe("South Korea");
    expect(value(facts, "Spoken languages")).toBe("Korean, English");
  });

  it("links to IMDb and the official site, and drops a link that isn't web", () => {
    const facts = movieFacts({
      ...MOCK_MOVIE,
      imdbId: "tt6751668",
      homepage: "javascript:alert(1)",
    });
    const links = facts.find((f) => f.label === "Links")?.links;
    expect(links).toEqual([
      { label: "IMDb", href: "https://www.imdb.com/title/tt6751668/" },
    ]);
  });

  it("leaves the links row out when there are none", () => {
    const facts = movieFacts({ ...MOCK_MOVIE, imdbId: null, homepage: null });
    expect(labels(facts)).not.toContain("Links");
  });
});

describe("tvFacts", () => {
  it("shows the next episode with its date", () => {
    const facts = tvFacts({
      ...MOCK_TV,
      nextEpisode: { season: 3, episode: 4, airDate: "2026-12-12" },
    });
    expect(value(facts, "Next episode")).toBe("S3 E4 on 12 Dec 2026");
  });

  it("dates the first and last aired from the API's full timestamps", () => {
    const facts = tvFacts({
      ...MOCK_TV,
      firstAirDate: "2022-02-17T00:00:00Z",
      lastAirDate: "2025-03-20T00:00:00Z",
    });
    expect(value(facts, "First aired")).toBe("17 February 2022");
    expect(value(facts, "Last aired")).toBe("20 March 2025");
  });

  it("shows the last episode aired and leaves the next one out when none is due", () => {
    const facts = tvFacts({
      ...MOCK_TV,
      nextEpisode: null,
      lastEpisode: { season: 2, episode: 10, airDate: "2025-03-20" },
    });
    expect(labels(facts)).not.toContain("Next episode");
    expect(value(facts, "Last episode")).toBe("S2 E10 on 20 Mar 2025");
  });

  it("adds networks, type and In production only when true", () => {
    const facts = tvFacts({
      ...MOCK_TV,
      networks: ["Apple TV+"],
      showType: "Scripted",
      inProduction: true,
    });
    expect(value(facts, "Network")).toBe("Apple TV+");
    expect(value(facts, "Type")).toBe("Scripted");
    expect(value(facts, "In production")).toBe("Yes");
    expect(labels(tvFacts({ ...MOCK_TV, inProduction: false }))).not.toContain(
      "In production"
    );
  });

  it("links a series to IMDb and its official site", () => {
    const facts = tvFacts({
      ...MOCK_TV,
      imdbId: "tt11280740",
      homepage: "https://tv.apple.com/show/severance",
    });
    expect(facts.find((f) => f.label === "Links")?.links).toEqual([
      { label: "IMDb", href: "https://www.imdb.com/title/tt11280740/" },
      { label: "Official site", href: "https://tv.apple.com/show/severance" },
    ]);
  });

  it("shows the original name only when it differs", () => {
    expect(
      value(tvFacts({ ...MOCK_TV, originalTitle: "La casa de papel" }), "Original name")
    ).toBe("La casa de papel");
    expect(
      labels(tvFacts({ ...MOCK_TV, originalTitle: MOCK_TV.title }))
    ).not.toContain("Original name");
  });
});

describe("the phone strip", () => {
  it("gives a film its runtime and average (the year is already beside the title)", () => {
    expect(movieStrip(MOCK_MOVIE)).toEqual(["2h 12m", "85 average"]);
  });

  it("gives a series its seasons and average, skipping what's missing", () => {
    expect(tvStrip(MOCK_TV)).toEqual(["2 seasons", "83 average"]);
    expect(tvStrip({ ...MOCK_TV, voteAverage: null })).toEqual(["2 seasons"]);
  });
});

describe("byLine", () => {
  it("puts the writers beside the director", () => {
    expect(byLine("Directed by", ["Bong Joon Ho"], ["Bong Joon Ho", "Han Jin-won"])).toBe(
      "Directed by Bong Joon Ho. Written by Bong Joon Ho, Han Jin-won"
    );
  });

  it("says it once when the director wrote it alone", () => {
    expect(byLine("Directed by", ["Christopher Nolan"], ["Christopher Nolan"])).toBe(
      "Written and directed by Christopher Nolan"
    );
  });

  it("is null with nobody to name", () => {
    expect(byLine("Directed by", [], [])).toBeNull();
    expect(byLine("Created by", ["Dan Erickson"])).toBe("Created by Dan Erickson");
  });
});

describe("formatters", () => {
  it("formats money compactly", () => {
    expect(formatMoney(160_000_000)).toBe("$160M");
    expect(formatMoney(836_836_967)).toBe("$836.8M");
    expect(formatMoney(2_923_706_026)).toBe("$2.9B");
    expect(formatMoney(null)).toBeNull();
  });

  it("formats an episode without a date as just its number", () => {
    expect(formatEpisode({ season: 1, episode: 2, airDate: null })).toBe("S1 E2");
  });
});

describe("seasonFacts", () => {
  const season = {
    seasonNumber: 2,
    name: "Season 2",
    overview: null,
    posterPath: null,
    year: 2025,
    airDate: "2025-01-17T00:00:00Z",
    episodeCount: 10,
    voteAverage: 8.4,
    episodes: [],
  };

  it("dates the season, not the series", () => {
    const facts = seasonFacts(
      { ...MOCK_TV, firstAirDate: "2022-02-17T00:00:00Z" },
      season
    );
    expect(value(facts, "First aired")).toBe("17 January 2025");
    expect(value(facts, "Episodes")).toBe(10);
    expect(value(facts, "Average score")).toBe(84);
  });

  it("leaves out a date it doesn't know", () => {
    const facts = seasonFacts(MOCK_TV, { ...season, airDate: null });
    expect(labels(facts)).not.toContain("First aired");
  });
});
