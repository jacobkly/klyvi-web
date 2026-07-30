import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockUsePathname = vi.fn(() => "/home");
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

import { TopBar } from "./top-bar";

describe("TopBar", () => {
  it("renders the wordmark linking home and the four nav links", () => {
    render(<TopBar />);
    expect(screen.getByRole("link", { name: "Klyvi" })).toHaveAttribute(
      "href",
      "/home"
    );
    for (const label of ["Home", "Find next", "Library", "Explore"]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
  });

  it("marks the active item with aria-current", () => {
    mockUsePathname.mockReturnValue("/find");
    render(<TopBar />);
    expect(screen.getByRole("link", { name: "Find next" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("has a search button that reports the shortcut", () => {
    render(<TopBar />);
    expect(
      screen.getByRole("button", { name: /search/i })
    ).toBeInTheDocument();
  });

  it("supports a transparent variant for backdrop heroes", () => {
    const { container } = render(<TopBar variant="transparent" />);
    const header = container.querySelector("header");
    expect(header?.className).not.toContain("border-b");
  });
});
