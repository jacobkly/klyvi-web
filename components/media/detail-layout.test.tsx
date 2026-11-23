import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryEntry, TrackableSummary } from "@/lib/types";

import { DetailLayout } from "./detail-layout";

const listTracking = vi.fn();
const lookupTracking = vi.fn();
const updateTracking = vi.fn();
const addTracking = vi.fn();
const push = vi.fn();
const toast = vi.fn();
let sessionLoading = false;
let sessionUser: { id: string } | null = { id: "u1" };

vi.mock("@/lib/api/tracking", () => ({
  listTracking: (...a: unknown[]) => listTracking(...a),
  lookupTracking: (...a: unknown[]) => lookupTracking(...a),
  addTracking: (...a: unknown[]) => addTracking(...a),
  updateTracking: (...a: unknown[]) => updateTracking(...a),
  deleteTracking: vi.fn(),
}));
vi.mock("@/lib/api/interactions", () => ({ recordInteraction: vi.fn() }));
vi.mock("sonner", () => ({ toast: (...a: unknown[]) => toast(...a) }));
vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => ({ user: sessionUser, loading: sessionLoading }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
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

  /** Picks Paused from the status menu: it saves at once (#77). */
  async function pause() {
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /Completed/ }));
    await user.click(await screen.findByRole("menuitem", { name: "Paused" }));
  }

  it("shows the new status before the request resolves", async () => {
    updateTracking.mockReturnValue(new Promise(() => {}));
    renderDetail();

    await pause();

    expect(screen.queryByRole("dialog")).toBeNull();
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

    // The rail beside the content (lg up) holds every fact.
    const rail = within(screen.getByRole("complementary"));
    expect(rail.getByText("$160M")).toBeInTheDocument();
    const imdb = rail.getByRole("link", { name: /IMDb/ });
    expect(imdb).toHaveAttribute("href", "https://www.imdb.com/title/tt1375666/");
    expect(imdb).toHaveAttribute("target", "_blank");
    expect(imdb).toHaveAttribute("rel", "noopener noreferrer");
    expect(rail.getByRole("link", { name: /Official site/ })).toBeInTheDocument();
  });

  it("shows three facts under the summary on phones, the rest behind Show all", () => {
    renderDetail({
      metadata: [
        { label: "Original title", value: null },
        { label: "Runtime", value: "2h 28m" },
        { label: "Released", value: "16 Jul 2010" },
        { label: "Status", value: "Released" },
        { label: "Budget", value: "$160M" },
      ],
    });

    const preview = screen.getByTestId("facts-preview");
    expect(preview.className).toContain("lg:hidden");
    const p = within(preview);
    // Empty facts drop out before the first three are picked.
    expect(p.getByText("2h 28m")).toBeInTheDocument();
    expect(p.getByText("Released", { selector: "dd" })).toBeInTheDocument();
    expect(p.queryByText("$160M")).toBeNull();

    const more = p.getByRole("button", { name: "Show all 4 details" });
    expect(more).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(more);
    expect(p.getByText("$160M")).toBeInTheDocument();
    expect(p.getByRole("button", { name: "Show fewer details" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });

  it("names the director and writers beside the title, not inside the heading", () => {
    renderDetail({
      directorLine: "Directed by Christopher Nolan. Written by Christopher Nolan",
    });

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/^Severance$/);
    expect(screen.getByText("2025")).toBeInTheDocument();
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
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/^Severance$/);
    expect(screen.getByText("TV-MA")).toBeInTheDocument();
    expect(screen.getByText("Rated")).toBeInTheDocument();
  });

  it("leaves the rating and trailer out when there are none", () => {
    renderDetail();
    expect(screen.queryByText("Rated")).toBeNull();
    expect(screen.queryByRole("button", { name: "Trailer" })).toBeNull();
  });

  it("offers the trailer when there is one", () => {
    renderDetail({ trailerKey: "xEQP4VVuyrY" });
    expect(screen.getByRole("button", { name: "Trailer" })).toBeInTheDocument();
    expect(document.querySelector("iframe")).toBeNull();
  });
});

