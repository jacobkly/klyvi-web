import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteFooter } from "./site-footer";

describe("SiteFooter", () => {
  it("has no Donate link", () => {
    render(<SiteFooter />);
    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(hrefs).toContain("/settings");
    expect(hrefs).not.toContain("/donate");
  });

  it("carries the TMDB notice in the API terms wording", () => {
    render(<SiteFooter />);
    expect(
      screen.getByText(
        "This website uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB."
      )
    ).toBeInTheDocument();
  });
});
