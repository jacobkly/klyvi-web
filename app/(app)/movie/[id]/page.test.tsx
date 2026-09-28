import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MediaSummary } from "@/lib/types";

import { MovieShelves } from "./movie-shelves";
import MoviePage from "./page";

const getMovie = vi.fn();
const getMovieCollection = vi.fn();
const getMovieRecommendations = vi.fn();

vi.mock("@/lib/api/catalog", () => ({
  getMovie: (...a: unknown[]) => getMovie(...a),
  getMovieCollection: (...a: unknown[]) => getMovieCollection(...a),
  getMovieRecommendations: (...a: unknown[]) => getMovieRecommendations(...a),
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

describe("MoviePage", () => {
  beforeEach(() => {
    getMovie.mockReset();
    getMovieCollection.mockReset().mockResolvedValue([]);
    getMovieRecommendations.mockReset().mockResolvedValue([]);
  });

  it("starts the shelf requests without waiting for the film", async () => {
    // The film never lands, so anything gated behind it never starts.
    getMovie.mockImplementation(() => new Promise(() => {}));
    void MoviePage({ params: Promise.resolve({ id: "120" }) });
    await new Promise((r) => setTimeout(r, 0));

    expect(getMovie).toHaveBeenCalledWith(120);
    expect(getMovieCollection).toHaveBeenCalledWith(120);
    expect(getMovieRecommendations).toHaveBeenCalledWith(120);
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
        recommendations: Promise.resolve([
          film(120, "The Fellowship of the Ring"),
          film(1891, "The Empire Strikes Back"),
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
    expect(screen.queryByText("The Fellowship of the Ring")).toBeNull();
  });

  it("renders nothing when neither shelf has titles", async () => {
    const { container } = render(
      await MovieShelves({
        tmdbId: 120,
        collection: Promise.resolve([]),
        recommendations: Promise.resolve([film(120, "The Fellowship")]),
      })
    );
    expect(container).toBeEmptyDOMElement();
  });
});
