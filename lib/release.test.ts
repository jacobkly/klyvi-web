import { describe, expect, it } from "vitest";

import { outLabel } from "./release";

const today = new Date("2026-11-18T12:00:00Z");

describe("outLabel", () => {
  it("names the day for a title out later this year", () => {
    expect(outLabel("2026-12-16", today)).toBe("Out 16 December");
  });

  it("adds the year when it's out in another one", () => {
    expect(outLabel("2027-03-05", today)).toBe("Out 5 March 2027");
  });

  it("says nothing once it's out", () => {
    expect(outLabel("2026-11-18", today)).toBeNull();
    expect(outLabel("2019-05-30", today)).toBeNull();
  });

  it("says nothing without a date", () => {
    expect(outLabel(null, today)).toBeNull();
    expect(outLabel("not a date", today)).toBeNull();
  });
});
