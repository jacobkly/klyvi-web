import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LibraryNav } from "./library-nav";

describe("LibraryNav", () => {
  it("links Library, Favorites and Stats, marking the page you're on", () => {
    render(<LibraryNav active="favorites" />);
    const nav = screen.getByRole("navigation", { name: "Library" });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Library" })).toHaveAttribute("href", "/library");
    expect(screen.getByRole("link", { name: "Favorites" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: "Stats" })).toHaveAttribute(
      "href",
      "/profile/stats"
    );
    expect(screen.getByRole("link", { name: "Library" })).not.toHaveAttribute("aria-current");
  });
});
