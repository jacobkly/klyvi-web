import { describe, expect, it } from "vitest";

import {
  bandRange,
  countryName,
  decadeBuckets,
  formatHours,
  formatLabel,
} from "./stats-format";

describe("formatHours", () => {
  it("prints hours and minutes", () => {
    expect(formatHours(9.233333333333333)).toBe("9h 14m");
  });
  it("drops the minutes on a whole hour", () => {
    expect(formatHours(12)).toBe("12h");
  });
  it("prints minutes alone under an hour", () => {
    expect(formatHours(0.5)).toBe("30m");
    expect(formatHours(0)).toBe("0m");
  });
  it("carries 60 rounded minutes into the hour", () => {
    expect(formatHours(1.999)).toBe("2h");
  });
});

describe("decadeBuckets", () => {
  it("sums years into decades on a real axis, empty ones included", () => {
    const got = decadeBuckets([
      { year: 1972, titles: 1, hours: 2.9 },
      { year: 1999, titles: 2, hours: 4 },
      { year: 1994, titles: 1, hours: 2.4 },
      { year: 2019, titles: 3, hours: 6.333 },
    ]);
    expect(got).toEqual([
      { label: "1970s", titles: 1, hours: 2.9 },
      { label: "1980s", titles: 0, hours: 0 },
      { label: "1990s", titles: 3, hours: 6.4 },
      { label: "2000s", titles: 0, hours: 0 },
      { label: "2010s", titles: 3, hours: 6.3 },
    ]);
  });
  it("is empty with no years", () => {
    expect(decadeBuckets([])).toEqual([]);
  });
});

describe("formatLabel", () => {
  it("names the formats", () => {
    expect(formatLabel("movie")).toBe("Movies");
    expect(formatLabel("season")).toBe("TV seasons");
    expect(formatLabel("other")).toBe("other");
  });
});

describe("countryName", () => {
  it("turns a region code into its name", () => {
    expect(countryName("US")).toBe("United States");
    expect(countryName("KR")).toBe("South Korea");
  });
  it("keeps anything that isn't a code", () => {
    expect(countryName("United Kingdom")).toBe("United Kingdom");
    expect(countryName("ZZZ")).toBe("ZZZ");
  });
});

describe("bandRange", () => {
  it("reads a score band in words", () => {
    expect(bandRange("81-90")).toBe("81 to 90");
    expect(bandRange("91-100")).toBe("91 to 100");
  });
});
