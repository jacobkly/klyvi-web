import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { MarqueeHero } from "./marquee-hero";

vi.mock("@/lib/api/catalog", () => ({
  getMovieList: () => new Promise(() => {}),
}));

describe("MarqueeHero", () => {
  // The hero is the first thing anyone sees. If the server sends it hidden,
  // nothing above the fold shows until the page's JavaScript has loaded.
  it("is visible in the server HTML, before any JavaScript runs", () => {
    const html = renderToString(<MarqueeHero />);

    expect(html).toContain("Stop scrolling. Start watching.");
    expect(html).toContain("Get started");
    expect(html).not.toMatch(/opacity:\s*0/);
  });
});
