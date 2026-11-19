import { describe, expect, it } from "vitest";

import { shareDescription, titleMetadata } from "./title-metadata";

const OVERVIEW =
  "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy. Their concept catches on, with underground fight clubs forming in every town.";

describe("shareDescription", () => {
  it("keeps a short overview whole", () => {
    expect(shareDescription("A short one.", "Heat")).toBe("A short one.");
  });

  it("trims a long overview at a word, under 160 characters", () => {
    const d = shareDescription(OVERVIEW, "Fight Club");
    expect(d.length).toBeLessThanOrEqual(160);
    expect(d.endsWith("…")).toBe(true);
    expect(OVERVIEW.startsWith(d.slice(0, -1))).toBe(true);
    expect(d.slice(0, -1).endsWith(" ")).toBe(false);
  });

  it("says something useful when there is no overview", () => {
    expect(shareDescription(null, "Heat")).toBe(
      "Heat on Klyvi: where to watch it, and what to watch after it."
    );
  });
});

describe("titleMetadata", () => {
  const base = {
    title: "Fight Club",
    overview: OVERVIEW,
    backdropPath: "/back.jpg",
    posterPath: "/post.jpg",
    path: "/movie/550",
  };

  it("names the title and links the canonical page", () => {
    const m = titleMetadata(base);
    expect(m.title).toBe("Fight Club · Klyvi");
    expect(m.alternates?.canonical).toBe("/movie/550");
    expect(m.description).toBe(shareDescription(OVERVIEW, "Fight Club"));
  });

  it("shares the backdrop as a wide card", () => {
    const m = titleMetadata(base);
    expect(m.openGraph).toMatchObject({
      title: "Fight Club · Klyvi",
      siteName: "Klyvi",
      url: "/movie/550",
      images: [
        {
          url: "https://image.tmdb.org/t/p/w1280/back.jpg",
          width: 1280,
          height: 720,
        },
      ],
    });
    expect(m.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("falls back to the poster, as a small card", () => {
    const m = titleMetadata({ ...base, backdropPath: null });
    expect(m.openGraph).toMatchObject({
      images: [{ url: "https://image.tmdb.org/t/p/w780/post.jpg" }],
    });
    expect(m.twitter).toMatchObject({ card: "summary" });
  });

  it("leaves the site's own share image in place when there is no art", () => {
    const m = titleMetadata({ ...base, backdropPath: null, posterPath: null });
    expect(m.openGraph).not.toHaveProperty("images");
    expect(m.twitter).not.toHaveProperty("images");
  });
});
