import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MediaRail } from "./media-rail";

/** jsdom does no layout, so give the track a size. */
function sizeTracks(scrollWidth: number) {
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(600);
  vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(
    scrollWidth
  );
}

afterEach(() => vi.restoreAllMocks());

describe("MediaRail", () => {
  it("shows no left arrow at the start, and a right one when more is off screen", () => {
    sizeTracks(1800);
    render(
      <MediaRail title="Trending">
        <div>One</div>
        <div>Two</div>
      </MediaRail>
    );
    expect(screen.queryByRole("button", { name: "Scroll Trending left" })).toBeNull();
    expect(screen.getByRole("button", { name: "Scroll Trending right" })).toBeInTheDocument();
  });

  it("shows no arrows when everything fits", () => {
    sizeTracks(600);
    render(
      <MediaRail title="Trending">
        <div>One</div>
      </MediaRail>
    );
    expect(screen.queryByRole("button", { name: /Scroll Trending/ })).toBeNull();
  });

  it("finds the overflow when the cards arrive after the skeletons", () => {
    sizeTracks(600);
    const { rerender } = render(
      <MediaRail title="Trending">
        <div>Loading</div>
      </MediaRail>
    );
    expect(screen.queryByRole("button", { name: /Scroll Trending/ })).toBeNull();

    sizeTracks(1800);
    rerender(
      <MediaRail title="Trending">
        <div>One</div>
        <div>Two</div>
        <div>Three</div>
      </MediaRail>
    );
    expect(screen.getByRole("button", { name: "Scroll Trending right" })).toBeInTheDocument();
  });
});
