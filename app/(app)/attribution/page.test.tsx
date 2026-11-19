import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AttributionPage from "./page";

describe("AttributionPage", () => {
  it("shows the TMDB logo with the notice in the API terms wording", () => {
    render(<AttributionPage />);
    expect(screen.getByRole("img", { name: "TMDB" })).toHaveAttribute(
      "src",
      "/tmdb-logo.svg"
    );
    expect(
      screen.getByText(
        "This website uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB."
      )
    ).toBeInTheDocument();
  });

  it("links the full license texts of the open-source code it ships", () => {
    render(<AttributionPage />);
    expect(
      screen.getByRole("link", { name: "the license of every package" })
    ).toHaveAttribute("href", "/third-party-notices.txt");
  });

  it("credits Wikipedia's plot text under its license", () => {
    render(<AttributionPage />);
    expect(screen.getByRole("heading", { name: "Wikipedia" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Creative Commons Attribution-ShareAlike 4.0 License",
      })
    ).toHaveAttribute("href", "https://creativecommons.org/licenses/by-sa/4.0/");
  });
});
