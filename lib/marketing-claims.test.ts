import { describe, expect, it } from "vitest";

import {
  CLOSING_CLAIM,
  REASSURANCE_CLAIMS,
  STAT_CLAIMS,
  TAGLINE_CLAIM,
} from "./marketing-claims";

/** Each landing claim's visible words, plus its source note if it has one. */
const claims: { name: string; words: string[]; source?: string }[] = [
  { name: "tagline", words: [TAGLINE_CLAIM] },
  ...STAT_CLAIMS.map((s) => ({
    name: `stat "${s.category}"`,
    words: [s.category, s.value, s.line],
    source: s.source,
  })),
  {
    name: "closing",
    words: [CLOSING_CLAIM.heading, CLOSING_CLAIM.line],
    source: CLOSING_CLAIM.source,
  },
  { name: "reassurance row", words: REASSURANCE_CLAIMS },
];

describe("marketing claims", () => {
  it.each(claims)("$name states no number without a source", (claim) => {
    const numbered = claim.words.filter((w) => /\d/.test(w));
    if (numbered.length > 0) {
      expect(
        claim.source?.trim(),
        `unsourced number in ${numbered.join(" | ")}`
      ).toBeTruthy();
    }
  });

  it("promises free forever, not free for now", () => {
    expect(CLOSING_CLAIM.line).toMatch(/free forever/i);
    for (const claim of claims) {
      for (const w of claim.words) {
        expect(w, claim.name).not.toMatch(/free while|for now|grows/i);
      }
    }
  });
});
