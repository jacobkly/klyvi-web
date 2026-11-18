import { describe, expect, it } from "vitest";

import {
  SCORE_SCALES,
  formatScore,
  fromScale,
  parseScoreInput,
  scoreInputText,
  scoreSpoken,
  toScale,
} from "./score";

describe("formatScore", () => {
  it("formats in all four systems", () => {
    expect(formatScore(88, "hundred")).toBe("88");
    expect(formatScore(88, "ten")).toBe("9/10");
    expect(formatScore(88, "stars")).toBe("4/5");
    expect(formatScore(88, "smiley")).toBe("Liked it");
  });

  it("puts the edges of each system where you'd expect", () => {
    expect(formatScore(0, "ten")).toBe("1/10");
    expect(formatScore(100, "ten")).toBe("10/10");
    expect(formatScore(0, "stars")).toBe("1/5");
    expect(formatScore(100, "stars")).toBe("5/5");
    expect(formatScore(35, "smiley")).toBe("Didn't like it");
    expect(formatScore(60, "smiley")).toBe("It was okay");
    expect(formatScore(61, "smiley")).toBe("Liked it");
  });
});

describe("toScale and fromScale", () => {
  it("round-trips every step of every system", () => {
    for (const scale of Object.values(SCORE_SCALES)) {
      for (let n = scale.min; n <= scale.max; n++) {
        const stored = fromScale(n, scale.system);
        expect(stored).toBeGreaterThanOrEqual(0);
        expect(stored).toBeLessThanOrEqual(100);
        expect(toScale(stored, scale.system)).toBe(n);
      }
    }
  });

  it("stores the API's 0 to 100", () => {
    expect(fromScale(9, "ten")).toBe(90);
    expect(fromScale(4, "stars")).toBe(80);
    expect(fromScale(3, "smiley")).toBe(85);
  });
});

describe("parseScoreInput", () => {
  it("reads a blank field as no score", () => {
    expect(parseScoreInput(" ", "ten")).toEqual({ score: null, error: null });
  });

  it("reads whole numbers in the system's range", () => {
    expect(parseScoreInput("91", "hundred")).toEqual({ score: 91, error: null });
    expect(parseScoreInput("7", "ten")).toEqual({ score: 70, error: null });
  });

  it.each([
    ["150", "hundred", "Score must be a whole number from 0 to 100"],
    ["7.5", "hundred", "Score must be a whole number from 0 to 100"],
    ["0", "ten", "Score must be a whole number from 1 to 10"],
    ["11", "ten", "Score must be a whole number from 1 to 10"],
  ] as const)("refuses %s in %s", (raw, system, error) => {
    expect(parseScoreInput(raw, system)).toEqual({ score: null, error });
  });

  it("writes a stored score back in the system's units", () => {
    expect(scoreInputText(88, "hundred")).toBe("88");
    expect(scoreInputText(88, "ten")).toBe("9");
    expect(scoreInputText(null, "ten")).toBe("");
  });
});

describe("scoreSpoken", () => {
  it("reads the score out in each system", () => {
    expect(scoreSpoken(88, "hundred")).toBe("88 out of 100");
    expect(scoreSpoken(88, "ten")).toBe("9 out of 10");
    expect(scoreSpoken(88, "stars")).toBe("4 out of 5 stars");
    expect(scoreSpoken(20, "smiley")).toBe("Didn't like it");
  });
});
