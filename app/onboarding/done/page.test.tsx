import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DonePage from "./page";

vi.mock("./preview", () => ({ FirstPicksPreview: () => null }));

async function renderDone(rated?: string) {
  render(await DonePage({ searchParams: Promise.resolve({ rated }) }));
}

describe("DonePage", () => {
  it("doesn't claim a sense of your taste with nothing rated", async () => {
    await renderDone("0");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Come back to it any time"
    );
    expect(screen.queryByText(/sense of what you like/)).toBeNull();
  });

  it("calls a short run a rough sense", async () => {
    await renderDone("7");
    expect(screen.getByText(/rough sense of what you like/)).toBeInTheDocument();
  });
});
