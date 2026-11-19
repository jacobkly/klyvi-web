import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mapTrackingEntry } from "@/lib/api/map";
import type { PageSink } from "@/lib/api/tracking";
import { writePref } from "@/lib/local-prefs";
import type { WireTrackingEntry } from "@/lib/api/wire";
import type { LibraryEntry, Scored, UserProfile } from "@/lib/types";

import { HomeClient } from "./home-client";

const getFeed = vi.fn();
const listTracking = vi.fn();
const addTracking = vi.fn();
const updateTracking = vi.fn();
const listInteractions = vi.fn();
const recordInteraction = vi.fn();
const toast = vi.fn();
let session: {
  profile: Partial<UserProfile> | null;
  user: { user_metadata: Record<string, unknown> } | null;
} = { profile: null, user: null };

vi.mock("@/lib/api/reco", () => ({
  getFeed: (...a: unknown[]) => getFeed(...a),
}));
vi.mock("@/lib/api/tracking", () => ({
  listTrackingPaged: (...a: unknown[]) => listTracking(...a),
  addTracking: (...a: unknown[]) => addTracking(...a),
  updateTracking: (...a: unknown[]) => updateTracking(...a),
}));
vi.mock("@/lib/api/interactions", () => ({
  listInteractions: (...a: unknown[]) => listInteractions(...a),
  recordInteraction: (...a: unknown[]) => recordInteraction(...a),
}));
vi.mock("@/lib/track-show", () => ({ trackFirstUntrackedSeason: vi.fn() }));
vi.mock("@/lib/interactions-batch", () => ({ queueSignal: vi.fn() }));
vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => session,
}));
vi.mock("sonner", () => ({ toast: (...a: unknown[]) => toast(...a) }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/home",
}));

function entry(over: Partial<LibraryEntry>): LibraryEntry {
  return {
    mediaId: 1,
    mediaType: "season",
    tmdbId: 95396,
    title: "Severance",
    posterPath: null,
    year: 2022,
    seasonNumber: 2,
    status: "watching",
    score: null,
    progress: 4,
    progressTotal: null,
    notes: null,
    favorite: false,
    updatedAt: "2026-09-01T00:00:00Z",
    ...over,
  };
}

function pick(over: Partial<Scored>): Scored {
  return {
    mediaId: 7,
    mediaType: "movie",
    tmdbId: 496243,
    title: "Parasite",
    posterPath: null,
    backdropPath: null,
    year: 2019,
    voteAverage: 8.5,
    overview: null,
    runtime: null,
    seasonCount: null,
    genres: [],
    reasons: [],
    ...over,
  };
}

/** Picks 1..n, titled "Film 1".."Film n". */
function picks(n: number, over: (i: number) => Partial<Scored> = () => ({})): Scored[] {
  return Array.from({ length: n }, (_, k) =>
    pick({ mediaId: k + 1, tmdbId: 1000 + k, title: `Film ${k + 1}`, ...over(k + 1) })
  );
}

/** A request that never lands, standing in for a slow feed. */
const pending = () => new Promise<never>(() => {});

function heroOf() {
  return screen.getByRole("region", { name: "Tonight's pick" });
}

