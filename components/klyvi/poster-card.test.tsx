import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PosterCard } from "./poster-card";
import type { MediaSummary } from "@/lib/types";

const media: MediaSummary = {
  mediaId: 142,
  mediaType: "movie",
  tmdbId: 11423,
  title: "Memories of Murder",
  posterPath: "/74gE8YyApcoUKj4tFPmuTBlAOPK.jpg",
  year: 2003,
};

const noArt: MediaSummary = { ...media, posterPath: null };

describe("PosterCard", () => {
  it("links to the movie detail route", () => {
    render(<PosterCard media={media} variant="below" />);
    expect(
      screen.getByRole("link", { name: /Memories of Murder/ })
    ).toHaveAttribute("href", "/movie/11423");
  });

  it("links seasons to the season route", () => {
    render(
      <PosterCard
        media={{ ...media, mediaType: "season", seasonNumber: 2 }}
        variant="below"
      />
    );
    expect(
      screen.getByRole("link", { name: /Memories of Murder/ })
    ).toHaveAttribute("href", "/tv/11423/season/2");
  });

  it("shows the title under the artwork in the below variant", () => {
    render(<PosterCard media={media} variant="below" />);
    expect(screen.getByText("Memories of Murder")).toBeInTheDocument();
    expect(screen.getByText("2003")).toBeInTheDocument();
  });

  it("shows no visible title in the compact variant", () => {
    render(<PosterCard media={media} variant="compact" />);
    expect(screen.queryByText("Memories of Murder")).not.toBeInTheDocument();
    // Still accessible by name.
    expect(
      screen.getByRole("link", { name: /Memories of Murder/ })
    ).toBeInTheDocument();
  });

  it("renders the missing-artwork state with the title set in the block", () => {
    render(<PosterCard media={noArt} variant="compact" />);
    // The title appears inside the placeholder block even in compact.
    expect(screen.getByText("Memories of Murder")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("pairs the status dot with an accessible label, never color alone", () => {
    render(
      <PosterCard media={media} variant="overlay" status="watching" />
    );
    expect(screen.getByLabelText("Watching")).toBeInTheDocument();
  });

  it("shows progress in the watched / total format", () => {
    render(
      <PosterCard
        media={{ ...media, mediaType: "season", seasonNumber: 1 }}
        variant="overlay"
        progress={{ watched: 7, total: 12 }}
      />
    );
    expect(screen.getByText("7 / 12")).toBeInTheDocument();
  });

  it("shows progress without a total when the total is unknown", () => {
    render(
      <PosterCard
        media={media}
        variant="overlay"
        progress={{ watched: 1026, total: null }}
      />
    );
    expect(screen.getByText("1026")).toBeInTheDocument();
  });
});
