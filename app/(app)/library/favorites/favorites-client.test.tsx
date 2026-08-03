import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryEntry } from "@/lib/types";

import { FavoritesClient } from "./favorites-client";

const listTracking = vi.fn();
vi.mock("@/lib/api/tracking", () => ({
  listTracking: (...args: unknown[]) => listTracking(...args),
}));

function entry(over: Partial<LibraryEntry>): LibraryEntry {
  return {
    mediaId: 1,
    mediaType: "movie",
    tmdbId: 100,
    title: "Parasite",
    posterPath: null,
    year: 2019,
    status: "completed",
    score: 95,
    progress: null,
    progressTotal: null,
    notes: null,
    favorite: false,
    updatedAt: "2026-07-01T00:00:00Z",
    ...over,
  };
}

describe("FavoritesClient", () => {
  beforeEach(() => listTracking.mockReset());

  it("shows only starred entries, highest rated first", async () => {
    listTracking.mockResolvedValue([
      entry({ mediaId: 1, title: "Parasite", score: 95, favorite: true }),
      entry({ mediaId: 2, title: "Not Starred", score: 99, favorite: false }),
      entry({ mediaId: 3, title: "Whiplash", score: 98, favorite: true }),
    ]);
    render(<FavoritesClient />);

    expect(await screen.findByText("Whiplash")).toBeInTheDocument();
    expect(screen.getByText("Parasite")).toBeInTheDocument();
    // A high score without the flag is not a favorite.
    expect(screen.queryByText("Not Starred")).not.toBeInTheDocument();

    const titles = screen
      .getAllByRole("link")
      .map((a) => a.textContent ?? "")
      .filter((t) => t.includes("Whiplash") || t.includes("Parasite"));
    expect(titles[0]).toContain("Whiplash");
  });

  it("shows the empty state when nothing is starred", async () => {
    listTracking.mockResolvedValue([entry({ score: 99, favorite: false })]);
    render(<FavoritesClient />);
    expect(await screen.findByText("No favorites yet")).toBeInTheDocument();
  });

  it("shows the error state with a retry that refetches", async () => {
    listTracking.mockRejectedValueOnce(new Error("boom"));
    listTracking.mockResolvedValueOnce([
      entry({ title: "Whiplash", score: 98, favorite: true }),
    ]);
    render(<FavoritesClient />);

    const retry = await screen.findByRole("button", { name: "Try again" });
    retry.click();
    expect(await screen.findByText("Whiplash")).toBeInTheDocument();
    expect(listTracking).toHaveBeenCalledTimes(2);
  });
});
