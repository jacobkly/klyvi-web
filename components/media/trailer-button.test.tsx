import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { TrailerButton } from "./trailer-button";

describe("TrailerButton", () => {
  it("loads nothing from YouTube until it is pressed", () => {
    const { container } = render(
      <TrailerButton title="The Dark Knight" trailerKey="EXeTwQWrcwY" />
    );
    expect(screen.getByRole("button", { name: "Trailer" })).toBeInTheDocument();
    expect(document.querySelector("iframe")).toBeNull();
    expect(container.innerHTML).not.toMatch(/youtube/i);
  });

  it("opens the no-cookie player, with a link out to YouTube", async () => {
    const user = userEvent.setup();
    render(<TrailerButton title="The Dark Knight" trailerKey="EXeTwQWrcwY" />);
    await user.click(screen.getByRole("button", { name: "Trailer" }));

    const frame = await screen.findByTitle("The Dark Knight trailer");
    expect(frame.tagName).toBe("IFRAME");
    expect(frame.getAttribute("src")).toBe(
      "https://www.youtube-nocookie.com/embed/EXeTwQWrcwY?autoplay=1&rel=0"
    );
    expect(screen.getByRole("link", { name: /watch on youtube/i })).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=EXeTwQWrcwY"
    );
  });

  it("renders nothing without a valid key", () => {
    const { container: none } = render(
      <TrailerButton title="Untitled" trailerKey={null} />
    );
    expect(none).toBeEmptyDOMElement();
    const { container: bad } = render(
      <TrailerButton title="Untitled" trailerKey={'x"><script>'} />
    );
    expect(bad).toBeEmptyDOMElement();
  });
});
