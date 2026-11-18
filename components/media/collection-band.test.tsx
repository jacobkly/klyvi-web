import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MediaSummary } from "@/lib/types";

import { CollectionBand } from "./collection-band";

const listTracking = vi.fn();
let user: { id: string } | null = null;

vi.mock("@/lib/api/tracking", () => ({
  listTracking: (...a: unknown[]) => listTracking(...a),
}));
vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => ({ user }),
}));

function film(tmdbId: number, title: string, year: number): MediaSummary {
  return { mediaId: 0, mediaType: "movie", tmdbId, title, posterPath: `/p${tmdbId}.jpg`, year };
}

const TRILOGY = [
  film(272, "Batman Begins", 2005),
  film(155, "The Dark Knight", 2008),
  film(49026, "The Dark Knight Rises", 2012),
];

describe("CollectionBand", () => {
  beforeEach(() => {
    listTracking.mockReset().mockResolvedValue([]);
    user = null;
  });

  it("names the collection, counts the films and marks this one", () => {
    render(<CollectionBand name="The Dark Knight Collection" films={TRILOGY} currentId={155} />);

    const band = screen.getByRole("region", { name: "Part of The Dark Knight Collection" });
    expect(within(band).getByText("3 films")).toBeInTheDocument();
    const links = within(band).getAllByRole("link");
    expect(links.map((a) => a.textContent)).toEqual([
      expect.stringContaining("Batman Begins"),
      expect.stringContaining("The Dark Knight"),
      expect.stringContaining("The Dark Knight Rises"),
    ]);
    expect(links[1]).toHaveAttribute("aria-current", "page");
    expect(links[1]).toHaveTextContent("This film");
    expect(links[0]).not.toHaveAttribute("aria-current");
    // Signed out, nobody to ask about.
    expect(listTracking).not.toHaveBeenCalled();
  });

  it("shows your status and score on each film in one request", async () => {
    user = { id: "u1" };
    listTracking.mockResolvedValue([
      { tmdbId: 272, mediaType: "movie", status: "completed", score: 80 },
      { tmdbId: 49026, mediaType: "movie", status: "planning", score: null },
    ]);
    render(<CollectionBand name="The Dark Knight Collection" films={TRILOGY} currentId={155} />);

    expect(listTracking).toHaveBeenCalledWith({ mediaType: "movie", tmdbIds: [272, 155, 49026] });
    await waitFor(() =>
      expect(screen.getByRole("img", { name: "Completed" })).toBeInTheDocument()
    );
    expect(screen.getByRole("img", { name: "Planning" })).toBeInTheDocument();
  });

  it("falls back to a plain heading without the collection's name", () => {
    render(<CollectionBand name={null} films={TRILOGY.slice(0, 2)} currentId={155} />);
    expect(screen.getByRole("region", { name: "In the same collection" })).toBeInTheDocument();
    expect(screen.getByText("2 films")).toBeInTheDocument();
  });
});
