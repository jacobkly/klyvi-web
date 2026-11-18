import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { mapTrackingEntry } from "@/lib/api/map";
import { writePref } from "@/lib/local-prefs";
import type { WireTrackingEntry } from "@/lib/api/wire";

import { LibraryView } from "./library-view";

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
