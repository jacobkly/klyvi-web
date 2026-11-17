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
});
