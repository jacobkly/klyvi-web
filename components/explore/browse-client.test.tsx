import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BrowseCategory } from "@/lib/browse-categories";
import { writePref } from "@/lib/local-prefs";
import type { MediaSummary, Watched } from "@/lib/types";

const getListPage = vi.fn();
vi.mock("@/lib/api/catalog", () => ({
  getListPage: (...a: unknown[]) => getListPage(...a),
}));

const session = vi.hoisted(() => ({
  user: null as { id: string } | null,
  loading: false,
}));
vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => session,
}));

const seen = vi.hoisted(() => ({
  value: { movies: new Set<number>(), tv: new Set<number>() } as Watched,
}));
vi.mock("@/components/klyvi/watched-provider", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/klyvi/watched-provider")>()),
  useWatched: () => seen.value,
}));

import { BrowseClient } from "./browse-client";

const CATEGORY: BrowseCategory = {
  slug: "popular-films",
  title: "Popular films",
  kind: "movie",
  type: "popular",
};

function media(id: number): MediaSummary {
  return {
    mediaId: 0,
    mediaType: "movie",
    tmdbId: id,
    title: `Film ${id}`,
    posterPath: null,
    year: 2024,
  };
}

/** Films from..to, as one page of a list with `totalPages` pages. */
function page(from: number, to: number, totalPages = 10) {
  const items: MediaSummary[] = [];
  for (let id = from; id <= to; id++) items.push(media(id));
  return { items, page: 1, totalPages };
}

type Answer = ReturnType<typeof page> | Error | "hang";

/** Answers each page number from the table, the same every time it is asked. */
function serve(answers: Record<number, Answer>) {
  getListPage.mockImplementation(
    (_kind: string, _type: string, n: number) => {
      const a = answers[n];
      if (a === "hang") return new Promise(() => {});
      if (a instanceof Error) return Promise.reject(a);
      return Promise.resolve(a ?? page(0, -1));
    }
  );
}

