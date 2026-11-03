import { describe, expect, it } from "vitest";

import { formatDate, formatRuntime, formatSeasons } from "./mock-media";

describe("formatRuntime", () => {
  it("formats hours and minutes with no leading zero", () => {
    expect(formatRuntime(132)).toBe("2h 12m");
  });
  it("formats sub-hour runtimes as minutes only", () => {
    expect(formatRuntime(48)).toBe("48m");
  });
  it("returns null for unknown", () => {
    expect(formatRuntime(null)).toBeNull();
  });
});

describe("formatSeasons", () => {
  it("counts seasons as a numeral, singular for one", () => {
    expect(formatSeasons(1)).toBe("1 season");
    expect(formatSeasons(8)).toBe("8 seasons");
  });
  it("returns null for unknown", () => {
    expect(formatSeasons(null)).toBeNull();
  });
});

describe("formatDate", () => {
  it("formats day month year with no ordinal", () => {
    expect(formatDate("2023-11-04")).toBe("4 November 2023");
  });
  it("returns null for missing dates", () => {
    expect(formatDate(null)).toBeNull();
  });
});
