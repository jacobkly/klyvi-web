import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { writePref } from "@/lib/local-prefs";

import { RatingDialog } from "./rating-dialog";

afterEach(() => writePref("scoringSystem", "hundred"));

function renderDialog(onSubmit = vi.fn()) {
  render(
    <RatingDialog
      title="Arrival"
      year={2016}
      posterPath={null}
      open
      onOpenChange={() => {}}
      onSubmit={onSubmit}
    />
  );
  return onSubmit;
}

describe("RatingDialog", () => {
  it("starts at 75 and saves the typed score", async () => {
    const user = userEvent.setup();
    const onSubmit = renderDialog();
    const field = screen.getByRole("textbox", { name: "Score" });
    expect(field).toHaveValue("75");
    await user.clear(field);
    await user.type(field, "90");
    await user.click(screen.getByRole("button", { name: "Save rating" }));
    expect(onSubmit).toHaveBeenCalledWith(90);
  });

  it("has a single slider thumb", () => {
    renderDialog();
    expect(screen.getAllByRole("slider", { hidden: true })).toHaveLength(1);
  });

  it("can't save a blank or out of range score", async () => {
    const user = userEvent.setup();
    renderDialog();
    const field = screen.getByRole("textbox", { name: "Score" });
    await user.clear(field);
    expect(screen.getByRole("button", { name: "Save rating" })).toBeDisabled();
    await user.type(field, "140");
    expect(screen.getByRole("button", { name: "Save rating" })).toBeDisabled();
  });

  it("rates with a smiley in the smiley system", async () => {
    writePref("scoringSystem", "smiley");
    const user = userEvent.setup();
    const onSubmit = renderDialog();
    await user.click(screen.getByRole("button", { name: "Didn't like it" }));
    await user.click(screen.getByRole("button", { name: "Save rating" }));
    expect(onSubmit).toHaveBeenCalledWith(35);
  });

  it("still logs it seen without a score", async () => {
    const user = userEvent.setup();
    const onSubmit = renderDialog();
    await user.click(screen.getByRole("button", { name: "Just mark it seen" }));
    expect(onSubmit).toHaveBeenCalledWith(null);
  });
});
