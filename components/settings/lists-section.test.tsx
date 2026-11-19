import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { readPref } from "@/lib/local-prefs";

import { ListsSection } from "./lists-section";

const toast = vi.fn();
vi.mock("sonner", () => ({
  toast: (...args: unknown[]) => toast(...args),
}));
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
const listTracking = vi.fn();
const deleteTrackingScope = vi.fn();
vi.mock("@/lib/api/tracking", () => ({
  listTracking: (...a: unknown[]) => listTracking(...a),
  deleteTrackingScope: (...a: unknown[]) => deleteTrackingScope(...a),
  resetScores: () => Promise.reject(new Error("offline")),
}));
const exportTracking = vi.fn(() => Promise.resolve());
vi.mock("@/lib/api/users", () => ({
  exportTracking: (...a: unknown[]) => exportTracking(...(a as [])),
}));

describe("ListsSection", () => {
  beforeEach(() => {
    window.localStorage.clear();
    toast.mockReset();
    push.mockReset();
    listTracking.mockReset().mockResolvedValue([]);
    deleteTrackingScope.mockReset().mockResolvedValue(0);
    exportTracking.mockClear();
  });

  it("renders an activity checkbox per tracking status, all defaulting on", () => {
    render(<ListsSection />);
    for (const label of [
      "Watching activity",
      "Planning activity",
      "Completed activity",
      "Rewatching activity",
      "Paused activity",
      "Dropped activity",
    ]) {
      const box = screen.getByRole("checkbox", { name: label });
      expect(box).toBeChecked();
    }
  });

  it("persists an activity checkbox toggle", async () => {
    const user = userEvent.setup();
    render(<ListsSection />);
    await user.click(
      screen.getByRole("checkbox", { name: /paused activity/i })
    );
    await waitFor(() =>
      expect(readPref("activityFeed")["paused"]).toBe(false)
    );
  });

  it("asks before resetting scores and only toasts on confirm", async () => {
    const user = userEvent.setup();
    render(<ListsSection />);

    await user.click(
      screen.getByRole("button", { name: "Reset film scores" })
    );
    // The dialog names the exact scope of the destruction.
    expect(
      await screen.findByText(/every score on every film entry/i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(toast).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: "Reset film scores" })
    );
    await user.click(
      await screen.findByRole("button", { name: "Reset scores" })
    );
    await waitFor(() => expect(toast).toHaveBeenCalled());
  });

  it("asks before deleting a list", async () => {
    listTracking.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const user = userEvent.setup();
    render(<ListsSection />);

    await user.click(screen.getByRole("button", { name: "Delete TV list" }));
    expect(
      await screen.findByText(/every tracked season/i)
    ).toBeInTheDocument();
  });

  it("names how many films a list delete takes, and offers a copy first", async () => {
    listTracking.mockResolvedValue(Array.from({ length: 12 }, (_, i) => ({ id: i })));
    deleteTrackingScope.mockResolvedValue(12);
    const user = userEvent.setup();
    render(<ListsSection />);

    await user.click(screen.getByRole("button", { name: "Delete film list" }));
    expect(listTracking).toHaveBeenCalledWith({ mediaType: "movie" });

    await user.click(
      await screen.findByRole("button", { name: "Download a copy first" })
    );
    expect(exportTracking).toHaveBeenCalledWith("csv");

    await user.click(await screen.findByRole("button", { name: "Delete 12 films" }));
    await waitFor(() => expect(deleteTrackingScope).toHaveBeenCalledWith("movie"));
    expect(toast).toHaveBeenCalledWith("Deleted 12 film entries.");
  });

  it("counts seasons in the singular, and has nothing to delete in an empty list", async () => {
    listTracking.mockResolvedValueOnce([{ id: 1 }]);
    const user = userEvent.setup();
    render(<ListsSection />);

    await user.click(screen.getByRole("button", { name: "Delete TV list" }));
    expect(
      await screen.findByRole("button", { name: "Delete 1 season" })
    ).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await user.click(screen.getByRole("button", { name: "Delete film list" }));
    expect(await screen.findByText("Your film list is already empty.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nothing to delete" })).toBeDisabled();
  });

  it("asks before redoing the taste, then goes on the client", async () => {
    const user = userEvent.setup();
    render(<ListsSection />);

    await user.click(screen.getByRole("button", { name: "Redo" }));
    expect(await screen.findByText(/Nothing is erased/)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Start the deck" }));
    expect(push).toHaveBeenCalledWith("/onboarding/rate?redo=1");
  });
});
