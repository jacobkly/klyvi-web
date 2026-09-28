import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryEntry, TrackableSummary } from "@/lib/types";

import { DetailLayout } from "./detail-layout";

const listTracking = vi.fn();
const lookupTracking = vi.fn();
let sessionUser: { id: string } | null = { id: "u1" };

vi.mock("@/lib/api/tracking", () => ({
  listTracking: (...a: unknown[]) => listTracking(...a),
  lookupTracking: (...a: unknown[]) => lookupTracking(...a),
  addTracking: vi.fn(),
  updateTracking: vi.fn(),
  deleteTracking: vi.fn(),
}));
vi.mock("@/lib/api/interactions", () => ({ recordInteraction: vi.fn() }));
vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => ({ user: sessionUser }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/tv/95396/season/2",
}));

const SEASON: TrackableSummary = {
  mediaId: 0,
  mediaType: "season",
  tmdbId: 95396,
  title: "Severance",
  posterPath: null,
  year: 2025,
  seasonNumber: 2,
};

function tracked(over: Partial<LibraryEntry>): LibraryEntry {
  return {
    ...SEASON,
    mediaId: 955,
    status: "completed",
    score: 90,
    progress: 10,
    progressTotal: 10,
    notes: null,
    favorite: false,
    updatedAt: "2026-09-01T00:00:00Z",
    ...over,
  };
}

function renderDetail() {
  return render(
    <DetailLayout
      media={SEASON}
      backdropPath={null}
      posterPath={null}
      title="Severance"
      year={2025}
      directorLine={null}
      tagline={null}
      overview="Mark leads a team whose memories are split."
      genres={[]}
      metadata={[]}
      keywords={[]}
      cast={[]}
    />
  );
}

describe("DetailLayout tracking state", () => {
  beforeEach(() => {
    sessionUser = { id: "u1" };
    listTracking.mockReset().mockResolvedValue([]);
    lookupTracking.mockReset().mockResolvedValue(null);
  });

  it("looks up this one title instead of pulling the whole library", async () => {
    lookupTracking.mockResolvedValue(tracked({}));
    renderDetail();

    expect(await screen.findByText("Your score: 90")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(lookupTracking).toHaveBeenCalledTimes(1);
    expect(lookupTracking).toHaveBeenCalledWith({
      tmdbId: 95396,
      mediaType: "season",
      seasonNumber: 2,
    });
    expect(listTracking).not.toHaveBeenCalled();
  });

  it("leaves the control empty when the title is not tracked", async () => {
    renderDetail();

    await waitFor(() => expect(lookupTracking).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/Your score|Add a score/)).toBeNull();
  });

  it("makes no request when signed out", () => {
    sessionUser = null;
    renderDetail();

    expect(lookupTracking).not.toHaveBeenCalled();
    expect(listTracking).not.toHaveBeenCalled();
  });
});
