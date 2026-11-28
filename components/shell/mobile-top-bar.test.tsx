import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({
  user: { email: "a@b.com" } as { email: string } | null,
}));

vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => ({ user: session.user, profile: null, loading: false, signOut: vi.fn() }),
}));
vi.mock("@/components/notifications/unread-provider", () => ({
  useUnreadNotices: () => ({ unread: 0, setUnread: vi.fn() }),
}));

import { MobileTopBar } from "./mobile-top-bar";

beforeEach(() => {
  session.user = { email: "a@b.com" };
});

describe("MobileTopBar", () => {
  it("is phone only", () => {
    render(<MobileTopBar />);
    expect(screen.getByRole("banner").className).toContain("md:hidden");
  });

  it("has no bar, only what floats", () => {
    render(<MobileTopBar />);
    const bar = screen.getByRole("banner");
    expect(bar.className).toContain("pointer-events-none");
    expect(bar.className).not.toContain("glass");
  });

  it("balances the pill with the mark, which links home signed in and out", () => {
    const { unmount } = render(<MobileTopBar />);
    const mark = screen.getByRole("link", { name: "Klyvi, home" });
    expect(mark).toHaveAttribute("href", "/home");
    expect(mark.className).toContain("size-11");
    unmount();
    session.user = null;
    render(<MobileTopBar />);
    expect(screen.getByRole("link", { name: "Klyvi, home" })).toHaveAttribute("href", "/");
  });

  it("opens search from a 44px glass pill", async () => {
    const onOpenSearch = vi.fn();
    render(<MobileTopBar onOpenSearch={onOpenSearch} />);
    const search = screen.getByRole("button", { name: "Search" });
    for (const c of ["h-11", "glass", "rounded-full", "pointer-events-auto"]) {
      expect(search.className).toContain(c);
    }
    await userEvent.setup().click(search);
    expect(onOpenSearch).toHaveBeenCalledOnce();
  });

  it("floats a 44px glass Back over the art on a details page", async () => {
    const onBack = vi.fn();
    render(<MobileTopBar onBack={onBack} overArt />);
    const back = screen.getByRole("button", { name: "Back" });
    for (const c of ["size-11", "glass", "rounded-full"]) {
      expect(back.className).toContain(c);
    }
    expect(screen.getByRole("banner").className).toContain("-mb-(--top-bar-height)");
    expect(screen.queryByRole("link", { name: "Klyvi, home" })).toBeNull();
    await userEvent.setup().click(back);
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("keeps its room on a page with no art behind it", () => {
    render(<MobileTopBar onBack={() => {}} />);
    expect(screen.getByRole("button", { name: "Back" })).toBeTruthy();
    expect(screen.getByRole("banner").className).not.toContain("-mb-(--top-bar-height)");
  });

  it("leaves the account to the Profile tab", () => {
    render(<MobileTopBar />);
    expect(screen.queryByRole("link", { name: /Your account/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Your account/ })).toBeNull();
  });

  describe("scrolling", () => {
    function scrollTo(y: number) {
      Object.defineProperty(window, "scrollY", { value: y, configurable: true });
      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });
    }
    beforeEach(() => {
      Object.defineProperty(document.documentElement, "scrollHeight", {
        value: 5000,
        configurable: true,
      });
      Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
    });

    it("leaves going down and comes back going up or at the top", () => {
      render(<MobileTopBar />);
      const bar = screen.getByRole("banner");
      expect(bar.className).not.toContain("-translate-y-full");

      scrollTo(900);
      expect(bar.className).toContain("-translate-y-full");
      expect(document.documentElement.dataset.topBar).toBe("hidden");

      scrollTo(880);
      expect(bar.className).not.toContain("-translate-y-full");
      expect(document.documentElement.dataset.topBar).toBe("shown");

      scrollTo(900);
      scrollTo(0);
      expect(bar.className).not.toContain("-translate-y-full");
    });

    it("holds the pill back on a page with its own search until that has gone", () => {
      render(<MobileTopBar pageHasSearch />);
      const pill = screen.getByText("Search").closest("button")!;
      expect(pill.className).toContain("invisible");
      expect(screen.getByRole("link", { name: "Klyvi, home" })).toBeInTheDocument();
      scrollTo(900);
      scrollTo(800);
      expect(pill.className).not.toContain("invisible");
      scrollTo(0);
      expect(pill.className).toContain("invisible");
    });

    it("ignores a few pixels of jitter", () => {
      render(<MobileTopBar />);
      scrollTo(900);
      scrollTo(896);
      expect(screen.getByRole("banner").className).toContain("-translate-y-full");
    });

    it("clears its mark on the page when it unmounts", () => {
      const { unmount } = render(<MobileTopBar />);
      scrollTo(900);
      unmount();
      expect(document.documentElement.dataset.topBar).toBeUndefined();
    });
  });

  it("offers Get started signed out", () => {
    session.user = null;
    render(<MobileTopBar />);
    expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute("href", "/signup");
    expect(screen.queryByRole("link", { name: "Your account" })).toBeNull();
  });
});
