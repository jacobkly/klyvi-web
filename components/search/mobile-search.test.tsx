import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MobileSearch } from "./mobile-search";

const search = vi.fn();

const getMovieList = vi.fn();

vi.mock("@/lib/api/search", () => ({
  search: (...a: unknown[]) => search(...a),
}));

vi.mock("@/lib/api/catalog", () => ({
  getMovieList: (...a: unknown[]) => getMovieList(...a),
}));

function results() {
  return {
    movies: [
      { mediaId: 0, mediaType: "movie", tmdbId: 27205, title: "Inception", posterPath: "/inc.jpg", year: 2010, genreIds: [], voteAverage: 8.4 },
    ],
    tv: [
      { mediaId: 0, mediaType: "tv", tmdbId: 95396, title: "Severance", posterPath: null, year: 2022, genreIds: [], voteAverage: 8.7 },
    ],
    people: [],
  };
}

function field() {
  return screen.getByRole("searchbox", { name: "Search films and series" });
}

describe("MobileSearch", () => {
  beforeEach(() => {
    search.mockReset();
    getMovieList.mockReset().mockResolvedValue([]);
    window.localStorage.clear();
  });

  it("shows what is trending before you type", async () => {
    getMovieList.mockResolvedValue([
      { mediaId: 0, mediaType: "movie", tmdbId: 1, title: "Dune", posterPath: "/d.jpg", year: 2021 },
    ]);
    render(<MobileSearch open onOpenChange={() => {}} />);
    const trending = await screen.findByRole("region", { name: "Trending this week" });
    expect(within(trending).getByRole("link", { name: "Dune" })).toHaveAttribute("href", "/movie/1");
  });

  it("leads with the best match and narrows to films or series", async () => {
    search.mockResolvedValue(results());
    render(<MobileSearch open onOpenChange={() => {}} />);
    fireEvent.change(field(), { target: { value: "in" } });

    const list = await screen.findByRole("list", { name: "Results" });
    expect(within(list).getByText("Top result")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Series/ }));
    expect(
      within(screen.getByRole("list", { name: "Results" }))
        .getAllByRole("link")
        .map((l) => l.getAttribute("href"))
    ).toEqual(["/tv/95396"]);
    expect(screen.getByRole("button", { name: /Series/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("opens with the field focused and a hint before any search", async () => {
    render(<MobileSearch open onOpenChange={() => {}} />);
    await waitFor(() => expect(field()).toHaveFocus());
    expect(screen.getByText(/Search for a film or a series/)).toBeInTheDocument();
  });

  it("lists films and series as 44px rows linking to their pages", async () => {
    search.mockResolvedValue(results());
    render(<MobileSearch open onOpenChange={() => {}} />);
    fireEvent.change(field(), { target: { value: "in" } });

    const list = await screen.findByRole("list", { name: "Results" });
    expect(search).toHaveBeenCalledWith("in", "multi", expect.anything());
    const links = within(list).getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual(["/movie/27205", "/tv/95396"]);
    expect(links[0].className).toContain("min-h-11");
    expect(within(list).getByText("2010")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See all in Explore" })).toHaveAttribute(
      "href",
      "/explore?q=in"
    );
  });

  it("says so when nothing matches", async () => {
    search.mockResolvedValue({ movies: [], tv: [], people: [] });
    render(<MobileSearch open onOpenChange={() => {}} />);
    fireEvent.change(field(), { target: { value: "zzqx" } });
    expect(await screen.findByText(/Nothing matches/)).toBeInTheDocument();
  });

  it("offers a retry when the search fails", async () => {
    search.mockRejectedValueOnce(new Error("down")).mockResolvedValue(results());
    render(<MobileSearch open onOpenChange={() => {}} />);
    fireEvent.change(field(), { target: { value: "sev" } });

    fireEvent.click(await screen.findByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("list", { name: "Results" })).toBeInTheDocument();
  });

  it("remembers a search and lets you clear the recents", async () => {
    search.mockResolvedValue(results());
    render(<MobileSearch open onOpenChange={() => {}} />);
    fireEvent.change(field(), { target: { value: "severance" } });
    fireEvent.keyDown(field(), { key: "Enter" });
    expect(JSON.parse(window.localStorage.getItem("klyvi:recent-searches")!)).toEqual(["severance"]);

    fireEvent.change(field(), { target: { value: "" } });
    const recents = screen.getByRole("region", { name: "Recent searches" });
    expect(within(recents).getByRole("button", { name: "severance" })).toBeInTheDocument();
    fireEvent.click(within(recents).getByRole("button", { name: "Clear" }));
    expect(screen.queryByRole("region", { name: "Recent searches" })).toBeNull();
    expect(window.localStorage.getItem("klyvi:recent-searches")).toBeNull();
  });

  it("closes on Escape", async () => {
    const onOpenChange = vi.fn();
    render(<MobileSearch open onOpenChange={onOpenChange} />);
    fireEvent.keyDown(field(), { key: "Escape" });
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything()));
  });
});
