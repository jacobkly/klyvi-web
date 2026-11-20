import { act, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUsePathname = vi.fn(() => "/library");
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

const session = vi.hoisted(() => ({
  user: { email: "a@b.com" } as { email: string } | null,
}));

vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => ({
    user: session.user,
    profile: null,
    loading: false,
    signOut: vi.fn(),
  }),
}));

import { BottomTabBar } from "./bottom-tab-bar";

beforeEach(() => {
  session.user = { email: "a@b.com" };
});

describe("BottomTabBar", () => {
  it("renders all five phone tabs", () => {
    render(<BottomTabBar />);
    for (const label of ["Home", "Explore", "Find next", "Library", "Profile"]) {
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

  it("keeps Profile lit on the pages you reach from it", () => {
    mockUsePathname.mockReturnValueOnce("/settings");
    render(<BottomTabBar />);
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute("aria-current", "page");
  });

  it("treats subroutes as active", () => {
    mockUsePathname.mockReturnValue("/library/favorites");
    render(<BottomTabBar />);
    expect(screen.getByRole("link", { name: "Library" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("gives every tab the 44px touch height", () => {
    render(<BottomTabBar />);
    for (const link of screen.getAllByRole("link")) {
      expect(link.className).toContain("h-14");
    }
  });

  it("is a navigation landmark", () => {
    render(<BottomTabBar />);
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
  });

  // Search and the account moved to the phone's top bar.
  it("puts Find next in the middle and Profile last", () => {
    render(<BottomTabBar />);
    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(within(nav).getAllByRole("link").map((l) => l.textContent)).toEqual([
      "Home",
      "Explore",
      "Find next",
      "Library",
      "Profile",
    ]);
    expect(within(nav).queryByRole("button")).toBeNull();
  });

  // The loop: Home is the marketing page, which has no bar.
  it("gives a signed-out visitor Home, Explore and Sign in", () => {
    session.user = null;
    mockUsePathname.mockReturnValue("/explore");
    render(<BottomTabBar />);
    const nav = screen.getByRole("navigation", { name: "Primary" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((l) => [l.textContent, l.getAttribute("href")])).toEqual([
      ["Home", "/"],
      ["Explore", "/explore"],
      ["Sign in", "/signin"],
    ]);
    expect(links[1]).toHaveAttribute("aria-current", "page");
    expect(links[0]).not.toHaveAttribute("aria-current");
  });

  it("steps aside while a text field has focus", () => {
    render(
      <>
        <input aria-label="Query" />
        <input type="checkbox" aria-label="Tick" />
        <BottomTabBar />
      </>
    );
    const nav = screen.getByRole("navigation", { name: "Primary" });
    act(() => screen.getByLabelText("Query").focus());
    expect(nav).toHaveAttribute("data-typing");
    act(() => screen.getByLabelText("Query").blur());
    expect(nav).not.toHaveAttribute("data-typing");
    act(() => screen.getByLabelText("Tick").focus());
    expect(nav).not.toHaveAttribute("data-typing");
  });
});
