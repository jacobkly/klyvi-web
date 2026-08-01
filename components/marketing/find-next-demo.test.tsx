import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FindNextDemo } from "./find-next-demo";

// The catalog may be absent entirely; the demo must not care.
vi.mock("@/lib/api/catalog", () => ({
  getMovie: vi.fn(() => Promise.reject(new Error("offline"))),
}));

describe("FindNextDemo", () => {
  it("starts at pick 3 of 5 with both neighbours visible", () => {
    render(<FindNextDemo />);
    expect(screen.getByText("3 / 5")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /previous pick: /i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /next pick: /i })
    ).toBeInTheDocument();
  });

  it("pages with the arrows and disables at the edges", async () => {
    const user = userEvent.setup();
    render(<FindNextDemo />);

    const prev = screen.getByRole("button", { name: "Previous pick" });
    await user.click(prev);
    await user.click(prev);
    expect(screen.getByText("1 / 5")).toBeInTheDocument();
    expect(prev).toBeDisabled();
  });

  it("advances with a hint on an action instead of writing anywhere", async () => {
    const user = userEvent.setup();
    render(<FindNextDemo />);

    await user.click(
      screen.getByRole("button", { name: /add to watchlist/i })
    );
    expect(screen.getByText("4 / 5")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      /saves it to your watchlist/i
    );
  });

  it("shows curated reason chips for the current pick", () => {
    render(<FindNextDemo />);
    // Pick 3 of 5 is Knives Out in the demo set.
    expect(screen.getByText("whodunit")).toBeInTheDocument();
    expect(
      screen.getByText("because you liked Memories of Murder")
    ).toBeInTheDocument();
  });
});
