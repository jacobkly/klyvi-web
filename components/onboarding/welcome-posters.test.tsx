import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WelcomePosters } from "./welcome-posters";

const getMovieList = vi.fn();

vi.mock("@/lib/api/catalog", () => ({
  getMovieList: (...a: unknown[]) => getMovieList(...a),
}));

describe("WelcomePosters", () => {
  beforeEach(() => {
    getMovieList.mockReset();
  });

  it("fans out three trending posters, hidden from assistive tech", async () => {
    getMovieList.mockResolvedValue(
      ["/a.jpg", null, "/b.jpg", "/c.jpg", "/d.jpg"].map((posterPath, i) => ({
        tmdbId: i,
        posterPath,
      }))
    );
    const { container } = render(<WelcomePosters />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute("aria-hidden", "true");

    await waitFor(() => expect(container.querySelectorAll("img")).toHaveLength(3));
    expect(getMovieList).toHaveBeenCalledWith("trending", expect.anything());
  });

  it("falls back to the local pool when the list fails", async () => {
    getMovieList.mockRejectedValue(new Error("offline"));
    const { container } = render(<WelcomePosters />);
    await waitFor(() => expect(container.querySelectorAll("img")).toHaveLength(3));
  });
});
