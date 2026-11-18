import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { writePref } from "@/lib/local-prefs";

import { ScoreValue } from "./score-value";

afterEach(() => {
  writePref("scoringSystem", "hundred");
});

describe("ScoreValue", () => {
  it("shows the stored score out of 100 by default", () => {
    const { container } = render(<ScoreValue score={88} />);
    expect(container).toHaveTextContent("88");
    expect(screen.getByText("88 out of 100")).toHaveClass("sr-only");
  });

  it("shows tens as a number out of 10", () => {
    writePref("scoringSystem", "ten");
    render(<ScoreValue score={88} />);
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("9 out of 10")).toBeInTheDocument();
  });

  it("shows stars with a star glyph", () => {
    writePref("scoringSystem", "stars");
    const { container } = render(<ScoreValue score={88} />);
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(container.querySelector("svg.lucide-star")).not.toBeNull();
    expect(screen.getByText("4 out of 5 stars")).toBeInTheDocument();
  });

  it("shows smileys as a face, named for screen readers", () => {
    writePref("scoringSystem", "smiley");
    const { container } = render(<ScoreValue score={88} />);
    expect(container.querySelector("svg.lucide-smile")).not.toBeNull();
    expect(screen.getByText("Liked it")).toHaveClass("sr-only");
  });

  it("marks the score as yours when asked", () => {
    render(<ScoreValue score={82} mine />);
    expect(screen.getByText("Your score 82 out of 100")).toBeInTheDocument();
  });
});
