import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Scored } from "@/lib/types";

import { FindClient } from "./find-client";

const getFeed = vi.fn();
const getMovie = vi.fn();
const recordInteraction = vi.fn();
const addTracking = vi.fn();
const listTracking = vi.fn();
const getTvSeries = vi.fn();
const queueSignal = vi.fn();
const toast = vi.fn();
const push = vi.fn();

vi.mock("@/lib/api/reco", () => ({
  getFeed: (...a: unknown[]) => getFeed(...a),
}));
vi.mock("@/lib/api/catalog", () => ({
  getMovie: (...a: unknown[]) => getMovie(...a),
  getTvSeries: (...a: unknown[]) => getTvSeries(...a),
}));
vi.mock("@/lib/api/interactions", () => ({
  listInteractions: vi.fn(() => Promise.resolve([])),
  recordInteraction: (...a: unknown[]) => recordInteraction(...a),
}));
vi.mock("@/lib/api/tracking", () => ({
  addTracking: (...a: unknown[]) => addTracking(...a),
  listTracking: (...a: unknown[]) => listTracking(...a),
}));
vi.mock("sonner", () => ({
  toast: (...a: unknown[]) => toast(...a),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));
vi.mock("@/lib/interactions-batch", () => ({
  queueSignal: (...a: unknown[]) => queueSignal(...a),
}));
vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => ({ user: { id: "u1" } }),
}));

function pick(over: Partial<Scored>): Scored {
  return {
    mediaId: 1,
    mediaType: "movie",
    tmdbId: 1,
    title: "Untitled",
    posterPath: null,
    backdropPath: null,
    year: 2010,
    voteAverage: 7.5,
    overview: null,
    runtime: null,
    seasonCount: null,
    genres: [],
    reasons: [],
    ...over,
  };
}

const SHOW = pick({
  mediaId: 9,
  mediaType: "tv",
  tmdbId: 1399,
  title: "Game of Thrones",
  seasonCount: 8,
  genres: ["Drama"],
});

const FEED: Scored[] = [
  pick({
    mediaId: 1,
    tmdbId: 11423,
    title: "Memories of Murder",
    runtime: 131,
    genres: ["Crime", "Drama"],
    overview: "Two detectives hunt a killer in rural Korea.",
  }),
  pick({
    mediaId: 2,
    tmdbId: 496243,
    title: "Parasite",
    runtime: 133,
    genres: ["Comedy", "Thriller", "Drama"],
  }),
  pick({
    mediaId: 3,
    tmdbId: 1018,
    title: "Mulholland Drive",
    runtime: 147,
    genres: ["Mystery", "Drama"],
  }),
  pick({
    mediaId: 4,
    tmdbId: 598,
    title: "City of God",
    runtime: 118,
    genres: ["Crime", "Drama"],
  }),
];

