import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mapTrackingEntry } from "@/lib/api/map";
import type { PageSink } from "@/lib/api/tracking";
import { readPref, writePref } from "@/lib/local-prefs";
import type { WireTrackingEntry } from "@/lib/api/wire";

import { LibraryView } from "./library-view";

const toast = vi.fn();
vi.mock("sonner", () => ({ toast: (...a: unknown[]) => toast(...a) }));

/** A tracking row as GET /v1/tracking returns it. */
function wire(over: Partial<WireTrackingEntry>): WireTrackingEntry {
  return {
    id: 1,
    user_id: "u",
    media_id: 955,
    media_type: "season",
    status: "watching",
    score: null,
    episode_progress: 3,
    notes: null,
    favorite: false,
    updated_at: "2026-09-01T00:00:00Z",
    tmdb_id: 1396,
    title: "Breaking Bad",
    poster_path: "/1yeVJox3rjo2jBKrrihIMj7uoS9.jpg",
    backdrop_path: null,
    release_year: 2008,
    season_number: 1,
    season_name: "Season 1",
    episode_count: 10,
    ...over,
  };
}

describe("LibraryView progress", () => {
  beforeEach(() => window.localStorage.clear());

  it("shows a season as 3 / 10 and a film with no total", async () => {
    const rows = [
      wire({}),
      wire({
        id: 2,
        media_id: 142,
        media_type: "movie",
        status: "completed",
        episode_progress: null,
        tmdb_id: 550,
        title: "Fight Club",
        season_number: null,
        season_name: null,
        episode_count: null,
      }),
    ];
    render(<LibraryView load={async () => rows.map(mapTrackingEntry)} />);

    expect(await screen.findByText("3 / 10")).toBeInTheDocument();
    expect(screen.getAllByText(/Fight Club/).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/^\d+ \/ \d+$/)).toHaveLength(1);
  });
});

const film = (id: number, title: string, over: Partial<WireTrackingEntry> = {}) =>
  wire({
    id,
    media_id: id,
    media_type: "movie",
    status: "completed",
    episode_progress: null,
    tmdb_id: id,
    title,
    season_number: null,
    season_name: null,
    episode_count: null,
    ...over,
  });

describe("LibraryView list settings", () => {
  beforeEach(() => window.localStorage.clear());

  const rows = [
    film(10, "Whiplash", { score: 88, updated_at: "2026-09-03T00:00:00Z" }),
    film(11, "Arrival", { score: 70, updated_at: "2026-09-01T00:00:00Z" }),
    wire({ id: 12, media_id: 12, title: "Severance", status: "completed", score: 95 }),
  ];
  const load = async () => rows.map(mapTrackingEntry);

  /** Titles in the order the Completed group shows them. */
  async function completedTitles() {
    const heading = await screen.findByRole("heading", { name: /Completed/ });
    const section = heading.closest("section")!;
    return within(section)
      .getAllByRole("button", { name: /^Edit / })
      .map((b) => b.getAttribute("aria-label")!.replace(/^Edit /, ""));
  }

  it("starts in the default list order from settings", async () => {
    writePref("listOrder", "title");
    render(<LibraryView load={load} />);
    expect(await completedTitles()).toEqual(["Arrival", "Severance", "Whiplash"]);
  });

  it("shows one combined list with no Films and TV tabs by default", async () => {
    render(<LibraryView load={load} />);
    await completedTitles();
    expect(screen.queryByRole("tab", { name: "Films" })).not.toBeInTheDocument();
  });

  it("splits into Films and TV tabs when combine is off", async () => {
    writePref("combineLists", false);
    render(<LibraryView load={load} />);

    expect(await screen.findByRole("tab", { name: "Films" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "TV" })).toBeInTheDocument();
    expect(await completedTitles()).not.toContain("Severance");

    await userEvent.click(screen.getByRole("tab", { name: "TV" }));
    expect(await completedTitles()).toEqual(["Severance"]);
  });
});

