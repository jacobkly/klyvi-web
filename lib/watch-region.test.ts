import { describe, expect, it } from "vitest";

import { regionFromLanguages } from "./watch-region";

describe("regionFromLanguages", () => {
  it("takes the first language that names a country", () => {
    expect(regionFromLanguages(["en-GB", "en-US"])).toBe("GB");
    expect(regionFromLanguages(["pt-br"])).toBe("BR");
  });

  it("fills in the likely country for a bare language", () => {
    expect(regionFromLanguages(["de"])).toBe("DE");
  });

  it("falls back to the US", () => {
    expect(regionFromLanguages([])).toBe("US");
    expect(regionFromLanguages(["not a tag"])).toBe("US");
    // A UN region code is not a country.
    expect(regionFromLanguages(["es-419"])).toBe("US");
  });
});
