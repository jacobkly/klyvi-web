import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TvDetail } from "@/lib/mock-media";
import type { SimilarTitle } from "@/lib/types";

import TvPage from "./page";
import { TvShelves } from "./tv-shelves";

const getTvSeries = vi.fn();
const getSimilar = vi.fn();

vi.mock("@/lib/api/catalog", () => ({
  getTvSeries: (...a: unknown[]) => getTvSeries(...a),
  getSimilar: (...a: unknown[]) => getSimilar(...a),
}));
// The layout is the movie page's too and is covered there. Stubbing it keeps
// this test on what the series page hands it.
vi.mock("@/components/media/detail-layout", () => ({
  DetailLayout: () => null,
}));

// Next's notFound() throws this digest. The router turns it into a 404 and
// renders the route's not-found.tsx.
const NOT_FOUND = { digest: expect.stringMatching(/^NEXT_HTTP_ERROR_FALLBACK;404/) };

const SERIES: TvDetail = {
  tmdbId: 1396,
  title: "Breaking Bad",
  year: 2008,
  posterPath: "/bb.jpg",
  backdropPath: null,
  tagline: null,
  overview: null,
  releaseDate: "2008-01-20",
  status: "Ended",
  language: "English",
  studio: null,
  voteAverage: 8.9,
  genres: ["Drama", "Crime"],
  keywords: [],
  cast: [],
  crew: [{ role: "Executive Producers", names: ["Vince Gilligan"] }],
  seasons: [],
  episodeRuntime: null,
  firstAirDate: "2008-01-20",
  lastAirDate: "2013-09-29",
  creator: "Vince Gilligan",
  originalTitle: "Breaking Bad",
  studios: [],
  countries: [],
  spokenLanguages: [],
  homepage: null,
  networks: ["AMC"],
  showType: "Scripted",
  inProduction: false,
  nextEpisode: null,
  lastEpisode: { season: 5, episode: 16, airDate: "2013-09-29" },
};

function show(tmdbId: number, title: string, reason: string): SimilarTitle {
  return {
    mediaId: 0,
    mediaType: "tv",
    tmdbId,
    title,
    posterPath: `/p${tmdbId}.jpg`,
    year: 2015,
    reasons: [{ kind: "keyword", id: tmdbId, name: reason }],
  };
}

describe("TvPage", () => {
  beforeEach(() => {
    getTvSeries.mockReset();
    getSimilar.mockReset().mockResolvedValue([]);
  });

  it("answers 404 when the API has no such series", async () => {
    getTvSeries.mockResolvedValue(null);
    await expect(
      TvPage({ params: Promise.resolve({ id: "999999999" }) })
    ).rejects.toMatchObject(NOT_FOUND);
  });

  it("starts the similar request without waiting for the series", async () => {
    getTvSeries.mockImplementation(() => new Promise(() => {}));
    void TvPage({ params: Promise.resolve({ id: "1396" }) });
    await new Promise((r) => setTimeout(r, 0));

    expect(getTvSeries).toHaveBeenCalledWith(1396);
    expect(getSimilar).toHaveBeenCalledWith("tv", 1396);
  });

  it("passes the series crew and a similar shelf to the layout", async () => {
    getTvSeries.mockResolvedValue(SERIES);
    const page = await TvPage({ params: Promise.resolve({ id: "1396" }) });

    expect(page.props.crew).toEqual(SERIES.crew);
    expect(page.props.shelves).toBeTruthy();
  });

  it("hands the layout the series facts and the phone strip", async () => {
    getTvSeries.mockResolvedValue(SERIES);
    const page = await TvPage({ params: Promise.resolve({ id: "1396" }) });

    expect(page.props.metadata).toContainEqual({
      label: "Last episode",
      value: "S5 E16 on 29 Sep 2013",
    });
    expect(page.props.metadata).toContainEqual({ label: "Network", value: "AMC" });
    expect(page.props.strip).toEqual(["89 average"]);
    expect(page.props.directorLine).toBe("Created by Vince Gilligan");
  });

  it("hides the shelf, not the page, when the similar request fails", async () => {
    getTvSeries.mockResolvedValue(SERIES);
    getSimilar.mockRejectedValue(new Error("503"));
    const page = await TvPage({ params: Promise.resolve({ id: "1396" }) });

    expect(page.props.title).toBe("Breaking Bad");
    const { container } = render(
      await TvShelves(page.props.shelves.props.children.props)
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe("TvShelves", () => {
  it("renders similar series with their reasons", async () => {
    render(
      await TvShelves({
        similar: Promise.resolve([
          show(60059, "Better Call Saul", "drug cartel"),
        ]),
      })
    );

    expect(
      screen.getByRole("heading", { name: "More like this" })
    ).toBeInTheDocument();
    expect(screen.getByText("Better Call Saul")).toBeInTheDocument();
    expect(screen.getByText("drug cartel")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Better Call Saul/ })
    ).toHaveAttribute("href", "/tv/60059");
  });

  it("renders nothing when there is nothing similar", async () => {
    const { container } = render(
      await TvShelves({ similar: Promise.resolve([]) })
    );
    expect(container).toBeEmptyDOMElement();
  });
});
