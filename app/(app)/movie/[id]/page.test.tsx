import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MOCK_MOVIE } from "@/lib/mock-media";
import type { MediaSummary, SimilarTitle } from "@/lib/types";

import { MovieShelves } from "./movie-shelves";
import MoviePage from "./page";

const getMovie = vi.fn();
const getMovieCollection = vi.fn();
const getSimilar = vi.fn();

vi.mock("@/lib/api/catalog", () => ({
  getMovie: (...a: unknown[]) => getMovie(...a),
  getMovieCollection: (...a: unknown[]) => getMovieCollection(...a),
  getSimilar: (...a: unknown[]) => getSimilar(...a),
}));
vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => ({ user: null }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/movie/120",
}));

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
  });

  it("starts the shelf requests without waiting for the film", async () => {
    // The film never lands, so anything gated behind it never starts.
    getMovie.mockImplementation(() => new Promise(() => {}));
    void MoviePage({ params: Promise.resolve({ id: "120" }) });
    await new Promise((r) => setTimeout(r, 0));

    expect(getMovie).toHaveBeenCalledWith(120);
    expect(getMovieCollection).toHaveBeenCalledWith(120);
    expect(getSimilar).toHaveBeenCalledWith("movies", 120);
  });

  it("hides the shelves, not the page, when their requests fail", async () => {
    getMovie.mockResolvedValue(MOCK_MOVIE);
    getMovieCollection.mockRejectedValue(new Error("503"));
    getSimilar.mockRejectedValue(new Error("503"));
    const page = await MoviePage({ params: Promise.resolve({ id: "120" }) });

    expect(page.props.title).toBe(MOCK_MOVIE.title);
    const { container } = render(
      await MovieShelves(page.props.shelves.props.children.props)
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe("MovieShelves", () => {
  it("drops the film itself and renders both shelves", async () => {
    render(
      await MovieShelves({
        tmdbId: 120,
        collection: Promise.resolve([
          film(120, "The Fellowship of the Ring"),
          film(121, "The Two Towers"),
        ]),
        similar: Promise.resolve([
          like(1891, "The Empire Strikes Back", "chosen one"),
        ]),
      })
    );

    expect(
      screen.getByRole("heading", { name: "In the same collection" })
    ).toBeInTheDocument();
    expect(screen.getByText("The Two Towers")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "More like this" })
    ).toBeInTheDocument();
    expect(screen.getByText("The Empire Strikes Back")).toBeInTheDocument();
    expect(screen.getByText("chosen one")).toBeInTheDocument();
    expect(screen.queryByText("The Fellowship of the Ring")).toBeNull();
  });

  it("renders nothing when neither shelf has titles", async () => {
    const { container } = render(
      await MovieShelves({
        tmdbId: 120,
        collection: Promise.resolve([]),
        similar: Promise.resolve([]),
      })
    );
    expect(container).toBeEmptyDOMElement();
  });
});
