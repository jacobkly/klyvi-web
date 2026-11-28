import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TRACKING_CHANGED } from "@/lib/api/tracking";
import type { Watched } from "@/lib/types";

const session = vi.hoisted(() => ({
  user: null as { id: string } | null,
  loading: false,
}));
vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => session,
}));

const getWatched = vi.fn();
vi.mock("@/lib/api/tracking", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/tracking")>()),
  getWatched: (...a: unknown[]) => getWatched(...a),
}));

import { isWatched, useWatched, WatchedProvider } from "./watched-provider";
import { WatchedMark } from "./watched-mark";

function watched(movies: number[], tv: number[] = []): Watched {
  return { movies: new Set(movies), tv: new Set(tv) };
}

/** Shows the watched film ids, for asserting what the provider holds. */
function Probe() {
  const w = useWatched();
  return <p data-testid="ids">{[...w.movies].join(",") || "none"}</p>;
}

const ids = () => screen.getByTestId("ids").textContent;

describe("WatchedProvider", () => {
  beforeEach(() => {
    getWatched.mockReset();
    session.user = null;
  });
  afterEach(() => vi.useRealTimers());

  it("is empty signed out, and asks for nothing", async () => {
    render(
      <WatchedProvider>
        <Probe />
      </WatchedProvider>
    );
    await act(async () => {});
    expect(ids()).toBe("none");
    expect(getWatched).not.toHaveBeenCalled();
  });

  it("loads the ids once signed in", async () => {
    session.user = { id: "u1" };
    getWatched.mockResolvedValue(watched([550, 680]));
    render(
      <WatchedProvider>
        <Probe />
      </WatchedProvider>
    );
    expect(await screen.findByText("550,680")).toBeInTheDocument();
    expect(getWatched).toHaveBeenCalledTimes(1);
  });

  it("asks again once after a run of tracking writes", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    session.user = { id: "u1" };
    getWatched
      .mockResolvedValueOnce(watched([550]))
      .mockResolvedValueOnce(watched([550, 13]));
    render(
      <WatchedProvider>
        <Probe />
      </WatchedProvider>
    );
    expect(await screen.findByText("550")).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event(TRACKING_CHANGED));
      window.dispatchEvent(new Event(TRACKING_CHANGED));
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });

    expect(await screen.findByText("550,13")).toBeInTheDocument();
    expect(getWatched).toHaveBeenCalledTimes(2);
  });

  it("drops the marks on sign-out", async () => {
    session.user = { id: "u1" };
    getWatched.mockResolvedValue(watched([550]));
    const { rerender } = render(
      <WatchedProvider>
        <Probe />
      </WatchedProvider>
    );
    expect(await screen.findByText("550")).toBeInTheDocument();

    session.user = null;
    rerender(
      <WatchedProvider>
        <Probe />
      </WatchedProvider>
    );
    expect(ids()).toBe("none");
  });

  it("keeps working, with no marks, when the ids fail to load", async () => {
    session.user = { id: "u1" };
    getWatched.mockRejectedValue(new Error("down"));
    render(
      <WatchedProvider>
        <Probe />
      </WatchedProvider>
    );
    await act(async () => {});
    expect(ids()).toBe("none");
  });
});

describe("isWatched", () => {
  it("judges films and shows by their own sets, and seasons not at all", () => {
    const w = watched([550], [1396]);
    expect(isWatched(w, "movie", 550)).toBe(true);
    expect(isWatched(w, "tv", 550)).toBe(false);
    expect(isWatched(w, "tv", 1396)).toBe(true);
    expect(isWatched(w, "season", 1396)).toBe(false);
  });
});

describe("WatchedMark", () => {
  beforeEach(() => {
    getWatched.mockReset();
    session.user = { id: "u1" };
  });

  it("marks a watched title, and nothing for one not watched", async () => {
    getWatched.mockResolvedValue(watched([550]));
    render(
      <WatchedProvider>
        <Probe />
        <WatchedMark mediaType="movie" tmdbId={550} />
        <WatchedMark mediaType="movie" tmdbId={680} />
      </WatchedProvider>
    );
    await screen.findByText("550");
    expect(screen.getAllByRole("img", { name: "Watched" })).toHaveLength(1);
  });
});
