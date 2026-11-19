import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SkipChoice } from "./skip-choice";

const listInteractions = vi.fn();

vi.mock("@/lib/api/interactions", () => ({
  listInteractions: (...a: unknown[]) => listInteractions(...a),
}));

describe("SkipChoice", () => {
  beforeEach(() => {
    listInteractions.mockReset();
  });

  it("names the cost of skipping when nothing is rated", async () => {
    listInteractions.mockResolvedValue([]);
    render(<SkipChoice />);
    expect(
      await screen.findByRole("heading", { name: "Skip for now?" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Skip anyway" })).toHaveAttribute(
      "href",
      "/home"
    );
  });

  it("says there is enough to go on when you have ratings", async () => {
    listInteractions.mockResolvedValue([{ kind: "rated" }, { kind: "rated" }, { kind: "rated" }]);
    render(<SkipChoice />);
    expect(
      await screen.findByRole("heading", { name: "You have rated 3 titles" })
    ).toBeInTheDocument();
    expect(screen.queryByText(/until you rate something/)).toBeNull();
    expect(screen.getByRole("link", { name: "Go to home" })).toHaveAttribute(
      "href",
      "/home"
    );
  });

  it("falls back to the plain question when the count fails", async () => {
    listInteractions.mockRejectedValue(new Error("503"));
    render(<SkipChoice />);
    expect(
      await screen.findByRole("heading", { name: "Skip for now?" })
    ).toBeInTheDocument();
  });
});
