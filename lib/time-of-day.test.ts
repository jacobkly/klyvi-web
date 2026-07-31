import { describe, expect, it } from "vitest";

import { watchWindowPhrase } from "./time-of-day";

/** Local time, since the phrase is about the user's clock. */
const at = (hour: number) => new Date(2026, 6, 31, hour, 0, 0);

describe("watchWindowPhrase", () => {
  it("follows the clock through the day", () => {
    expect(watchWindowPhrase(at(5))).toBe("this morning");
    expect(watchWindowPhrase(at(9))).toBe("this morning");
    expect(watchWindowPhrase(at(12))).toBe("this afternoon");
    expect(watchWindowPhrase(at(16))).toBe("this afternoon");
    expect(watchWindowPhrase(at(17))).toBe("tonight");
    expect(watchWindowPhrase(at(22))).toBe("tonight");
  });

  it("falls back to the vague-but-never-wrong phrase in the small hours", () => {
    expect(watchWindowPhrase(at(23))).toBe("right now");
    expect(watchWindowPhrase(at(0))).toBe("right now");
    expect(watchWindowPhrase(at(4))).toBe("right now");
  });

  it("says right now rather than guessing when the hour is unreadable", () => {
    expect(watchWindowPhrase(new Date(NaN))).toBe("right now");
  });
});
