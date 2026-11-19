import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryEntry, MediaSummary } from "@/lib/types";

import { SeriesActions } from "./series-actions";
import { SeasonGrid, SeriesTrackingProvider } from "./series-tracking";

const listTracking = vi.fn();
const addTracking = vi.fn();
const recordInteraction = vi.fn();
const toast = vi.fn();
let sessionUser: { id: string } | null = { id: "u1" };

vi.mock("@/lib/api/tracking", () => ({
  listTracking: (...a: unknown[]) => listTracking(...a),
  addTracking: (...a: unknown[]) => addTracking(...a),
}));
vi.mock("@/lib/track-show", () => ({ trackFirstUntrackedSeason: vi.fn() }));
vi.mock("@/lib/api/interactions", () => ({
  recordInteraction: (...a: unknown[]) => recordInteraction(...a),
}));
vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => ({ user: sessionUser }),
}));
vi.mock("sonner", () => ({ toast: (...a: unknown[]) => toast(...a) }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/tv/1399",
}));

function entry(season: number, over: Partial<LibraryEntry> = {}): LibraryEntry {
  return {
    mediaId: 100 + season,
    mediaType: "season",
    tmdbId: 1399,
    title: "Game of Thrones",
    posterPath: null,
    year: 2011,
    seasonNumber: season,
    status: "completed",
    score: 90,
    progress: 10,
    progressTotal: 10,
    notes: null,
    favorite: false,
    updatedAt: "2026-11-01T00:00:00Z",
    ...over,
  };
}

const seasons: (MediaSummary & { episodeCount: number })[] = [1, 2, 3].map((n) => ({
  mediaId: 0,
  mediaType: "season",
  tmdbId: 1399,
  title: "Game of Thrones",
  posterPath: `/got${n}.jpg`,
  year: 2010 + n,
  seasonNumber: n,
  episodeCount: 10,
}));

function page() {
  return render(
    <SeriesTrackingProvider tmdbId={1399}>
      <SeriesActions tmdbId={1399} seasonNumbers={[1, 2, 3]} />
      <SeasonGrid seasons={seasons} />
    </SeriesTrackingProvider>
  );
}

describe("series tracking", () => {
  beforeEach(() => {
    sessionUser = { id: "u1" };
    listTracking.mockReset().mockResolvedValue([entry(1)]);
    addTracking.mockReset();
    recordInteraction.mockReset().mockResolvedValue(undefined);
    toast.mockReset().mockReturnValue("t1");
  });

  it("asks only for this show's seasons", async () => {
    page();
    await screen.findByRole("button", { name: "Add Season 2 to Planning" });
    expect(listTracking).toHaveBeenCalledWith({ mediaType: "season", tmdbIds: [1399] });
  });

  it("shows a tracked season's status and score on its card", async () => {
    page();
    const grid = screen.getByRole("list", { name: "Seasons" });
    const first = within(grid).getAllByRole("listitem")[0];
    expect(await within(first).findByRole("img", { name: "Completed" })).toBeInTheDocument();
    expect(within(first).getByText(/^Your score/)).toBeInTheDocument();
    const second = within(grid).getAllByRole("listitem")[1];
    expect(within(second).queryByRole("img")).toBeNull();
  });

  it("names a card by its season alone", () => {
    page();
    const grid = screen.getByRole("list", { name: "Seasons" });
    expect(within(grid).getByText("Season 1")).toBeInTheDocument();
    expect(within(grid).queryByText(/Game of Thrones/)).toBeNull();
  });

  it("moves the button on to the next season after a click", async () => {
    addTracking.mockResolvedValue(entry(2, { status: "planning", score: null, progress: 0 }));
    page();
    fireEvent.click(await screen.findByRole("button", { name: "Add Season 2 to Planning" }));

    expect(addTracking).toHaveBeenCalledWith({
      tmdbId: 1399,
      mediaType: "season",
      seasonNumber: 2,
      status: "planning",
    });
    expect(
      await screen.findByRole("button", { name: "Add Season 3 to Planning" })
    ).toBeInTheDocument();
    expect(toast).toHaveBeenCalledWith("Season 2 added to Planning", { id: "t1" });
    const second = within(screen.getByRole("list", { name: "Seasons" })).getAllByRole("listitem")[1];
    expect(within(second).getByRole("img", { name: "Planning" })).toBeInTheDocument();
  });

  it("says when every season is already in the library", async () => {
    listTracking.mockResolvedValue([entry(1), entry(2), entry(3)]);
    page();
    expect(
      await screen.findByRole("button", { name: "Every season is in your library" })
    ).toBeDisabled();
  });

  it("keeps the plain button for a signed-out visitor", () => {
    sessionUser = null;
    page();
    expect(screen.getByRole("button", { name: "Add to watchlist" })).toBeInTheDocument();
    expect(listTracking).not.toHaveBeenCalled();
  });

  it("keeps the plain button when the library can't be read", async () => {
    listTracking.mockRejectedValue(new Error("503"));
    page();
    await waitFor(() => expect(listTracking).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Add to watchlist" })).toBeInTheDocument();
  });
});
