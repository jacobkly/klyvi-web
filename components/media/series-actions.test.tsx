import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SeriesActions } from "./series-actions";

const trackFirstUntrackedSeason = vi.fn();
const recordInteraction = vi.fn();
const toast = vi.fn();
const push = vi.fn();
let sessionUser: { id: string } | null = { id: "u1" };

vi.mock("@/lib/track-show", () => ({
  trackFirstUntrackedSeason: (...a: unknown[]) => trackFirstUntrackedSeason(...a),
}));
vi.mock("@/lib/api/interactions", () => ({
  recordInteraction: (...a: unknown[]) => recordInteraction(...a),
}));
vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => ({ user: sessionUser }),
}));
vi.mock("sonner", () => ({
  toast: (...a: unknown[]) => toast(...a),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/tv/1399",
}));

describe("SeriesActions", () => {
  beforeEach(() => {
    sessionUser = { id: "u1" };
    trackFirstUntrackedSeason.mockReset().mockResolvedValue(1);
    recordInteraction.mockReset().mockResolvedValue(undefined);
    toast.mockReset();
    push.mockReset();
  });

  it("adds the first untracked season to the watchlist", async () => {
    render(<SeriesActions tmdbId={1399} seasonNumbers={[1, 2, 3]} />);
    fireEvent.click(screen.getByRole("button", { name: "Add to watchlist" }));

    expect(trackFirstUntrackedSeason).toHaveBeenCalledWith(1399, [1, 2, 3]);
    expect(recordInteraction).toHaveBeenCalledWith({
      tmdbId: 1399,
      mediaType: "tv",
      kind: "saved",
      source: "detail",
    });
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Season 1 added to your watchlist")
    );
  });

  it("says so when every season is already tracked", async () => {
    trackFirstUntrackedSeason.mockResolvedValue(null);
    render(<SeriesActions tmdbId={1399} seasonNumbers={[1]} />);
    fireEvent.click(screen.getByRole("button", { name: "Add to watchlist" }));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Every season is already in your library")
    );
  });

  it("records not interested as a series-level dismiss", () => {
    render(<SeriesActions tmdbId={1399} seasonNumbers={[1]} />);
    fireEvent.click(screen.getByRole("button", { name: "Not interested" }));

    expect(recordInteraction).toHaveBeenCalledWith({
      tmdbId: 1399,
      mediaType: "tv",
      kind: "dismissed",
      source: "detail",
    });
    expect(toast).toHaveBeenCalledWith("Hidden from your recommendations");
  });

  it("sends a signed-out visitor to sign in and back", () => {
    sessionUser = null;
    render(<SeriesActions tmdbId={1399} seasonNumbers={[1]} />);
    fireEvent.click(screen.getByRole("button", { name: "Add to watchlist" }));

    expect(push).toHaveBeenCalledWith("/signin?next=%2Ftv%2F1399");
    expect(trackFirstUntrackedSeason).not.toHaveBeenCalled();
    expect(recordInteraction).not.toHaveBeenCalled();
  });
});
