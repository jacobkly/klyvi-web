import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MarqueeHero } from "./marquee-hero";

const getMovieList = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/catalog", () => ({ getMovieList }));

beforeEach(() => {
  getMovieList.mockReset();
  getMovieList.mockReturnValue(new Promise(() => {}));
});

describe("MarqueeHero", () => {
  // The hero is the first thing anyone sees. If the server sends it hidden,
  // nothing above the fold shows until the page's JavaScript has loaded.
  it("is visible in the server HTML, before any JavaScript runs", () => {
    const html = renderToString(<MarqueeHero />);

    expect(html).toContain("Stop scrolling. Start watching.");
    expect(html).toContain("Get started");
    expect(html).not.toMatch(/opacity:\s*0/);
  });

  it("repeats a short list, so one set always fills the strip", async () => {
    getMovieList.mockResolvedValueOnce(
      Array.from({ length: 8 }, (_, i) => ({ posterPath: `/p${i}.jpg` }))
    );
    const { container } = render(<MarqueeHero />);
    await waitFor(() =>
      expect(container.querySelector("img[src$='/p0.jpg']")).not.toBeNull()
    );

    const imgs = [...container.querySelectorAll(".marquee-track img")].map((i) =>
      i.getAttribute("src")
    );
    expect(imgs.length).toBeGreaterThanOrEqual(24);
    expect(imgs.slice(0, imgs.length / 2)).toEqual(imgs.slice(imgs.length / 2));
  });

  describe("motion", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    function track(container: HTMLElement) {
      return container.querySelector(".marquee-track") as HTMLElement;
    }

    it("pauses and plays from a button (WCAG 2.2.2)", async () => {
      const user = userEvent.setup();
      const { container } = render(<MarqueeHero />);
      const button = screen.getByRole("button", { name: "Pause the posters" });

      expect(track(container)).not.toHaveAttribute("data-paused");
      await user.click(button);
      expect(track(container)).toHaveAttribute("data-paused");
      expect(button).toHaveAccessibleName("Play the posters");
      await user.click(button);
      expect(track(container)).not.toHaveAttribute("data-paused");
    });

    it("starts still under reduced motion, and plays once asked to", async () => {
      const user = userEvent.setup();
      vi.stubGlobal("matchMedia", (query: string) => ({
        matches: query.includes("reduce"),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }));
      const { container } = render(<MarqueeHero />);

      expect(track(container)).toHaveAttribute("data-paused");
      expect(track(container)).not.toHaveAttribute("data-manual");
      await user.click(screen.getByRole("button", { name: "Play the posters" }));
      expect(track(container)).not.toHaveAttribute("data-paused");
      expect(track(container)).toHaveAttribute("data-manual");
    });

    it("is no longer an exception to the reduced-motion floor in CSS", () => {
      // Before JavaScript runs, CSS alone has to keep the strip still.
      const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
      const reduced = css.match(
        /@media \(prefers-reduced-motion: reduce\) \{[^}]*?\.marquee-track:not\(\[data-manual\]\) \{[^}]*\}/
      );
      expect(reduced?.[0]).toMatch(/animation:\s*none/);
    });
  });
});
