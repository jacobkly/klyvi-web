import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** sRGB channel (0 to 255) to linear light. */
function lin(c: number) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

describe("AmbientArt", () => {
  it("keeps muted text at 4.5:1 even over pure white art", () => {
    const src = readFileSync(join(__dirname, "ambient-art.tsx"), "utf8");
    const art = Number(/opacity-(\d+) blur/.exec(src)?.[1]) / 100;
    const scrim = Number(/from-background\/(\d+)/.exec(src)?.[1]) / 100;
    expect(art).toBeGreaterThan(0);
    expect(scrim).toBeGreaterThan(0);

    // The dark background is about sRGB 7, muted text (oklch 0.705) about 161.
    const bg = 7;
    const behind = scrim * bg + (1 - scrim) * (art * 255 + (1 - art) * bg);
    const ratio = (lin(161) + 0.05) / (lin(behind) + 0.05);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