describe("FindClient", () => {
  beforeEach(() => {
    // Each test starts on an entry that never showed picks.
    window.history.replaceState(null, "");
    getFeed.mockReset().mockResolvedValue(FEED);
    getMovie.mockReset().mockResolvedValue(null);
    recordInteraction.mockReset().mockResolvedValue(undefined);
    addTracking.mockReset().mockResolvedValue(undefined);
    listTracking.mockReset().mockResolvedValue([]);
    getTvSeries.mockReset().mockResolvedValue({
      seasons: [1, 2, 3, 4, 5, 6, 7, 8].map((seasonNumber) => ({ seasonNumber })),
    });
    queueSignal.mockReset();
    toast.mockReset();
    push.mockReset();
    window.localStorage.clear();
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** The options passed with the most recent toast. */
  function lastToast() {
    return toast.mock.calls.at(-1) as [
      string,
      { duration?: number; action?: { label: string; onClick: () => void } }?,
    ];
  }

  async function showFeed() {
    render(<FindClient />);
    fireEvent.click(screen.getByRole("button", { name: /Find something/ }));
    await screen.findByRole("heading", { name: "Memories of Murder" });
  }

  /** The "Track seasons" action on the most recent toast. */
  function trackSeasonsAction() {
    const options = toast.mock.calls.at(-1)?.[1] as
      | { action?: { label: string; onClick: () => void } }
      | undefined;
    return options?.action;
  }

  async function showPick() {
    getFeed.mockResolvedValue([SHOW]);
    render(<FindClient />);
    fireEvent.click(screen.getByRole("button", { name: /Find something/ }));
    await screen.findByRole("heading", { name: "Game of Thrones" });
  }

  it("links a show to its series page and gives its season count", async () => {
    await showPick();

    expect(screen.getByRole("link", { name: "More about it" })).toHaveAttribute(
      "href",
      "/tv/1399"
    );
    // The poster and the title are both links to the show.
    const titleLinks = screen.getAllByRole("link", { name: "Game of Thrones" });
    expect(titleLinks.length).toBeGreaterThan(0);
    for (const link of titleLinks) {
      expect(link).toHaveAttribute("href", "/tv/1399");
    }
    expect(screen.getByText(/8 seasons/)).toBeInTheDocument();
    expect(queueSignal).toHaveBeenCalledWith(
      expect.objectContaining({ tmdbId: 1399, mediaType: "tv", kind: "impression" })
    );
  });

  it("records dismissing a show as a tv interaction", async () => {
    await showPick();
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "Not interested" }));
    vi.advanceTimersByTime(5000);

    expect(recordInteraction).toHaveBeenCalledWith(
      expect.objectContaining({ tmdbId: 1399, mediaType: "tv", kind: "dismissed" })
    );
  });

  it("holds a hidden pick for five seconds and Undo puts it back unwritten", async () => {
    await showFeed();
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "Not interested" }));

    expect(screen.queryByRole("heading", { name: "Memories of Murder" })).toBeNull();
    const [message, options] = lastToast();
    expect(message).toBe("Hid Memories of Murder from your recommendations");
    expect(options?.duration).toBe(5000);
    expect(options?.action?.label).toBe("Undo");

    act(() => options?.action?.onClick());
    vi.advanceTimersByTime(5000);

    expect(screen.getByRole("heading", { name: "Memories of Murder" })).toBeInTheDocument();
    expect(screen.getByText("1 of 4", { exact: false })).toBeInTheDocument();
    expect(toast).toHaveBeenCalledWith("Memories of Murder is back in your picks");
    expect(recordInteraction).not.toHaveBeenCalledWith(
      expect.objectContaining({ kind: "dismissed" })
    );
  });

  it("writes the hide once the undo window has passed", async () => {
    await showFeed();
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "Not interested" }));
    expect(recordInteraction).not.toHaveBeenCalled();

    vi.advanceTimersByTime(5000);

    expect(recordInteraction).toHaveBeenCalledWith(
      expect.objectContaining({ tmdbId: 11423, kind: "dismissed", source: "feed" })
    );
  });

  it("swipes between picks sideways and leaves vertical drags to the page", async () => {
    await showFeed();
    const stage = document.querySelector('[data-slot="pick-stage"]') as HTMLElement;
    const drag = (dx: number, dy: number) => {
      fireEvent.touchStart(stage, { touches: [{ clientX: 200, clientY: 300 }] });
      fireEvent.touchMove(stage, { touches: [{ clientX: 200 + dx, clientY: 300 + dy }] });
      fireEvent.touchEnd(stage);
    };

    drag(-12, -120);
    expect(screen.getByRole("heading", { name: "Memories of Murder" })).toBeInTheDocument();

    drag(-120, 8);
    expect(screen.queryByRole("heading", { name: "Memories of Murder" })).toBeNull();

    drag(120, 0);
    expect(screen.getByRole("heading", { name: "Memories of Murder" })).toBeInTheDocument();
  });

  it("refills the set from the rest of the feed after an action", async () => {
    render(<FindClient />);
    fireEvent.click(screen.getByRole("button", { name: "3" }));
    fireEvent.click(screen.getByRole("button", { name: /Find something/ }));
    await screen.findByRole("heading", { name: "Memories of Murder" });
    expect(screen.getByRole("heading", { name: /Your 3 picks/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add to watchlist" }));

    expect(screen.getByRole("heading", { name: /Your 3 picks/ })).toBeInTheDocument();
    expect(screen.queryByText(/set is getting smaller/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Next pick" }));
    fireEvent.click(screen.getByRole("button", { name: "Next pick" }));
    expect(screen.getByRole("heading", { name: "City of God" })).toBeInTheDocument();
  });

  it("says the set is shrinking once nothing is left to refill it", async () => {
    await showFeed();
    fireEvent.click(screen.getByRole("button", { name: "Add to watchlist" }));

    expect(screen.getByRole("heading", { name: /Your 3 picks/ })).toBeInTheDocument();
    expect(screen.getByText(/set is getting smaller/)).toBeInTheDocument();
  });

  it("brings the next pick into view after an action", async () => {
    await showFeed();
    fireEvent.click(screen.getByRole("button", { name: "Add to watchlist" }));

    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalled());
  });

  it("names the title in the save toast", async () => {
    await showFeed();
    fireEvent.click(screen.getByRole("button", { name: "Add to watchlist" }));

    expect(toast).toHaveBeenCalledWith("Added Memories of Murder to your watchlist");
  });

  it("records rating a show as a tv interaction and never tracks it as a film", async () => {
    await showPick();
    fireEvent.click(screen.getByRole("button", { name: "Seen it" }));
    fireEvent.click(await screen.findByRole("button", { name: "Save rating" }));

    expect(recordInteraction).toHaveBeenCalledWith(
      expect.objectContaining({ tmdbId: 1399, mediaType: "tv", kind: "rated" })
    );
    expect(addTracking).not.toHaveBeenCalledWith(
      expect.objectContaining({ mediaType: "movie" })
    );
  });

  it("never saves a show as a film", async () => {
    await showPick();
    fireEvent.click(screen.getByRole("button", { name: "Add to watchlist" }));

    expect(recordInteraction).toHaveBeenCalledWith(
      expect.objectContaining({ tmdbId: 1399, mediaType: "tv", kind: "saved" })
    );
    expect(addTracking).not.toHaveBeenCalledWith(
      expect.objectContaining({ mediaType: "movie" })
    );
  });

  it("saves a show by tracking its first untracked season as Planning", async () => {
    listTracking.mockResolvedValue([
      { mediaType: "season", tmdbId: 1399, seasonNumber: 1 },
      { mediaType: "season", tmdbId: 95396, seasonNumber: 2 },
    ]);
    await showPick();
    fireEvent.click(screen.getByRole("button", { name: "Add to watchlist" }));

    await waitFor(() =>
      expect(addTracking).toHaveBeenCalledWith({
        tmdbId: 1399,
        mediaType: "season",
        seasonNumber: 2,
        status: "planning",
      })
    );
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        "Added Game of Thrones season 2 to your watchlist",
        expect.anything()
      )
    );
    expect(trackSeasonsAction()?.label).toBe("Track seasons");
  });

  it("marks a show seen as a series signal, drops it, and offers its seasons", async () => {
    await showPick();
    fireEvent.click(screen.getByRole("button", { name: "Seen it" }));
    fireEvent.click(await screen.findByRole("button", { name: "Just mark it seen" }));

    expect(recordInteraction).toHaveBeenCalledWith(
      expect.objectContaining({ tmdbId: 1399, mediaType: "tv", kind: "logged" })
    );
    expect(addTracking).not.toHaveBeenCalled();
    expect(screen.queryByRole("heading", { name: "Game of Thrones" })).toBeNull();

    const action = trackSeasonsAction();
    expect(action?.label).toBe("Track seasons");
    action?.onClick();
    expect(push).toHaveBeenCalledWith("/tv/1399");
  });

  it("says so when a rated film fails to reach the library", async () => {
    addTracking.mockRejectedValue(new Error("network"));
    render(<FindClient />);
    fireEvent.click(screen.getByRole("button", { name: /Find something/ }));
    await screen.findByRole("heading", { name: "Memories of Murder" });
    fireEvent.click(screen.getByRole("button", { name: "Seen it" }));
    fireEvent.click(await screen.findByRole("button", { name: "Save rating" }));

    expect(toast).toHaveBeenCalledWith("Rated Memories of Murder 75");
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        "Could not add that to your library. Try again"
      )
    );
  });

  it("asks for films and shows by default, and no longer says films only", async () => {
    render(<FindClient />);
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.queryByText(/Films only/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Find something/ }));

    await screen.findByRole("heading", { name: "Memories of Murder" });
    expect(getFeed).toHaveBeenCalledWith({ media: "all" });
  });

  it("asks for shows only when TV is chosen, and remembers the choice", async () => {
    getFeed.mockResolvedValue([SHOW]);
    const first = render(<FindClient />);
    fireEvent.click(screen.getByRole("button", { name: "TV" }));
    fireEvent.click(screen.getByRole("button", { name: /Find something/ }));

    await screen.findByRole("heading", { name: "Game of Thrones" });
    expect(getFeed).toHaveBeenCalledWith({ media: "tv" });
    first.unmount();
    // A new visit, rather than Back to the picks.
    window.history.pushState(null, "", "/find");

    render(<FindClient />);
    expect(screen.getByRole("button", { name: "TV" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("keeps Under 2 hours to films and says so", async () => {
    render(<FindClient />);
    fireEvent.click(screen.getByRole("button", { name: "Under 2 hours" }));
    expect(screen.getByText("Under 2 hours picks films only.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "TV" }));
    expect(screen.getByRole("button", { name: "Under 2 hours" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Anything" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByText("Under 2 hours picks films only.")).toBeInTheDocument();
  });

  it("asks for the films feed for Under 2 hours, even with All chosen", async () => {
    render(<FindClient />);
    fireEvent.click(screen.getByRole("button", { name: "Under 2 hours" }));
    fireEvent.click(screen.getByRole("button", { name: /Find something/ }));

    await screen.findByRole("heading", { name: "City of God" });
    expect(getFeed).toHaveBeenCalledWith({ media: "movie" });
  });

  it("shows the pick's synopsis, genres, and runtime straight from the feed", async () => {
    render(<FindClient />);
    fireEvent.click(screen.getByRole("button", { name: /Find something/ }));

    expect(
      await screen.findByText("Two detectives hunt a killer in rural Korea.")
    ).toBeInTheDocument();
    expect(screen.getByText(/Crime · Drama/)).toBeInTheDocument();
    expect(getMovie).not.toHaveBeenCalled();
  });

  it("filters a mood with one feed request and no per-pick lookups", async () => {
    render(<FindClient />);
    fireEvent.click(screen.getByRole("button", { name: "Under 2 hours" }));
    fireEvent.click(screen.getByRole("button", { name: /Find something/ }));

    expect(
      await screen.findByRole("heading", { name: "City of God" })
    ).toBeInTheDocument();
    // Only the 118-minute film fits, so the set is a single pick.
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /^Your pick for/
    );
    expect(getFeed).toHaveBeenCalledTimes(1);
    expect(getMovie).not.toHaveBeenCalled();
  });

  it("reads the slow-burn lens from the feed's genres and reasons", async () => {
    getFeed.mockResolvedValue([
      pick({
        mediaId: 5,
        tmdbId: 155,
        title: "The Dark Knight",
        genres: ["Action", "Drama"],
        reasons: [{ kind: "keyword", id: 9826, name: "slow burn" }],
      }),
      pick({
        mediaId: 6,
        tmdbId: 562,
        title: "Die Hard",
        genres: ["Action", "Thriller"],
      }),
    ]);
    render(<FindClient />);
    fireEvent.click(screen.getByRole("button", { name: "Slow burn" }));
    fireEvent.click(screen.getByRole("button", { name: /Find something/ }));

    expect(
      await screen.findByRole("heading", { name: "The Dark Knight" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Die Hard" })).toBeNull();
    expect(getMovie).not.toHaveBeenCalled();
  });

  it("answers a show's save at once, before the season is known", async () => {
    listTracking.mockReturnValue(new Promise(() => {}));
    await showPick();
    fireEvent.click(screen.getByRole("button", { name: "Add to watchlist" }));

    expect(toast).toHaveBeenCalledWith("Adding Game of Thrones to your watchlist");
    expect(screen.queryByRole("heading", { name: "Game of Thrones" })).toBeNull();
  });

  it("goes back from the picks to the mood step", async () => {
    // Earlier tests left their own picks entries in jsdom's shared history.
    window.history.pushState(null, "", "/find");
    await showPick();
    expect(window.history.state?.findStage).toBe("picks");

    window.history.back();

    expect(
      await screen.findByRole("heading", { name: "What are you in the mood for?" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Game of Thrones" })).toBeNull();
  });

  it("shows the same pick again after Back from its page", async () => {
    window.history.pushState(null, "", "/find");
    const { unmount } = render(<FindClient />);
    fireEvent.click(screen.getByRole("button", { name: "Heavy" }));
    fireEvent.click(screen.getByRole("button", { name: /Find something/ }));
    await screen.findByRole("heading", { name: "Memories of Murder" });
    fireEvent.keyDown(window, { key: "ArrowRight" });
    await screen.findByRole("heading", { name: "Mulholland Drive" });
    // The page goes away while its history entry stays.
    unmount();
    getFeed.mockClear();

    render(<FindClient />);
    expect(screen.getByRole("heading", { name: "Mulholland Drive" })).toBeInTheDocument();
    expect(getFeed).not.toHaveBeenCalled();
  });

  it("starts at the moods on a fresh visit, whatever was shown before", async () => {
    await showPick();
    cleanup();
    window.history.pushState(null, "", "/find");
    render(<FindClient />);
    expect(
      screen.getByRole("heading", { name: "What are you in the mood for?" })
    ).toBeInTheDocument();
  });

  it("turns a show's save toast into an error when the save fails", async () => {
    toast.mockReturnValue("t1");
    listTracking.mockRejectedValue(new Error("503"));
    await showPick();
    fireEvent.click(screen.getByRole("button", { name: "Add to watchlist" }));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Could not update that. Try again", {
        id: "t1",
      })
    );
  });

  describe("as the desktop pop-up", () => {
    const pickHeading = (name: string) =>
      screen.findByRole("heading", { level: 2, name });

    async function showPopUp() {
      render(<FindClient embedded />);
      fireEvent.click(screen.getByRole("button", { name: /Find something/ }));
      await pickHeading("Memories of Murder");
    }

    it("marks the chosen mood and keeps one chosen", () => {
      render(<FindClient embedded />);
      const slow = screen.getByRole("button", { name: "Slow burn" });
      expect(screen.getByRole("button", { name: "Anything" })).toHaveAttribute("aria-pressed", "true");
      fireEvent.click(slow);
      expect(slow).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: "Anything" })).toHaveAttribute("aria-pressed", "false");
    });

    it("turns Under 2 hours off for TV, and says why", () => {
      render(<FindClient embedded />);
      fireEvent.click(screen.getByRole("button", { name: "TV" }));
      expect(screen.getByRole("button", { name: "Under 2 hours" })).toBeDisabled();
      expect(screen.getByText("Under 2 hours picks films only.")).toBeInTheDocument();
    });

    it("adds no history entry, so Back still leaves the page behind it", async () => {
      const pushState = vi.spyOn(window.history, "pushState");
      await showPopUp();
      expect(pushState).not.toHaveBeenCalled();
      pushState.mockRestore();
    });

    it("reopens on the same pick, and starts fresh once the mood step is back", async () => {
      await showPopUp();
      fireEvent.keyDown(window, { key: "ArrowRight" });
      await pickHeading("Parasite");
      cleanup();
      render(<FindClient embedded />);
      await pickHeading("Parasite");

      fireEvent.click(screen.getByRole("button", { name: "Change mood" }));
      cleanup();
      render(<FindClient embedded />);
      expect(screen.getByRole("group", { name: "Mood" })).toBeInTheDocument();
    });

    it("moves focus to the pick when it lands", async () => {
      await showPopUp();
      await waitFor(() =>
        expect(document.activeElement).toHaveAttribute("data-slot", "pick-panel")
      );
    });

    it("jumps to any pick in the set from its poster", async () => {
      await showPopUp();
      fireEvent.click(screen.getByRole("button", { name: "Pick 3: Mulholland Drive" }));
      await pickHeading("Mulholland Drive");
      expect(screen.getByRole("button", { name: "Pick 3: Mulholland Drive" })).toHaveAttribute("aria-current", "true");
      expect(queueSignal).toHaveBeenLastCalledWith(
        expect.objectContaining({ tmdbId: 1018, kind: "impression" })
      );
      fireEvent.keyDown(window, { key: "ArrowLeft" });
      await pickHeading("Parasite");
    });

    it("records a click when you open More about it", async () => {
      await showPopUp();
      fireEvent.click(screen.getByRole("link", { name: "More about it" }));
      expect(queueSignal).toHaveBeenLastCalledWith(
        expect.objectContaining({ tmdbId: 11423, kind: "clicked" })
      );
    });

    it("goes back to the moods from Change mood", async () => {
      await showPopUp();
      fireEvent.click(screen.getByRole("button", { name: "Change mood" }));
      expect(screen.getByRole("group", { name: "Mood" })).toBeInTheDocument();
    });

    it("says so when the feed fails", async () => {
      getFeed.mockRejectedValue(new Error("down"));
      render(<FindClient embedded />);
      fireEvent.click(screen.getByRole("button", { name: /Find something/ }));
      expect(await screen.findByText("Could not get your recommendations.")).toBeInTheDocument();
    });
  });
});
