import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PoolEntry } from "@/lib/mock-onboarding";

import { RateDeck, swipeVerdict } from "./rate-deck";

const getPool = vi.fn();
const listInteractions = vi.fn();
const recordInteraction = vi.fn();
const push = vi.fn();

vi.mock("@/lib/api/onboarding", () => ({
  getPool: (...a: unknown[]) => getPool(...a),
}));
vi.mock("@/lib/api/interactions", () => ({
  listInteractions: (...a: unknown[]) => listInteractions(...a),
  recordInteraction: (...a: unknown[]) => recordInteraction(...a),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("sonner", () => ({ toast: vi.fn() }));

const POOL: PoolEntry[] = [
  { tmdbId: 1, title: "Alien", posterPath: null, releaseYear: 1979, dimension: "auteur" },
  { tmdbId: 2, title: "Heat", posterPath: null, releaseYear: 1995, dimension: "popcorn" },
  { tmdbId: 3, title: "Ran", posterPath: null, releaseYear: 1985, dimension: "arthouse" },
];

/** The title under the card, which names the film on screen. */
function caption(title: string) {
  return screen.findByRole("heading", { level: 2, name: new RegExp(`^${title}`) });
}

describe("RateDeck", () => {
  beforeEach(() => {
    window.localStorage.clear();
    getPool.mockReset().mockResolvedValue(POOL);
    listInteractions.mockReset().mockResolvedValue([]);
    recordInteraction.mockReset().mockResolvedValue({});
    push.mockReset();
  });

  it("has a way out before any answer", async () => {
    render(<RateDeck />);
    await caption("Alien");

    await userEvent.click(screen.getByRole("button", { name: "Done for now" }));

    expect(push).toHaveBeenCalledWith("/onboarding/done?rated=0");
  });

  it("undo brings the last card back and drops its answer", async () => {
    render(<RateDeck />);
    await caption("Alien");
    expect(screen.queryByRole("button", { name: /Undo/ })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Liked it" }));
    await caption("Heat");
    expect(screen.getByText("1 / 20")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Undo/ }));
    await caption("Alien");
    expect(screen.getByText("0 / 20")).toBeInTheDocument();

    // Answer again, differently, then move on: only the second answer lands.
    await userEvent.click(screen.getByRole("button", { name: "Not for me" }));
    await caption("Heat");
    await userEvent.click(screen.getByRole("button", { name: "Not seen" }));
    await caption("Ran");

    expect(recordInteraction).toHaveBeenCalledTimes(1);
    expect(recordInteraction).toHaveBeenCalledWith(
      expect.objectContaining({ tmdbId: 1, rating: 20, source: "onboarding" })
    );
  });

  it("saves the last answer on the way out", async () => {
    render(<RateDeck />);
    await caption("Alien");
    await userEvent.click(screen.getByRole("button", { name: "Liked it" }));
    await caption("Heat");

    await userEvent.click(screen.getByRole("button", { name: "Done for now" }));

    expect(recordInteraction).toHaveBeenCalledWith(
      expect.objectContaining({ tmdbId: 1, rating: 80 })
    );
    expect(push).toHaveBeenCalledWith("/onboarding/done?rated=1");
  });

  it("starts a redo from the first card, even after a full onboarding", async () => {
    listInteractions.mockResolvedValue(
      Array.from({ length: 20 }, () => ({ kind: "rated", source: "onboarding" }))
    );
    window.localStorage.setItem("klyvi:onboarding-index", "2");
    render(<RateDeck redo />);

    await caption("Alien");
    expect(screen.getByText("0 / 20")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("names the way out once there are enough ratings", async () => {
    listInteractions.mockResolvedValue(
      Array.from({ length: 10 }, () => ({ kind: "rated", source: "onboarding" }))
    );
    render(<RateDeck />);
    await caption("Alien");
    expect(
      screen.getByRole("button", { name: "See your first recommendations" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Done for now" })).toBeNull();
  });
});

describe("swipeVerdict", () => {
  it("answers a long swipe and ignores a short one", () => {
    expect(swipeVerdict(120)).toBe("liked");
    expect(swipeVerdict(-120)).toBe("disliked");
    expect(swipeVerdict(30)).toBeNull();
    expect(swipeVerdict(-30)).toBeNull();
  });
});
