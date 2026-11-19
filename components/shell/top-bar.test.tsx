import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUsePathname = vi.fn(() => "/home");
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

const session = vi.hoisted(() => ({
  user: { email: "a@b.com" } as { email: string } | null,
  loading: false,
}));
vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => ({
    user: session.user,
    profile: null,
    loading: session.loading,
    signOut: vi.fn(),
  }),
}));
vi.mock("@/components/notifications/unread-provider", () => ({
  useUnreadNotices: () => ({ unread: 0, setUnread: vi.fn() }),
}));

import { TopBar } from "./top-bar";

beforeEach(() => {
  session.user = { email: "a@b.com" };
  session.loading = false;
});

describe("TopBar", () => {
  it("renders the wordmark linking home and the four nav links", () => {
    render(<TopBar />);
    expect(screen.getByRole("link", { name: "Klyvi" })).toHaveAttribute(
      "href",
      "/home"
    );
    for (const label of ["Home", "Find next", "Library", "Explore"]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
  });

  it("marks the active item with aria-current", () => {
    mockUsePathname.mockReturnValue("/find");
    render(<TopBar />);
    expect(screen.getByRole("link", { name: "Find next" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("has a search button that reports the shortcut", () => {
    render(<TopBar />);
    expect(
      screen.getByRole("button", { name: /search/i })
    ).toBeInTheDocument();
  });

  // #102: signed out, Home, Find next and Library only bounce to sign-in.
  it("gives a signed-out visitor Explore, Sign in and Get started", () => {
    session.user = null;
    render(<TopBar />);
    expect(screen.getByRole("link", { name: "Klyvi" })).toHaveAttribute(
      "href",
      "/"
    );
    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(
      within(nav)
        .getAllByRole("link")
        .map((l) => l.textContent)
    ).toEqual(["Explore"]);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/signin"
    );
    expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute(
      "href",
      "/signup"
    );
  });

  it("keeps the full nav while the session is still resolving", () => {
    session.user = null;
    session.loading = true;
    render(<TopBar />);
    expect(screen.getByRole("link", { name: "Library" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Get started" })).toBeNull();
  });

  it("supports a transparent variant for backdrop heroes", () => {
    const { container } = render(<TopBar variant="transparent" />);
    const header = container.querySelector("header");
    expect(header?.className).not.toContain("border-b");
  });
});
