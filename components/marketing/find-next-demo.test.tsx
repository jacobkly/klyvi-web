import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FindNextDemo } from "./find-next-demo";

// The catalog may be absent entirely; the demo must not care.
vi.mock("@/lib/api/catalog", () => ({
  getMovie: vi.fn(() => Promise.reject(new Error("offline"))),
}));

describe("FindNextDemo", () => {
  it("starts at pick 3 of 5 with the whole set in the strip", () => {
    render(<FindNextDemo />);
    expect(screen.getByText("3 of 5")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next pick" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Previous pick" })).toBeEnabled();
  });

  it("pages with the arrows and disables at the edges", async () => {
    const user = userEvent.setup();
    render(<FindNextDemo />);

    const prev = screen.getByRole("button", { name: "Previous pick" });
    await user.click(prev);
    await user.click(prev);
    expect(screen.getByText("1 of 5")).toBeInTheDocument();
    expect(prev).toBeDisabled();
  });

  it("advances with a hint on an action instead of writing anywhere", async () => {
    const user = userEvent.setup();
    render(<FindNextDemo />);

    await user.click(
      screen.getByRole("button", { name: /add to watchlist/i })
    );
    expect(screen.getByText("4 of 5")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      /saves it to your watchlist/i
    );
  });

  it("has every button the live screen has, and each says what it does", async () => {
    const user = userEvent.setup();
    render(<FindNextDemo />);
    for (const [name, says] of [
      ["More about it", /opens the film's page/],
      ["Change mood", /back to the moods/],
      ["New set", /a fresh set/],
    ] as const) {
      await user.click(screen.getByRole("button", { name }));
      expect(screen.getByRole("status")).toHaveTextContent(says);
    }
    expect(screen.getByText("3 of 5")).toBeInTheDocument();
  });

  it("steps on a swipe, and stops saying that it swipes", () => {
    const { container } = render(<FindNextDemo />);
    expect(screen.getByText("Swipe")).toBeInTheDocument();
    const stage = container.querySelector('[data-slot="pick-stage"]')!;
    fireEvent.touchStart(stage, { touches: [{ clientX: 300, clientY: 200 }] });
    fireEvent.touchMove(stage, { touches: [{ clientX: 150, clientY: 205 }] });
    fireEvent.touchEnd(stage);
    expect(screen.getByText("4 of 5")).toBeInTheDocument();
    expect(screen.queryByText("Swipe")).toBeNull();
  });

  it("shows curated reason chips for the current pick", () => {
    render(<FindNextDemo />);
    // Pick 3 of 5 is Dune: Part Two in the demo set.
    expect(screen.getByText("Epic World-Building")).toBeInTheDocument();
    expect(
      screen.getByText("because you liked Blade Runner 2049")
    ).toBeInTheDocument();
  });
});
