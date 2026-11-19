import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SeasonNav } from "./season-nav";

const seasons = [1, 2, 3].map((n) => ({ seasonNumber: n }));

describe("SeasonNav", () => {
  it("leads back to the series", () => {
    render(
      <SeasonNav tmdbId={95396} seriesTitle="Severance" seasons={seasons} current={2} />
    );
    const crumbs = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(crumbs).getByRole("link", { name: "Severance" })).toHaveAttribute(
      "href",
      "/tv/95396"
    );
    expect(within(crumbs).getByText("Season 2")).toHaveAttribute("aria-current", "page");
  });

  it("steps to the seasons either side", () => {
    render(
      <SeasonNav tmdbId={95396} seriesTitle="Severance" seasons={seasons} current={2} />
    );
    expect(screen.getByRole("link", { name: "Previous season, Season 1" })).toHaveAttribute(
      "href",
      "/tv/95396/season/1"
    );
    expect(screen.getByRole("link", { name: "Next season, Season 3" })).toHaveAttribute(
      "href",
      "/tv/95396/season/3"
    );
  });

  it("has no previous on the first season", () => {
    render(
      <SeasonNav tmdbId={95396} seriesTitle="Severance" seasons={seasons} current={1} />
    );
    expect(screen.queryByRole("link", { name: /Previous season/ })).toBeNull();
    expect(screen.getByRole("link", { name: /Next season/ })).toBeInTheDocument();
  });

  it("has no next on the last season", () => {
    render(
      <SeasonNav tmdbId={95396} seriesTitle="Severance" seasons={seasons} current={3} />
    );
    expect(screen.queryByRole("link", { name: /Next season/ })).toBeNull();
    expect(screen.getByRole("link", { name: /Previous season/ })).toBeInTheDocument();
  });

  it("offers every season in a menu", () => {
    render(
      <SeasonNav tmdbId={95396} seriesTitle="Severance" seasons={seasons} current={2} />
    );
    expect(screen.getByRole("button", { name: "Season 2 of 3, pick a season" })).toBeInTheDocument();
  });
});
