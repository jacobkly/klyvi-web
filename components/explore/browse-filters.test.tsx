import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { writePref } from "@/lib/local-prefs";

const session = vi.hoisted(() => ({
  user: null as { id: string } | null,
  loading: false,
}));
vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => session,
}));

import { BrowseFiltersButton } from "./browse-filters";

const stored = () =>
  JSON.parse(window.localStorage.getItem("klyvi:prefs") ?? "{}").browseFilters;

// The sheet's opener comes first in the page (see filter-panel.test).
const opener = () => screen.getAllByRole("button", { name: /^Filters/ })[0];

describe("BrowseFiltersButton", () => {
  beforeEach(() => {
    window.localStorage.clear();
    session.user = null;
  });

  it("saves the watched choice and anime together", async () => {
    session.user = { id: "u1" };
    const user = userEvent.setup();
    render(<BrowseFiltersButton />);

    await user.click(opener());
    await user.click(await screen.findByRole("button", { name: "Dim" }));
    await user.click(screen.getByRole("switch"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(stored()).toEqual({ watched: "dim", anime: true });
    expect(screen.getAllByRole("button", { name: "Filters (2)" }).length).toBeGreaterThan(0);
  });

  it("keeps a chosen watched option on when it is pressed again", async () => {
    session.user = { id: "u1" };
    const user = userEvent.setup();
    render(<BrowseFiltersButton />);

    await user.click(opener());
    const show = await screen.findByRole("button", { name: "Show" });
    await user.click(show);
    expect(show).toHaveAttribute("aria-pressed", "true");
  });

  it("names anime plainly, with what it covers", async () => {
    const user = userEvent.setup();
    render(<BrowseFiltersButton />);

    await user.click(opener());
    expect(await screen.findByText("Anime")).toBeInTheDocument();
    expect(screen.getByText("Japanese animated films and series.")).toBeInTheDocument();
  });

  it("signed out, has no watched choice and keeps the stored one on save", async () => {
    writePref("browseFilters", { watched: "hide", anime: false });
    const user = userEvent.setup();
    render(<BrowseFiltersButton />);

    await user.click(opener());
    await user.click(await screen.findByRole("switch"));
    expect(screen.queryByRole("group", { name: "Watched" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(stored()).toEqual({ watched: "hide", anime: true });
  });
});
