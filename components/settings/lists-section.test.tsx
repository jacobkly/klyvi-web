import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { readPref } from "@/lib/local-prefs";

import { ListsSection } from "./lists-section";

const toast = vi.fn();
vi.mock("sonner", () => ({
  toast: (...args: unknown[]) => toast(...args),
}));

describe("ListsSection", () => {
  beforeEach(() => {
    window.localStorage.clear();
    toast.mockReset();
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
    const user = userEvent.setup();
    render(<ListsSection />);

    await user.click(screen.getByRole("button", { name: "Delete TV list" }));
    expect(
      await screen.findByText(/every tracked season/i)
    ).toBeInTheDocument();
  });
});