// #67: the library's place rides in the URL, so Back from a title, reload
// and a shared link all land on the same view.
describe("LibraryView in the URL", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState(null, "", "/library");
  });

  const rows = [
    film(10, "Whiplash", { score: 88 }),
    film(11, "Arrival", { score: 70, status: "watching" }),
    wire({ id: 12, media_id: 12, title: "Severance", status: "completed", score: 95 }),
  ];
  const load = async () => rows.map(mapTrackingEntry);

  it("opens on the place the URL names", async () => {
    writePref("combineLists", false);
    render(
      <LibraryView
        load={load}
        initial={{ tab: "season", sort: "title", view: "list" }}
      />
    );
    expect(await screen.findByRole("tab", { name: "TV" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(await screen.findByRole("button", { name: "Edit Severance" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit Whiplash" })).toBeNull();
  });

  it("filters by the URL's status", async () => {
    render(<LibraryView load={load} initial={{ status: "watching" }} />);
    expect(await screen.findByRole("button", { name: "Edit Arrival" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit Whiplash" })).toBeNull();
  });

  it("writes a change back to the URL, keeping other params", async () => {
    window.history.replaceState(null, "", "/library?state=demo");
    writePref("combineLists", false);
    render(<LibraryView load={load} />);

    await userEvent.click(await screen.findByRole("tab", { name: "TV" }));
    await waitFor(() =>
      expect(window.location.search).toBe("?state=demo&tab=season")
    );
  });

  it("keeps a picked view as the default for next time", async () => {
    render(<LibraryView load={load} />);
    await screen.findByRole("button", { name: "Edit Arrival" });

    await userEvent.click(screen.getAllByRole("button", { name: "List" })[0]);
    await waitFor(() => expect(window.location.search).toBe("?view=list"));
    expect(readPref("libraryView")).toBe("list");
  });
});

describe("LibraryView saves", () => {
  beforeEach(() => {
    window.localStorage.clear();
    toast.mockReset();
  });

  const rows = [
    film(10, "Whiplash", { score: 88 }),
    film(11, "Arrival", { score: 70 }),
  ];
  const load = async () => rows.map(mapTrackingEntry);

  async function order() {
    const heading = await screen.findByRole("heading", { name: /Completed/ });
    return within(heading.closest("section")!)
      .getAllByRole("button", { name: /^Edit / })
      .map((b) => b.getAttribute("aria-label")!.replace(/^Edit /, ""));
  }

  async function rescoreArrival() {
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Edit Arrival" }));
    const score = screen.getByRole("textbox", { name: "Score" });
    await user.clear(score);
    await user.type(score, "99");
    await user.click(screen.getByRole("button", { name: "Save" }));
  }

  it("shows a save before the request resolves", async () => {
    // A request that never answers: anything on screen came from the edit.
    const onSave = vi.fn(() => new Promise<void>(() => {}));
    render(<LibraryView load={load} onSave={onSave} />);
    expect(await order()).toEqual(["Whiplash", "Arrival"]);

    await rescoreArrival();

    expect(onSave).toHaveBeenCalledOnce();
    expect(await order()).toEqual(["Arrival", "Whiplash"]);
    expect(toast).not.toHaveBeenCalledWith("Could not update that. Try again");
  });

  it("rolls a failed save back and says so", async () => {
    const onSave = vi.fn(() => Promise.reject(new Error("503")));
    render(<LibraryView load={load} onSave={onSave} />);
    await order();

    await rescoreArrival();

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Could not update that. Try again")
    );
    expect(await order()).toEqual(["Whiplash", "Arrival"]);
  });
});

describe("LibraryView paging", () => {
  beforeEach(() => {
    window.localStorage.clear();
    toast.mockReset();
  });

  async function completed() {
    const heading = await screen.findByRole("heading", { name: /Completed/ });
    return within(heading.closest("section")!)
      .getAllByRole("button", { name: /^Edit / })
      .map((b) => b.getAttribute("aria-label")!.replace(/^Edit /, ""));
  }

  it("shows the first page, then adds the next page when it lands", async () => {
    let sink!: PageSink;
    const load = async (s?: PageSink) => {
      sink = s!;
      return [film(10, "Whiplash", { score: 88 })].map(mapTrackingEntry);
    };
    render(<LibraryView load={load} />);
    expect(await completed()).toEqual(["Whiplash"]);

    act(() => sink.page([film(11, "Arrival", { score: 95 })].map(mapTrackingEntry)));

    expect(await completed()).toEqual(["Arrival", "Whiplash"]);
  });

  // A row the user has already changed here is newer than any page.
  it("keeps a row it already holds rather than the page's copy", async () => {
    let sink!: PageSink;
    const load = async (s?: PageSink) => {
      sink = s!;
      return [film(10, "Whiplash", { score: 88 })].map(mapTrackingEntry);
    };
    render(<LibraryView load={load} />);
    await completed();

    act(() =>
      sink.page([film(10, "Whiplash (stale)", { score: 10 })].map(mapTrackingEntry))
    );

    expect(await completed()).toEqual(["Whiplash"]);
  });

  it("says so, with a retry, when a later page fails", async () => {
    let sink!: PageSink;
    const load = async (s?: PageSink) => {
      sink = s!;
      return [film(10, "Whiplash", {})].map(mapTrackingEntry);
    };
    render(<LibraryView load={load} />);
    await completed();

    act(() => sink.failed());

    expect(toast).toHaveBeenCalledWith(
      "Could not load all of your library",
      expect.objectContaining({ action: expect.objectContaining({ label: "Try again" }) })
    );
  });

  it("stops listening once it has gone", async () => {
    let sink!: PageSink;
    const load = async (s?: PageSink) => {
      sink = s!;
      return [];
    };
    const { unmount } = render(<LibraryView load={load} />);
    await waitFor(() => expect(sink).toBeDefined());
    unmount();
    expect(sink.live()).toBe(false);
  });
});

describe("LibraryView Surprise me", () => {
  beforeEach(() => {
    window.localStorage.clear();
    toast.mockReset();
  });

  it("shows a planned pick as a card to open or start, not the edit dialog", async () => {
    const rows = [
      film(20, "Heat", { status: "completed" }),
      film(21, "Dune", { status: "planning" }),
    ];
    const onStatusChange = vi.fn(() => Promise.resolve());
    const user = userEvent.setup();
    render(
      <LibraryView load={async () => rows.map(mapTrackingEntry)} onStatusChange={onStatusChange} />
    );
    await screen.findByRole("heading", { name: /Completed/ });

    await user.click(screen.getAllByRole("button", { name: /Surprise me/ })[0]);

    const card = await screen.findByRole("dialog");
    expect(within(card).getByRole("heading", { name: "Dune" })).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: "Open" })).toHaveAttribute("href", "/movie/21");
    expect(within(card).queryByRole("textbox", { name: "Score" })).toBeNull();

    await user.click(within(card).getByRole("button", { name: "Start watching" }));
    expect(onStatusChange).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Dune" }),
      "watching"
    );
  });

  it("says so when nothing is planned or being watched", async () => {
    const user = userEvent.setup();
    render(<LibraryView load={async () => [film(20, "Heat")].map(mapTrackingEntry)} />);
    await screen.findByRole("heading", { name: /Completed/ });

    await user.click(screen.getAllByRole("button", { name: /Surprise me/ })[0]);

    expect(toast).toHaveBeenCalledWith("Nothing in Planning or Watching to pick from");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