describe("DetailLayout for the visitor (U.21)", () => {
  beforeEach(() => {
    sessionUser = { id: "u1" };
    sessionLoading = false;
    lookupTracking.mockReset().mockResolvedValue(null);
    addTracking.mockReset().mockReturnValue(new Promise(() => {}));
    updateTracking.mockReset();
    push.mockReset();
    toast.mockReset();
  });

  it("saves a status the moment it's picked, with no editor (#77)", async () => {
    const user = userEvent.setup();
    renderDetail();
    await waitFor(() => expect(lookupTracking).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: /Add to library/ }));
    await user.click(await screen.findByRole("menuitem", { name: "Watching" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(addTracking).toHaveBeenCalledWith(
      expect.objectContaining({
        tmdbId: 95396,
        mediaType: "season",
        seasonNumber: 2,
        status: "watching",
      })
    );
    expect(screen.getByRole("button", { name: /Watching/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add a score" })).toBeInTheDocument();
  });

  it("counts every episode when a season is picked as completed", async () => {
    const user = userEvent.setup();
    renderDetail({ episodeCount: 10 });
    await waitFor(() => expect(lookupTracking).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: /Add to library/ }));
    await user.click(await screen.findByRole("menuitem", { name: "Completed" }));

    expect(addTracking).toHaveBeenCalledWith(
      expect.objectContaining({ status: "completed", episodeProgress: 10 })
    );
  });

  it("dates an unreleased title and offers only Planning (#48)", async () => {
    const user = userEvent.setup();
    renderDetail({ releaseDate: "2099-12-16" });
    expect(screen.getByText("Out 16 December 2099")).toBeInTheDocument();
    await waitFor(() => expect(lookupTracking).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: /Add to library/ }));
    const items = await screen.findAllByRole("menuitem");
    expect(items.map((i) => i.textContent)).toEqual(["Planning"]);
  });

  it("asks a signed-out visitor to sign in, then brings them back (#101)", async () => {
    sessionUser = null;
    const user = userEvent.setup();
    renderDetail();

    expect(screen.queryByRole("button", { name: /Add to library/ })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Sign in to track" }));
    expect(push).toHaveBeenCalledWith("/signin?next=%2Ftv%2F95396%2Fseason%2F2");
  });

  it("keeps the usual control while the session is still loading", () => {
    sessionUser = null;
    sessionLoading = true;
    renderDetail();
    expect(screen.getByRole("button", { name: /Add to library/ })).toBeInTheDocument();
  });

  it("marks a favorite in the hero (#41)", async () => {
    lookupTracking.mockResolvedValue(tracked({ favorite: true }));
    renderDetail();
    expect(await screen.findByText("Favorite")).toBeInTheDocument();
  });

  it("keeps a favorite when the status changes", async () => {
    lookupTracking.mockResolvedValue(tracked({ favorite: true }));
    updateTracking.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderDetail();

    await user.click(await screen.findByRole("button", { name: /Completed/ }));
    await user.click(await screen.findByRole("menuitem", { name: "Paused" }));
    expect(updateTracking).toHaveBeenCalledWith(
      955,
      expect.objectContaining({ status: "paused", favorite: true })
    );
  });

  it("marks and unmarks a favorite from the page, keeping the rest", async () => {
    lookupTracking.mockResolvedValue(tracked({ score: 88 }));
    updateTracking.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderDetail();

    const heart = await screen.findByRole("button", { name: "Favorite" });
    expect(heart).toHaveAttribute("aria-pressed", "false");
    await user.click(heart);
    expect(heart).toHaveAttribute("aria-pressed", "true");
    expect(updateTracking).toHaveBeenCalledWith(
      955,
      expect.objectContaining({ score: 88, favorite: true })
    );
  });

  it("has no heart until the title is tracked", async () => {
    renderDetail();
    await waitFor(() => expect(lookupTracking).toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: "Favorite" })).toBeNull();
  });

  it("puts one status control on the page", async () => {
    renderDetail();
    await waitFor(() => expect(lookupTracking).toHaveBeenCalled());
    expect(screen.getAllByRole("button", { name: /Add to library/ })).toHaveLength(1);
  });
});