describe("HomeClient", () => {
  beforeEach(() => {
    session = { profile: null, user: null };
    getFeed.mockReset().mockResolvedValue([]);
    listTracking.mockReset().mockResolvedValue([]);
    addTracking.mockReset().mockResolvedValue(undefined);
    updateTracking.mockReset().mockResolvedValue(undefined);
    listInteractions.mockReset().mockResolvedValue([]);
    recordInteraction.mockReset().mockResolvedValue(undefined);
    toast.mockReset();
    window.localStorage.clear();
  });

  describe("the greeting", () => {
    it("uses the display name", async () => {
      session = {
        profile: { username: "jk_films" },
        user: { user_metadata: { full_name: "Jacob Klymenko" } },
      };
      render(<HomeClient />);
      expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
        /^(Morning|Afternoon|Evening), Jacob$/
      );
    });

    it("uses no name when there is none", async () => {
      render(<HomeClient />);
      expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
        /^(Morning|Afternoon|Evening)$/
      );
    });

    it("never uses the handle Klyvi generated", async () => {
      session = { profile: { username: "user_3f9a0c12" }, user: { user_metadata: {} } };
      render(<HomeClient />);
      expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
        /^(Morning|Afternoon|Evening)$/
      );
    });
  });

  describe("the hero", () => {
    it("leads with the top pick and its strongest reason", async () => {
      getFeed.mockResolvedValue([
        pick({ reasons: [{ kind: "because", id: 155, name: "The Dark Knight" }] }),
      ]);
      render(<HomeClient />);
      await screen.findByRole("region", { name: "Tonight's pick" });
      expect(within(heroOf()).getByRole("link", { name: "Parasite" })).toHaveAttribute(
        "href",
        "/movie/496243"
      );
      expect(
        within(heroOf()).getByText("because you liked The Dark Knight")
      ).toBeInTheDocument();
    });

    it("leads with the next of the top few on the next visit", async () => {
      window.localStorage.setItem("klyvi:hero-turn", "1");
      getFeed.mockResolvedValue(picks(6));
      render(<HomeClient />);
      await screen.findByRole("region", { name: "Tonight's pick" });
      expect(within(heroOf()).getByRole("heading", { name: "Film 2" })).toBeInTheDocument();
      expect(window.localStorage.getItem("klyvi:hero-turn")).toBe("2");
    });

    it("adds the pick to the watchlist and brings in the next one", async () => {
      getFeed.mockResolvedValue(picks(3));
      render(<HomeClient />);
      await screen.findByRole("region", { name: "Tonight's pick" });

      await userEvent.click(within(heroOf()).getByRole("button", { name: "Add" }));

      expect(addTracking).toHaveBeenCalledWith({
        tmdbId: 1000,
        mediaType: "movie",
        status: "planning",
      });
      expect(toast).toHaveBeenCalledWith("Added Film 1 to your watchlist");
      expect(within(heroOf()).getByRole("heading", { name: "Film 2" })).toBeInTheDocument();
    });

    it("hides a pick that is not for you", async () => {
      getFeed.mockResolvedValue(picks(2));
      render(<HomeClient />);
      await screen.findByRole("region", { name: "Tonight's pick" });

      vi.useFakeTimers({ shouldAdvanceTime: true });
      try {
        await userEvent.click(
          within(heroOf()).getByRole("button", { name: "Not for me" })
        );
        expect(within(heroOf()).getByRole("heading", { name: "Film 2" })).toBeInTheDocument();
        // Held for the undo window, then written.
        expect(recordInteraction).not.toHaveBeenCalledWith(
          expect.objectContaining({ kind: "dismissed" })
        );
        vi.advanceTimersByTime(5000);
        expect(recordInteraction).toHaveBeenCalledWith(
          expect.objectContaining({ tmdbId: 1000, kind: "dismissed", source: "feed" })
        );
      } finally {
        vi.useRealTimers();
      }
    });

    it("brings a hidden pick back with Undo", async () => {
      getFeed.mockResolvedValue(picks(2));
      render(<HomeClient />);
      await screen.findByRole("region", { name: "Tonight's pick" });

      await userEvent.click(
        within(heroOf()).getByRole("button", { name: "Not for me" })
      );
      const [message, options] = toast.mock.calls.at(-1) as [
        string,
        { action: { label: string; onClick: () => void } },
      ];
      expect(message).toBe("Hid Film 1 from your recommendations");
      expect(options.action.label).toBe("Undo");

      act(() => options.action.onClick());

      expect(within(heroOf()).getByRole("heading", { name: "Film 1" })).toBeInTheDocument();
      expect(toast).toHaveBeenCalledWith("Film 1 is back in your picks");
    });

    it("asks how it was when you've seen it", async () => {
      getFeed.mockResolvedValue(picks(2));
      render(<HomeClient />);
      await screen.findByRole("region", { name: "Tonight's pick" });

      await userEvent.click(within(heroOf()).getByRole("button", { name: "Seen it" }));

      expect(await screen.findByRole("dialog")).toBeInTheDocument();
      expect(addTracking).not.toHaveBeenCalled();
    });

    it("keeps the hero's picks out of the Top picks row", async () => {
      getFeed.mockResolvedValue(picks(6));
      render(<HomeClient />);
      await screen.findByRole("region", { name: "Tonight's pick" });
      const rail = screen
        .getByRole("heading", { name: "Top picks for you" })
        .closest("section")!;
      expect(within(rail).getAllByText("Film 5")).not.toHaveLength(0);
      expect(within(rail).getAllByText("Film 6")).not.toHaveLength(0);
      expect(within(rail).queryByText("Film 1")).toBeNull();
    });

    it("groups picks into a row by the title they share", async () => {
      const knight = { kind: "because" as const, id: 155, name: "The Dark Knight" };
      getFeed.mockResolvedValue(picks(5, () => ({ reasons: [knight] })));
      render(<HomeClient />);
      expect(
        await screen.findByRole("heading", { name: "Because you liked The Dark Knight" })
      ).toBeInTheDocument();
    });
  });

  it("paints the library sections while the feed is still loading", async () => {
    getFeed.mockImplementation(pending);
    listTracking.mockResolvedValue([entry({})]);
    render(<HomeClient />);

    expect(await screen.findAllByText(/Severance/)).not.toHaveLength(0);
    expect(screen.getByRole("status", { name: "Loading your picks" })).toBeInTheDocument();
    // The picks are still loading, so neither their empty nor error copy
    // has been written yet.
    expect(screen.queryByText(/Nothing to pick from yet/)).toBeNull();
    expect(screen.queryByText(/Could not load your picks/)).toBeNull();
  });

  describe("continue watching", () => {
    const wire = {
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
    } as WireTrackingEntry;

    it("says which episode you're on, out of the season's total", async () => {
      listTracking.mockResolvedValue([mapTrackingEntry(wire)]);
      render(<HomeClient />);
      expect(await screen.findByText("Episode 3 of 10")).toBeInTheDocument();
    });

    it("moves on an episode with +1", async () => {
      listTracking.mockResolvedValue([mapTrackingEntry(wire)]);
      render(<HomeClient />);
      await userEvent.click(
        await screen.findByRole("button", {
          name: "Mark episode 4 of Breaking Bad Season 1 watched",
        })
      );
      expect(updateTracking).toHaveBeenCalledWith(955, { episodeProgress: 4 });
      expect(screen.getByText("Episode 4 of 10")).toBeInTheDocument();
    });

    it("finishes the season on its last episode", async () => {
      listTracking.mockResolvedValue([
        mapTrackingEntry({ ...wire, episode_progress: 9 }),
      ]);
      render(<HomeClient />);
      await userEvent.click(
        await screen.findByRole("button", { name: /Mark episode 10 of/ })
      );
      expect(updateTracking).toHaveBeenCalledWith(955, {
        episodeProgress: 10,
        status: "completed",
      });
      expect(toast).toHaveBeenCalledWith("Season 1 finished");
    });

    it("puts the count back when the write fails", async () => {
      updateTracking.mockRejectedValue(new Error("503"));
      listTracking.mockResolvedValue([mapTrackingEntry(wire)]);
      render(<HomeClient />);
      await userEvent.click(await screen.findByRole("button", { name: /Mark episode 4/ }));
      expect(await screen.findByText("Episode 3 of 10")).toBeInTheDocument();
      expect(toast).toHaveBeenCalledWith("Could not update that. Try again");
    });
  });

  it("lists only planned titles with a release date ahead in Coming up", async () => {
    listTracking.mockResolvedValue([
      entry({ mediaId: 1, mediaType: "movie", title: "Far Off", status: "planning", releaseDate: "2099-01-02" }),
      entry({ mediaId: 2, mediaType: "movie", title: "Undated", status: "planning", releaseDate: null }),
      entry({ mediaId: 3, mediaType: "movie", title: "Long Out", status: "planning", releaseDate: "2001-05-05" }),
    ]);
    render(<HomeClient />);

    const section = (
      await screen.findByRole("heading", { name: "Coming up" })
    ).closest("section")!;
    expect(within(section).getAllByText("Far Off")).not.toHaveLength(0);
    expect(within(section).getByText("Out 2 January 2099")).toBeInTheDocument();
    expect(within(section).queryByText("Undated")).toBeNull();
    expect(within(section).queryByText("Long Out")).toBeNull();
  });

  describe("recent activity", () => {
    it("shows each change with its poster and score, linked to the title", async () => {
      listTracking.mockResolvedValue([
        entry({
          mediaId: 1,
          mediaType: "movie",
          tmdbId: 496243,
          title: "Parasite",
          seasonNumber: undefined,
          posterPath: "/parasite.jpg",
          status: "completed",
          score: 95,
        }),
      ]);
      render(<HomeClient />);

      const section = (
        await screen.findByRole("heading", { name: "Recent activity" })
      ).closest("section")!;
      const line = within(section).getByRole("link", { name: /You rated Parasite/ });
      expect(line).toHaveAttribute("href", "/movie/496243");
      expect(line).toHaveTextContent("95");
      expect(line.querySelector("img")).not.toBeNull();
    });

    it("leaves out the statuses switched off in settings", async () => {
      writePref("activityFeed", { planning: false });
      listTracking.mockResolvedValue([
        entry({ mediaId: 1, mediaType: "movie", title: "Dune", status: "planning" }),
        entry({ mediaId: 2, mediaType: "movie", title: "Arrival", status: "completed" }),
      ]);
      render(<HomeClient />);

      const heading = await screen.findByRole("heading", { name: "Recent activity" });
      const section = heading.closest("section")!;
      expect(await within(section).findByText(/Arrival/)).toBeInTheDocument();
      expect(within(section).queryByText(/Dune/)).toBeNull();
    });
  });

  it("shows the keywords that recur in the picks, never genres", async () => {
    const noir = { kind: "keyword" as const, id: 1, name: "neo-noir" };
    const drama = { kind: "genre" as const, id: 18, name: "Drama" };
    getFeed.mockResolvedValue(picks(3, () => ({ reasons: [noir, drama] })));
    render(<HomeClient />);
    const taste = await screen.findByRole("region", { name: "Your taste" });
    expect(within(taste).getByText("Neo-Noir")).toBeInTheDocument();
    expect(within(taste).queryByText("Drama")).toBeNull();
  });

  it("adds the library's next page when it lands", async () => {
    let sink!: PageSink;
    listTracking.mockImplementation(async (s: PageSink) => {
      sink = s;
      return [entry({ mediaId: 1, title: "Severance" })];
    });
    render(<HomeClient />);
    expect(await screen.findAllByText(/Severance/)).not.toHaveLength(0);

    act(() => sink.page([entry({ mediaId: 2, title: "Andor" })]));

    expect(await screen.findAllByText(/Andor/)).not.toHaveLength(0);
  });

  it("shows the library error when a later page fails, not a short list", async () => {
    let sink!: PageSink;
    listTracking.mockImplementation(async (s: PageSink) => {
      sink = s;
      return [entry({})];
    });
    render(<HomeClient />);
    await screen.findAllByText(/Severance/);

    act(() => sink.failed());

    expect(
      await screen.findByText("Could not load your library right now.")
    ).toBeInTheDocument();
  });

  it("asks only for ratings to count them", async () => {
    render(<HomeClient />);
    await waitFor(() => expect(listInteractions).toHaveBeenCalledWith({ kind: "rated" }));
  });

  it("keeps the picks when the library fails", async () => {
    getFeed.mockResolvedValue([pick({})]);
    listTracking.mockRejectedValue(new Error("boom"));
    render(<HomeClient />);

    expect(await screen.findByRole("link", { name: "Parasite" })).toBeInTheDocument();
    expect(
      screen.getByText("Could not load your library right now.")
    ).toBeInTheDocument();
  });

  it("links a show pick to its series page, not a film page", async () => {
    getFeed.mockResolvedValue([
      pick({ mediaId: 9, mediaType: "tv", tmdbId: 1399, title: "Game of Thrones" }),
    ]);
    render(<HomeClient />);

    expect(
      await screen.findByRole("link", { name: "Game of Thrones" })
    ).toHaveAttribute("href", "/tv/1399");
  });

  it("offers a retry only when both pillars are down", async () => {
    getFeed.mockRejectedValueOnce(new Error("boom"));
    listTracking.mockRejectedValueOnce(new Error("boom"));
    listTracking.mockResolvedValueOnce([entry({})]);
    render(<HomeClient />);

    const retry = await screen.findByRole("button", { name: "Try again" });
    retry.click();
    expect(await screen.findAllByText(/Severance/)).not.toHaveLength(0);
    expect(getFeed).toHaveBeenCalledTimes(2);
    expect(listTracking).toHaveBeenCalledTimes(2);
  });

  it("keeps the taste nudge away once dismissed, on later visits too", async () => {
    const nudge = "Klyvi does not know your taste yet";
    const { unmount } = render(<HomeClient />);
    expect(await screen.findByText(nudge)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText(nudge)).toBeNull();
    unmount();

    render(<HomeClient />);
    await expect(
      screen.findByText(nudge, undefined, { timeout: 300 })
    ).rejects.toThrow();
  });
});
