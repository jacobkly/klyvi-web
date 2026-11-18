import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { writePref } from "@/lib/local-prefs";

import { Reveal } from "./reveal";

afterEach(() => window.localStorage.clear());

describe("Reveal", () => {
  it("starts faded out, ready to slide in", () => {
    render(<Reveal>Hello</Reveal>);
    expect(screen.getByText("Hello")).toHaveStyle({ opacity: "0" });
  });

  it("shows its content at rest when reduce motion is on in settings", () => {
    writePref("reduceMotion", true);
    render(<Reveal>Hello</Reveal>);
    expect(screen.getByText("Hello")).not.toHaveStyle({ opacity: "0" });
  });
});
