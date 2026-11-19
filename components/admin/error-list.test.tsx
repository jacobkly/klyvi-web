import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ErrorGroup, ErrorGroupPage } from "@/lib/types";

import { ErrorList } from "./error-list";

vi.mock("./resolve-button", () => ({
  ResolveButton: ({ id, resolved }: { id: number; resolved: boolean }) => (
    <button type="button">{resolved ? `Reopen ${id}` : `Resolve ${id}`}</button>
  ),
}));

const group = (over: Partial<ErrorGroup>): ErrorGroup => ({
  id: 1,
  source: "web",
  kind: "TypeError",
  message: "x is undefined",
  stack: null,
  route: "/movies/:id",
  method: null,
  status: null,
  userId: null,
  count: 1,
  firstSeen: "2026-11-17T09:00:00Z",
  lastSeen: "2026-11-18T09:00:00Z",
  resolvedAt: null,
  ...over,
});

const page = (errors: ErrorGroup[], hasMore = false): ErrorGroupPage => ({
  errors,
  counts: { open: 3, resolved: 1 },
  hasMore,
});

const NOW = Date.parse("2026-11-18T12:00:00Z");

describe("ErrorList", () => {
  it("shows the tabs with their counts, the current one marked", () => {
    render(
      <ErrorList page={page([])} params={{ status: "resolved", offset: 0, openId: null }} now={NOW} />
    );

    const tabs = screen.getByRole("navigation", { name: "Error status" });
    expect(within(tabs).getByRole("link", { name: "Open 3" })).toHaveAttribute("href", "/admin");
    const resolved = within(tabs).getByRole("link", { name: "Resolved 1" });
    expect(resolved).toHaveAttribute("aria-current", "page");
    expect(within(tabs).getByRole("link", { name: "All" })).toHaveAttribute("href", "/admin?status=all");
  });

  it("says when a tab is empty", () => {
    render(<ErrorList page={page([])} params={{ status: "open", offset: 0, openId: null }} now={NOW} />);

    expect(screen.getByText("No open errors.")).toBeInTheDocument();
  });

  it("lists groups as links that open them, closed by default", () => {
    render(
      <ErrorList
        page={page([group({ id: 4, count: 12, method: "GET", route: "/v1/reco/feed", status: 500, source: "api", kind: "panic", message: "index out of range" })])}
        params={{ status: "open", offset: 0, openId: null }}
        now={NOW}
      />
    );

    const link = screen.getByRole("link", { name: /panic: index out of range/ });
    expect(link).toHaveAttribute("href", "/admin?id=4");
    expect(link).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText(/api · GET \/v1\/reco\/feed · 500 · 3 h ago/)).toBeInTheDocument();
    expect(screen.getByText("12×")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("opens the chosen group with its stack, dates and button", () => {
    render(
      <ErrorList
        page={page([group({ id: 4, stack: "at Feed (feed.tsx)", userId: "u-1", resolvedAt: "2026-11-18T10:00:00Z" })])}
        params={{ status: "all", offset: 0, openId: 4 }}
        now={NOW}
      />
    );

    const link = screen.getByRole("link", { name: /TypeError: x is undefined/ });
    expect(link).toHaveAttribute("href", "/admin?status=all");
    expect(link).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("at Feed (feed.tsx)")).toBeInTheDocument();
    expect(screen.getByText(/First seen yesterday/)).toBeInTheDocument();
    expect(screen.getByText(/user u-1/)).toBeInTheDocument();
    expect(screen.getByText(/Resolved 2 h ago/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reopen 4" })).toBeInTheDocument();
  });

  it("pages with newer and older links", () => {
    render(
      <ErrorList
        page={page([group({})], true)}
        params={{ status: "all", offset: 50, openId: null }}
        now={NOW}
      />
    );

    expect(screen.getByRole("link", { name: "Newer" })).toHaveAttribute("href", "/admin?status=all");
    expect(screen.getByRole("link", { name: "Older" })).toHaveAttribute(
      "href",
      "/admin?status=all&offset=100"
    );
  });
});