describe("BrowseClient", () => {
  beforeEach(() => {
    getListPage.mockReset();
    window.localStorage.clear();
    session.user = null;
    seen.value = { movies: new Set(), tv: new Set() };
  });

  it("opens on two pages, forty titles, with anime left out", async () => {
    serve({ 1: page(1, 20), 2: page(21, 40) });
    render(<BrowseClient category={CATEGORY} />);

    expect(await screen.findByText("Film 1")).toBeInTheDocument();
    expect(screen.getByText("Film 40")).toBeInTheDocument();
    for (const n of [1, 2]) {
      expect(getListPage).toHaveBeenCalledWith(
        "movie",
        "popular",
        n,
        { anime: false },
        expect.any(AbortSignal)
      );
    }
  });

  it("appends only fresh titles from the next page", async () => {
    // Page 3 overlaps page 2: only the new film may append.
    serve({ 1: page(1, 20), 2: page(21, 40), 3: page(40, 41) });
    const user = userEvent.setup();
    render(<BrowseClient category={CATEGORY} />);

    await screen.findByText("Film 1");
    await user.click(screen.getByRole("button", { name: "Load more" }));

    expect(await screen.findByText("Film 41")).toBeInTheDocument();
    expect(screen.getAllByText("Film 40")).toHaveLength(1);
    expect(getListPage).toHaveBeenLastCalledWith(
      "movie",
      "popular",
      3,
      { anime: false },
      undefined
    );
  });

  it("ends at the list's last page", async () => {
    serve({ 1: page(1, 20, 3), 2: page(21, 40, 3), 3: page(41, 50, 3) });
    const user = userEvent.setup();
    render(<BrowseClient category={CATEGORY} />);

    await screen.findByText("Film 1");
    await user.click(screen.getByRole("button", { name: "Load more" }));

    expect(await screen.findByText("That is the whole list.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });

  it("keeps going past a page that came back empty", async () => {
    // With anime out, a page of nothing but anime arrives empty.
    serve({ 1: page(1, 20), 2: page(21, 40), 3: page(0, -1) });
    const user = userEvent.setup();
    render(<BrowseClient category={CATEGORY} />);

    await screen.findByText("Film 1");
    await user.click(screen.getByRole("button", { name: "Load more" }));

    await vi.waitFor(() => expect(getListPage).toHaveBeenCalledTimes(3));
    expect(await screen.findByRole("button", { name: "Load more" })).toBeEnabled();
    expect(screen.queryByText("That is the whole list.")).toBeNull();
  });

  it("shows the error state with retry when the first pages fail", async () => {
    serve({ 1: new Error("boom"), 2: page(21, 40) });
    const user = userEvent.setup();
    render(<BrowseClient category={CATEGORY} />);

    const retry = await screen.findByRole("button", { name: "Try again" });
    serve({ 1: page(1, 20), 2: page(21, 40) });
    await user.click(retry);
    expect(await screen.findByText("Film 1")).toBeInTheDocument();
  });

  it("holds the next page's place with skeleton cards", async () => {
    serve({ 1: page(1, 20), 2: page(21, 40), 3: "hang" });
    const user = userEvent.setup();
    const { container } = render(<BrowseClient category={CATEGORY} />);
    await screen.findByText("Film 1");
    const before = container.querySelectorAll('[class*="aspect-[2/3]"]').length;

    await user.click(screen.getByRole("button", { name: "Load more" }));

    expect(screen.queryByText("Loading")).toBeNull();
    expect(
      container.querySelectorAll('[class*="aspect-[2/3]"]').length
    ).toBeGreaterThan(before);
  });

  it("fetches the list with anime when Filters let it in", async () => {
    writePref("browseFilters", { watched: "show", anime: true });
    serve({ 1: page(1, 20), 2: page(21, 40) });
    render(<BrowseClient category={CATEGORY} />);

    await screen.findByText("Film 1");
    expect(getListPage).toHaveBeenCalledWith(
      "movie",
      "popular",
      1,
      { anime: true },
      expect.any(AbortSignal)
    );
  });

  it("hides watched titles when asked", async () => {
    session.user = { id: "u1" };
    seen.value = { movies: new Set([1]), tv: new Set() };
    writePref("browseFilters", { watched: "hide", anime: false });
    serve({ 1: page(1, 20), 2: page(21, 40) });
    render(<BrowseClient category={CATEGORY} />);

    expect(await screen.findByText("Film 2")).toBeInTheDocument();
    expect(screen.queryByText("Film 1")).toBeNull();
  });

  it("dims watched titles rather than hiding them", async () => {
    session.user = { id: "u1" };
    seen.value = { movies: new Set([1]), tv: new Set() };
    writePref("browseFilters", { watched: "dim", anime: false });
    serve({ 1: page(1, 20), 2: page(21, 40) });
    const { container } = render(<BrowseClient category={CATEGORY} />);

    expect(await screen.findByText("Film 1")).toBeInTheDocument();
    expect(container.querySelector("[data-dim-watched]")).not.toBeNull();
  });

  it("shows every title signed out, whatever the stored filter says", async () => {
    seen.value = { movies: new Set([1]), tv: new Set() };
    writePref("browseFilters", { watched: "hide", anime: false });
    serve({ 1: page(1, 20), 2: page(21, 40) });
    const { container } = render(<BrowseClient category={CATEGORY} />);

    expect(await screen.findByText("Film 1")).toBeInTheDocument();
    expect(container.querySelector("[data-dim-watched]")).toBeNull();
  });

  it("says so when every title on a finished list is hidden", async () => {
    session.user = { id: "u1" };
    seen.value = { movies: new Set([1, 2]), tv: new Set() };
    writePref("browseFilters", { watched: "hide", anime: false });
    serve({ 1: page(1, 2, 1), 2: page(0, -1, 1) });
    render(<BrowseClient category={CATEGORY} />);

    expect(await screen.findByText("You have seen all of these")).toBeInTheDocument();
  });
});
