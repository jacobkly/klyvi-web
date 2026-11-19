import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUsePathname = vi.fn(() => "/library");
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

const session = vi.hoisted(() => ({
  user: { email: "a@b.com" } as { email: string } | null,
  unread: 0,
}));

vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => ({
    user: session.user,
    profile: null,
    loading: false,
    signOut: vi.fn(),
  }),
}));
vi.mock("@/components/notifications/unread-provider", () => ({
  useUnreadNotices: () => ({ unread: session.unread, setUnread: vi.fn() }),
}));

import { BottomTabBar } from "./bottom-tab-bar";

beforeEach(() => {
  session.user = { email: "a@b.com" };
  session.unread = 0;
});

describe("BottomTabBar", () => {
  it("renders all four primary nav links", () => {
    render(<BottomTabBar />);
    for (const label of ["Home", "Find next", "Library", "Explore"]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
  });

  it("marks the active tab with aria-current", () => {
    mockUsePathname.mockReturnValue("/library");
    render(<BottomTabBar />);
    expect(screen.getByRole("link", { name: "Library" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: "Explore" })).not.toHaveAttribute(
      "aria-current"
    );
  });

  it("treats subroutes as active", () => {
    mockUsePathname.mockReturnValue("/library/favorites");
    render(<BottomTabBar />);
    expect(screen.getByRole("link", { name: "Library" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  // #19: under 768 px the top bar's search is hidden, so the tab bar
  // carries it to every page.
  it("puts search one tap away on every page", () => {
    mockUsePathname.mockReturnValue("/movie/550");
    render(<BottomTabBar />);
    const nav = screen.getByRole("navigation", { name: "Primary" });
    const search = within(nav).getByRole("link", { name: "Search" });
    expect(search).toHaveAttribute("href", "/explore?focus=1");
    expect(search).not.toHaveAttribute("aria-current");
  });

  it("gives every target the 44px touch height", () => {
    render(<BottomTabBar />);
    for (const link of screen.getAllByRole("link")) {
      expect(link.className).toContain("min-h-11");
    }
  });

  it("is a navigation landmark", () => {
    render(<BottomTabBar />);
    expect(
      screen.getByRole("navigation", { name: "Primary" })
    ).toBeInTheDocument();
  });

  // Everything behind the avatar, notices included, has no other way in on a
  // phone, where the top bar is hidden.
  it("holds the account menu beside the tabs", () => {
    render(<BottomTabBar />);
    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(
      within(nav).getByRole("button", { name: "Your account" })
    ).toBeInTheDocument();
  });

  it("gives the account menu a 44px target", () => {
    render(<BottomTabBar />);
    expect(screen.getByRole("button", { name: "Your account" }).className).toContain(
      "hit-44"
    );
  });

  it("shows the unread dot on the avatar", () => {
    session.unread = 2;
    render(<BottomTabBar />);
    const trigger = screen.getByRole("button", {
      name: "Your account, 2 unread notifications",
    });
    expect(trigger.querySelector('[data-slot="unread-dot"]')).not.toBeNull();
  });

  it("offers sign in when signed out", () => {
    session.user = null;
    render(<BottomTabBar />);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/signin"
    );
  });
});
