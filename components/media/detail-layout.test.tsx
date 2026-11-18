import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryEntry, TrackableSummary } from "@/lib/types";

import { DetailLayout } from "./detail-layout";

const listTracking = vi.fn();
const lookupTracking = vi.fn();
const updateTracking = vi.fn();
const toast = vi.fn();
let sessionUser: { id: string } | null = { id: "u1" };

vi.mock("@/lib/api/tracking", () => ({
  listTracking: (...a: unknown[]) => listTracking(...a),
  lookupTracking: (...a: unknown[]) => lookupTracking(...a),
  addTracking: vi.fn(),
  updateTracking: (...a: unknown[]) => updateTracking(...a),
  deleteTracking: vi.fn(),
}));
vi.mock("@/lib/api/interactions", () => ({ recordInteraction: vi.fn() }));
vi.mock("sonner", () => ({ toast: (...a: unknown[]) => toast(...a) }));
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

function renderDetail(
  over: Partial<ComponentProps<typeof DetailLayout>> = {}
) {
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
      {...over}
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

describe("DetailLayout saves", () => {
  beforeEach(() => {
    sessionUser = { id: "u1" };
    lookupTracking.mockReset().mockResolvedValue(tracked({}));
    updateTracking.mockReset();
    toast.mockReset();
  });

  /** Picks Paused from the status menu and saves the dialog it opens. */
  async function pause() {
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /Completed/ }));
    await user.click(await screen.findByRole("menuitem", { name: "Paused" }));
    await user.click(await screen.findByRole("button", { name: "Save" }));
  }

  it("shows the new status before the request resolves", async () => {
    updateTracking.mockReturnValue(new Promise(() => {}));
    renderDetail();

    await pause();

    expect(updateTracking).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: /Paused/ })).toBeInTheDocument();
    expect(toast).toHaveBeenCalledWith("Paused");
  });

  it("rolls a failed save back and says so", async () => {
    updateTracking.mockRejectedValue(new Error("503"));
    renderDetail();

    await pause();

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Could not update that. Try again")
    );
    expect(screen.getByRole("button", { name: /Completed/ })).toBeInTheDocument();
  });
});

describe("DetailLayout facts", () => {
  beforeEach(() => {
    sessionUser = null;
  });

  it("links out to IMDb and the official site in a new tab", () => {
    renderDetail({
      metadata: [
        { label: "Budget", value: "$160M" },
        {
          label: "Links",
          value: null,
          links: [
            { label: "IMDb", href: "https://www.imdb.com/title/tt1375666/" },
            { label: "Official site", href: "https://www.inceptionmovie.com/" },
          ],
        },
      ],
    });

    expect(screen.getByText("$160M")).toBeInTheDocument();
    const imdb = screen.getByRole("link", { name: /IMDb/ });
    expect(imdb).toHaveAttribute("href", "https://www.imdb.com/title/tt1375666/");
    expect(imdb).toHaveAttribute("target", "_blank");
    expect(imdb).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("link", { name: /Official site/ })).toBeInTheDocument();
  });

  it("names the director and writers beside the title, not inside the heading", () => {
    renderDetail({
      directorLine: "Directed by Christopher Nolan. Written by Christopher Nolan",
    });

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/^Severance\s*2025$/);
    expect(
      screen.getByText("Directed by Christopher Nolan. Written by Christopher Nolan")
    ).toBeInTheDocument();
  });

  it("shows the phone strip under the title, and nothing when it is empty", () => {
    const { rerender } = renderDetail({ strip: ["2h 28m", "84 average"] });
    expect(screen.getByText("2h 28m · 84 average")).toBeInTheDocument();

    rerender(
      <DetailLayout
        media={SEASON}
        backdropPath={null}
        posterPath={null}
        title="Severance"
        year={2025}
        directorLine={null}
        tagline={null}
        overview={null}
        genres={[]}
        metadata={[]}
        keywords={[]}
        cast={[]}
        strip={[]}
      />
    );
    expect(screen.queryByTestId("fact-strip")).toBeNull();
  });
});

describe("DetailLayout rating and trailer", () => {
  beforeEach(() => {
    sessionUser = null;
    lookupTracking.mockReset().mockResolvedValue(null);
  });

  it("shows the age rating beside the year", () => {
    renderDetail({ certification: "TV-MA" });
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Severance 2025 Rated TV-MA");
  });

  it("leaves the rating and trailer out when there are none", () => {
    renderDetail();
    expect(screen.getByRole("heading", { level: 1 })).not.toHaveTextContent(/Rated/);
    expect(screen.queryByRole("button", { name: "Trailer" })).toBeNull();
  });

  it("offers the trailer when there is one", () => {
    renderDetail({ trailerKey: "xEQP4VVuyrY" });
    expect(screen.getByRole("button", { name: "Trailer" })).toBeInTheDocument();
    expect(document.querySelector("iframe")).toBeNull();
  });
});
