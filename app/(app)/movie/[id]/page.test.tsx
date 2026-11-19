import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MOCK_MOVIE } from "@/lib/mock-media";
import type { MediaSummary, SimilarTitle } from "@/lib/types";

import { MovieBand, MovieShelves } from "./movie-shelves";
import MoviePage from "./page";

const getMovie = vi.fn();
const getMovieCollection = vi.fn();
const getSimilar = vi.fn();
const getFamily = vi.fn();

vi.mock("@/lib/api/catalog", () => ({
  getMovie: (...a: unknown[]) => getMovie(...a),
  getMovieCollection: (...a: unknown[]) => getMovieCollection(...a),
  getSimilar: (...a: unknown[]) => getSimilar(...a),
  getFamily: (...a: unknown[]) => getFamily(...a),
}));
vi.mock("@/lib/api/tracking", () => ({ listTracking: vi.fn() }));
vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => ({ user: null }),
}));
vi.mock("next/navigation", async (actual) => ({
  ...(await actual<typeof import("next/navigation")>()),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/movie/120",
}));

// Next's notFound() throws this digest. The router turns it into a 404 and
// renders the route's not-found.tsx.
const NOT_FOUND = { digest: expect.stringMatching(/^NEXT_HTTP_ERROR_FALLBACK;404/) };

function film(tmdbId: number, title: string): MediaSummary {
  return {
    mediaId: 0,
    mediaType: "movie",
    tmdbId,
    title,
    // A poster keeps the card from repeating the title as placeholder text.
    posterPath: `/p${tmdbId}.jpg`,
    year: 2001,
  };
}

function like(tmdbId: number, title: string, reason: string): SimilarTitle {
  return {
    ...film(tmdbId, title),
    reasons: [{ kind: "keyword", id: tmdbId, name: reason }],
  };
}

describe("MoviePage", () => {
  beforeEach(() => {
    getMovie.mockReset();
    getMovieCollection.mockReset().mockResolvedValue([]);
    getSimilar.mockReset().mockResolvedValue([]);
    getFamily.mockReset().mockResolvedValue([]);
  });

  it("answers 404 when the API has no such film", async () => {
    getMovie.mockResolvedValue(null);
    await expect(
      MoviePage({ params: Promise.resolve({ id: "999999999" }) })
    ).rejects.toMatchObject(NOT_FOUND);
  });

  it("answers 404 for an id that isn't a number", async () => {
    await expect(
      MoviePage({ params: Promise.resolve({ id: "abc" }) })
    ).rejects.toMatchObject(NOT_FOUND);
    expect(getMovie).not.toHaveBeenCalled();
  });

  it("starts the shelf requests without waiting for the film", async () => {
    // The film never lands, so anything gated behind it never starts.
    getMovie.mockImplementation(() => new Promise(() => {}));
    void MoviePage({ params: Promise.resolve({ id: "120" }) });
    await new Promise((r) => setTimeout(r, 0));

    expect(getMovie).toHaveBeenCalledWith(120);
    expect(getMovieCollection).toHaveBeenCalledWith(120);
    expect(getSimilar).toHaveBeenCalledWith("movies", 120);
    expect(getFamily).toHaveBeenCalledWith("movies", 120);
  });

  it("puts the collection band under the hero, named after the collection", async () => {
    getMovie.mockResolvedValue({ ...MOCK_MOVIE, tmdbId: 120, collectionName: "The Lord of the Rings Collection" });
    getMovieCollection.mockResolvedValue([
      film(120, "The Fellowship of the Ring"),
      film(121, "The Two Towers"),
    ]);
    const page = await MoviePage({ params: Promise.resolve({ id: "120" }) });
    const band = page.props.extra.props.children;
    render(await MovieBand(band.props));

    expect(
      screen.getByRole("region", { name: "Part of The Lord of the Rings Collection" })
    ).toBeInTheDocument();
    expect(screen.getByText("The Two Towers")).toBeInTheDocument();
  });

  it("hides the shelves, not the page, when their requests fail", async () => {
    getMovie.mockResolvedValue(MOCK_MOVIE);
    getMovieCollection.mockRejectedValue(new Error("503"));
    getSimilar.mockRejectedValue(new Error("503"));
    getFamily.mockRejectedValue(new Error("503"));
    const page = await MoviePage({ params: Promise.resolve({ id: "120" }) });

    expect(page.props.title).toBe(MOCK_MOVIE.title);
    const { container } = render(
      await MovieShelves(page.props.shelves.props.children.props)
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe("MovieBand", () => {
  it("shows nothing for a film that stands alone", async () => {
    const out = await MovieBand({
      name: "Solo Collection",
      tmdbId: 120,
      collection: Promise.resolve([film(120, "The Fellowship of the Ring")]),
    });
    expect(out).toBeNull();
  });
});

describe("MovieShelves", () => {
  it("shows the franchise without the collection's films, then more like this", async () => {
    render(
      await MovieShelves({
        tmdbId: 120,
        collection: Promise.resolve([
          film(120, "The Fellowship of the Ring"),
          film(121, "The Two Towers"),
        ]),
        family: Promise.resolve([
          film(121, "The Two Towers"),
          { ...film(49051, "The Hobbit: An Unexpected Journey"), year: 2012 },
          { ...film(84773, "The Rings of Power"), mediaType: "tv", year: 2022 },
        ]),
        similar: Promise.resolve([
          like(1891, "The Empire Strikes Back", "chosen one"),
        ]),
      })
    );

    expect(
      screen.getByRole("heading", { name: "From the same franchise" })
    ).toBeInTheDocument();
    // The band already shows the collection.
    expect(screen.queryByText("The Two Towers")).toBeNull();
    expect(screen.getByText("The Hobbit: An Unexpected Journey")).toBeInTheDocument();
    expect(screen.getByText("· Film")).toBeInTheDocument();
    expect(screen.getByText("· Series")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "More like this" })
    ).toBeInTheDocument();
    expect(screen.getByText("The Empire Strikes Back")).toBeInTheDocument();
    expect(screen.getByText("Chosen One")).toBeInTheDocument();
    expect(screen.queryByText("The Fellowship of the Ring")).toBeNull();
  });

  it("renders nothing when neither shelf has titles", async () => {
    const { container } = render(
      await MovieShelves({
        tmdbId: 120,
        collection: Promise.resolve([]),
        family: Promise.resolve([]),
        similar: Promise.resolve([]),
      })
    );
    expect(container).toBeEmptyDOMElement();
  });
});
