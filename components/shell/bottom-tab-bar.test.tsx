import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockUsePathname = vi.fn(() => "/library");
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

import { BottomTabBar } from "./bottom-tab-bar";

describe("BottomTabBar", () => {
  it("renders all four primary nav links", () => {
    render(<BottomTabBar />);
    for (const label of ["Home", "Find next", "Library", "Explore"]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
  });

  it("marks the active tab with aria-current", () => {
    mockUsePathname.mockReturnValue("/library");
    render(<BottomTabBar />);
    expect(screen.getByRole("link", { name: "Library" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: "Explore" })).not.toHaveAttribute(
      "aria-current"
    );
  });

  it("treats subroutes as active", () => {
    mockUsePathname.mockReturnValue("/library/stats");
    render(<BottomTabBar />);
    expect(screen.getByRole("link", { name: "Library" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("gives every target the 44px touch height", () => {
    render(<BottomTabBar />);
    for (const link of screen.getAllByRole("link")) {
      expect(link.className).toContain("min-h-11");
    }
  });

  it("is a navigation landmark", () => {
    render(<BottomTabBar />);
    expect(
      screen.getByRole("navigation", { name: "Primary" })
    ).toBeInTheDocument();
  });
});
