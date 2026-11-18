import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "sonner";
import { describe, expect, it, vi } from "vitest";

import { toastWithUndo } from "./undo-toast";

// Sonner captures the pointer for swipe-to-dismiss, which jsdom lacks.
Element.prototype.setPointerCapture ??= () => {};
Element.prototype.releasePointerCapture ??= () => {};

describe("toastWithUndo", () => {
  it("names the change and calls the handler when Undo is pressed", async () => {
    const onUndo = vi.fn();
    render(<Toaster />);
    act(() => {
      toastWithUndo({
        message: "Severance S2 moved to Completed",
        undoneMessage: "Severance S2 is back to Watching",
        onUndo,
      });
    });

    expect(
      await screen.findByText("Severance S2 moved to Completed")
    ).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Undo" }));

    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText("Severance S2 is back to Watching")
    ).toBeInTheDocument();
  });

  it("says so when the undo itself fails", async () => {
    const onUndo = vi.fn().mockRejectedValue(new Error("offline"));
    render(<Toaster />);
    act(() => {
      toastWithUndo({
        message: "Removed Parasite",
        undoneMessage: "Parasite is back",
        onUndo,
      });
    });

    await screen.findByText("Removed Parasite");
    await userEvent.setup().click(screen.getByRole("button", { name: "Undo" }));

    expect(
      await screen.findByText(
        "Couldn't undo that. Try again from the title's page."
      )
    ).toBeInTheDocument();
  });
});
