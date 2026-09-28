import { describe, expect, it } from "vitest";

import nextConfig from "@/next.config";

import { tmdbImage } from "./tmdb-image";
import tmdbImageLoader from "./tmdb-image-loader";

const load = (src: string, width: number) =>
  tmdbImageLoader({ src, width, quality: 75 });

describe("tmdbImage", () => {
  it("builds a TMDB image URL for the loader to size", () => {
    expect(tmdbImage("/abc.jpg")).toBe(
      "https://image.tmdb.org/t/p/original/abc.jpg"
    );
  });

  it("returns null without a path", () => {
    expect(tmdbImage(null)).toBeNull();
  });
});

describe("tmdbImageLoader", () => {
  it.each([
    [92, "w92"],
    [150, "w154"],
    [185, "w185"],
    [342, "w342"],
    [400, "w500"],
    [700, "w780"],
    [1000, "w1280"],
  ])("asks TMDB for the smallest size covering %ipx", (width, size) => {
    expect(load(tmdbImage("/abc.jpg"), width)).toBe(
      `https://image.tmdb.org/t/p/${size}/abc.jpg`
    );
  });

  it("stops at w1280 for wide, dense screens", () => {
    // Originals run to several megabytes. w1280 is also the most the
    // Vercel optimizer was ever given to work with.
    expect(load(tmdbImage("/abc.jpg"), 3840)).toBe(
      "https://image.tmdb.org/t/p/w1280/abc.jpg"
    );
  });

  it("replaces a size already in the URL", () => {
    expect(load("https://image.tmdb.org/t/p/w1280/abc.jpg", 154)).toBe(
      "https://image.tmdb.org/t/p/w154/abc.jpg"
    );
  });

  it("leaves an image from anywhere else alone", () => {
    const banner = "https://cdn.example.com/banner.jpg";
    expect(load(banner, 780)).toBe(banner);
  });

  it("gets a TMDB size for every width next/image can ask for", () => {
    const { imageSizes = [], deviceSizes = [] } = nextConfig.images ?? {};
    const widths = [...imageSizes, ...deviceSizes];

    expect(widths.length).toBeGreaterThan(0);
    for (const w of widths) {
      expect(load(tmdbImage("/abc.jpg"), w)).toBe(
        `https://image.tmdb.org/t/p/w${w}/abc.jpg`
      );
    }
  });
});
