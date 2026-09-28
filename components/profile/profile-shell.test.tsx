import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryEntry, UserProfile } from "@/lib/types";

import { ProfileShell, useProfile } from "./profile-shell";

const getMe = vi.fn();
const listTracking = vi.fn();
const getFeed = vi.fn();
const getMovie = vi.fn();
const getMyStats = vi.fn();
const session: { profile: UserProfile | null; loading: boolean } = {
  profile: null,
  loading: false,
};

vi.mock("@/lib/api/users", () => ({
  getMe: (...a: unknown[]) => getMe(...a),
  getMyStats: (...a: unknown[]) => getMyStats(...a),
}));
vi.mock("@/lib/api/tracking", () => ({
  listTracking: (...a: unknown[]) => listTracking(...a),
}));
vi.mock("@/lib/api/reco", () => ({
  getFeed: (...a: unknown[]) => getFeed(...a),
}));
vi.mock("@/lib/api/catalog", () => ({
  getMovie: (...a: unknown[]) => getMovie(...a),
}));
vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => session,
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/profile",
}));

function entry(over: Partial<LibraryEntry>): LibraryEntry {
  return {
    mediaId: 1,
    mediaType: "movie",
    tmdbId: 496243,
    title: "Parasite",
    posterPath: null,
    year: 2019,
    status: "completed",
    score: 95,
    progress: null,
    progressTotal: null,
    notes: null,
    favorite: false,
    updatedAt: "2026-07-01T00:00:00Z",
    ...over,
  };
}

const ME: UserProfile = {
  id: "u1",
  username: "jacob",
  usernameChangedAt: null,
  bio: null,
  avatarUrl: null,
  bannerUrl: null,
  birthday: null,
  settings: {},
  createdAt: "2026-01-01T00:00:00Z",
};

/** A request that never lands, standing in for a slow one. */
const pending = () => new Promise<never>(() => {});

/** The banner's source. Tests run next/image's default loader, which
 *  URL-encodes it into an optimizer URL. */
function bannerSrc(container: HTMLElement): string {
  return decodeURIComponent(
    container.querySelector("img")?.getAttribute("src") ?? ""
  );
}

function Probe() {
  const data = useProfile();
  return <p>context entries: {data ? data.entries.length : "none"}</p>;
}

describe("ProfileShell", () => {
  beforeEach(() => {
    session.profile = ME;
    session.loading = false;
    getMe.mockReset();
    listTracking.mockReset().mockResolvedValue([entry({})]);
    getFeed.mockReset().mockResolvedValue([]);
    getMovie.mockReset().mockResolvedValue(null);
    getMyStats.mockReset().mockRejectedValue(new Error("no stats in test"));
    window.localStorage.clear();
  });

  it("renders identity, both tabs, and provides data to children", async () => {
    render(
      <ProfileShell>
        <Probe />
      </ProfileShell>
    );

    expect(await screen.findByText("context entries: 1")).toBeInTheDocument();
    expect(screen.getByText("jacob")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "href",
      "/profile"
    );
    expect(screen.getByRole("link", { name: "Stats" })).toHaveAttribute(
      "href",
      "/profile/stats"
    );
    // Overview is the current route, so it is marked current.
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("takes the profile from the session instead of fetching it again", async () => {
    render(
      <ProfileShell>
        <Probe />
      </ProfileShell>
    );
    await screen.findByText("context entries: 1");
    expect(getMe).not.toHaveBeenCalled();
  });

  it("paints the identity before the library lands", async () => {
    listTracking.mockImplementation(pending);
    render(
      <ProfileShell>
        <Probe />
      </ProfileShell>
    );
    expect(screen.getByText("jacob")).toBeInTheDocument();
    expect(screen.queryByText(/context entries/)).toBeNull();
  });

  it("does not hold the tabs for slow stats or a slow feed", async () => {
    getMyStats.mockImplementation(pending);
    getFeed.mockImplementation(pending);
    render(
      <ProfileShell>
        <Probe />
      </ProfileShell>
    );
    expect(await screen.findByText("context entries: 1")).toBeInTheDocument();
  });

  it("builds the banner from the highest-rated backdrop, with no catalog call", async () => {
    listTracking.mockResolvedValue([
      entry({ mediaId: 1, tmdbId: 100, score: 80, backdropPath: "/low.jpg" }),
      entry({ mediaId: 2, tmdbId: 200, score: 97, backdropPath: "/best.jpg" }),
      // Rated higher, but with no backdrop to show.
      entry({ mediaId: 3, tmdbId: 300, score: 99, backdropPath: null }),
    ]);
    const { container } = render(
      <ProfileShell>
        <Probe />
      </ProfileShell>
    );
    await screen.findByText("context entries: 3");
    expect(bannerSrc(container)).toContain("/best.jpg");
    expect(getMovie).not.toHaveBeenCalled();
  });

  it("prefers the banner the user set", async () => {
    session.profile = { ...ME, bannerUrl: "https://cdn.example/banner.png" };
    listTracking.mockResolvedValue([entry({ backdropPath: "/best.jpg" })]);
    const { container } = render(
      <ProfileShell>
        <Probe />
      </ProfileShell>
    );
    await screen.findByText("context entries: 1");
    expect(bannerSrc(container)).toContain("https://cdn.example/banner.png");
    expect(bannerSrc(container)).not.toContain("/best.jpg");
  });

  it("keeps the identity and offers a retry when the library fails", async () => {
    listTracking.mockRejectedValueOnce(new Error("boom"));
    render(
      <ProfileShell>
        <Probe />
      </ProfileShell>
    );
    const retry = await screen.findByRole("button", { name: "Try again" });
    expect(screen.getByText("Could not load your profile.")).toBeInTheDocument();
    expect(screen.getByText("jacob")).toBeInTheDocument();

    retry.click();
    expect(await screen.findByText("context entries: 1")).toBeInTheDocument();
    expect(listTracking).toHaveBeenCalledTimes(2);
  });
});
