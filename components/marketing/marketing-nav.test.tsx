import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingNav } from "./marketing-nav";

describe("MarketingNav", () => {
  // #109: a visitor can browse before signing up.
  it("links to Explore, Sign in and Get started", () => {
    render(<MarketingNav />);
    expect(screen.getByRole("link", { name: "Explore" })).toHaveAttribute(
      "href",
      "/explore"
    );
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/signin"
    );
    expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute(
      "href",
      "/signup"
    );
  });
});
