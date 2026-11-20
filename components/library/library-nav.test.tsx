import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LibraryNav } from "./library-nav";

describe("LibraryNav", () => {
  it("links Library and Favorites only, marking the page you're on", () => {
    render(<LibraryNav active="favorites" />);
    const nav = screen.getByRole("navigation", { name: "Library" });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Library" })).toHaveAttribute("href", "/library");
    expect(screen.getByRole("link", { name: "Favorites" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    // Stats lives on the profile, not in the library.
    expect(screen.queryByRole("link", { name: "Stats" })).toBeNull();
    expect(screen.getByRole("link", { name: "Library" })).not.toHaveAttribute("aria-current");
  });
});
