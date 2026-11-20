import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArtBackdrop } from "./art-backdrop";

describe("ArtBackdrop", () => {
  it("blurs three of the hero's posters behind a scrim, with no violet", () => {
    const { container } = render(<ArtBackdrop posters={["/a.jpg", "/b.jpg", "/c.jpg", "/d.jpg"]} />);
    const art = screen.getByTestId("art-backdrop");
    const imgs = art.querySelectorAll("img");
    expect(imgs).toHaveLength(3);
    expect(imgs[0].getAttribute("src")).toBe("https://image.tmdb.org/t/p/w342/a.jpg");
    expect(art.className).toContain("blur-2xl");
    expect(container.innerHTML).not.toMatch(/violet|primary/);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("is a plain dark backdrop until there are posters", () => {
    render(<ArtBackdrop posters={[]} />);
    expect(screen.queryByTestId("art-backdrop")).toBeNull();
  });
});
