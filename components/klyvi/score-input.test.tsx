import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { writePref } from "@/lib/local-prefs";

import { ScoreInput } from "./score-input";

afterEach(() => {
  writePref("scoringSystem", "hundred");
});

function Controlled({
  initial = "",
  onChange = () => {},
}: {
  initial?: string;
  onChange?: (v: string) => void;
}) {
  const [value, setValue] = React.useState(initial);
  return (
    <ScoreInput
      id="score"
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange(v);
      }}
    />
  );
}

// Base UI keeps the thumb visibility: hidden until it has measured its
// position, which jsdom never does. So the slider is queried with hidden,
// and its name is checked through the label it points at, since jsdom
// computes no name for a hidden element.
const slider = () => screen.getByRole("slider", { hidden: true });

describe("ScoreInput", () => {
  it("pairs a slider labelled Score with a number field", () => {
    render(<Controlled initial="90" />);
    const labelId = slider().getAttribute("aria-labelledby");
    expect(document.getElementById(labelId ?? "")).toHaveTextContent("Score");
    expect(slider()).toHaveAttribute("aria-valuetext", "90 out of 100");
    expect(screen.getByRole("textbox", { name: "Score" })).toHaveValue("90");
  });

  it("moves the number when the slider moves", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled initial="90" onChange={onChange} />);
    slider().focus();
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith("91");
    expect(screen.getByRole("textbox", { name: "Score" })).toHaveValue("91");
  });

  it("runs from 1 to 10 in the ten point system", () => {
    writePref("scoringSystem", "ten");
    render(<Controlled initial="9" />);
    expect(slider()).toHaveAttribute("max", "10");
    expect(slider()).toHaveAttribute("aria-valuetext", "9 out of 10");
  });

  it("picks stars with buttons, and a second press clears", async () => {
    writePref("scoringSystem", "stars");
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    expect(screen.getByRole("group", { name: "Score" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "4 stars" }));
    expect(onChange).toHaveBeenLastCalledWith("4");
    expect(screen.getByRole("button", { name: "4 stars" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await user.click(screen.getByRole("button", { name: "4 stars" }));
    expect(onChange).toHaveBeenLastCalledWith("");
  });

  it("picks a smiley by name", async () => {
    writePref("scoringSystem", "smiley");
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "It was okay" }));
    expect(onChange).toHaveBeenLastCalledWith("2");
  });
});
