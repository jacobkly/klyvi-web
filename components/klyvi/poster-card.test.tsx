import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PosterCard } from "./poster-card";
import {
  STATUS_LABELS,
  type MediaSummary,
  type TrackingStatus,
} from "@/lib/types";

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
  it("badges the season number so shared artwork is distinguishable", () => {
    render(
      <PosterCard
        media={{ ...media, mediaType: "season", seasonNumber: 2 }}
        variant="compact"
      />
    );
    expect(screen.getByText("S2")).toBeInTheDocument();
  });

  it("shows no season badge for movies", () => {
    render(<PosterCard media={media} variant="compact" />);
    expect(screen.queryByText(/^S\d/)).not.toBeInTheDocument();
  });

  it("shows the user's score, labelled, in the overlay variant", () => {
    render(<PosterCard media={media} variant="overlay" score={82} />);
    expect(
      screen.getByText("Your score 82 out of 100")
    ).toBeInTheDocument();
    expect(screen.getByText("82")).toBeInTheDocument();
  });

  it("renders no score element when the score is null", () => {
    render(<PosterCard media={media} variant="overlay" score={null} />);
    expect(screen.queryByText(/your score/i)).not.toBeInTheDocument();
  });

  it.each(Object.keys(STATUS_LABELS) as TrackingStatus[])(
    "badges %s with its own glyph and its name",
    (status) => {
      render(<PosterCard media={media} variant="below" status={status} />);
      const glyph = screen.getByLabelText(STATUS_LABELS[status]);
      expect(glyph).toHaveAttribute("data-status", status);
      expect(glyph.querySelector("svg")).not.toBeNull();
    }
  );

  it("puts your score in the badge in the below variant too", () => {
    render(
      <PosterCard media={media} variant="below" status="completed" score={92} />
    );
    expect(screen.getByText("Your score 92 out of 100")).toBeInTheDocument();
  });

  it("fades the poster in once its image has loaded", async () => {
    const { container } = render(<PosterCard media={media} variant="below" />);
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("data-loaded", "false");
    fireEvent.load(img);
    // next/image reports the load after decoding, a tick later.
    await waitFor(() => expect(img).toHaveAttribute("data-loaded", "true"));
  });

  it("offers no quick actions unless it's given some", () => {
    render(<PosterCard media={media} variant="below" />);
    expect(
      screen.queryByRole("button", { name: /quick actions/i })
    ).not.toBeInTheDocument();
  });

  it("runs the quick action you pick from its menu", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <PosterCard
        media={media}
        variant="below"
        status="watching"
        actions={[
          { label: "Watching", onSelect: vi.fn(), active: true },
          { label: "Completed", onSelect },
        ]}
      />
    );
    await user.click(
      screen.getByRole("button", { name: "Quick actions for Memories of Murder" })
    );
    await user.click(await screen.findByRole("menuitem", { name: "Completed" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
