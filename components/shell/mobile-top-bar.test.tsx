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

  it("links the wordmark home, signed in and out", () => {
    const { unmount } = render(<MobileTopBar />);
    expect(screen.getByRole("link", { name: "Klyvi" })).toHaveAttribute("href", "/home");
    unmount();
    session.user = null;
    render(<MobileTopBar />);
    expect(screen.getByRole("link", { name: "Klyvi" })).toHaveAttribute("href", "/");
  });

  it("opens search with a 44px button", async () => {
    const onOpenSearch = vi.fn();
    render(<MobileTopBar onOpenSearch={onOpenSearch} />);
    const search = screen.getByRole("button", { name: "Search" });
    expect(search.className).toContain("size-11");
    await userEvent.setup().click(search);
    expect(onOpenSearch).toHaveBeenCalledOnce();
  });

  it("trades the wordmark for a 44px Back arrow on a details page", async () => {
    const onBack = vi.fn();
    render(<MobileTopBar onBack={onBack} />);
    const back = screen.getByRole("button", { name: "Back" });
    expect(back.className).toContain("size-11");
    expect(screen.queryByRole("link", { name: "Klyvi" })).toBeNull();
    await userEvent.setup().click(back);
    expect(onBack).toHaveBeenCalledOnce();
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

    it("is bare at the top, leaves going down and comes back as glass going up", () => {
      render(<MobileTopBar />);
      const bar = screen.getByRole("banner");
      expect(bar.className).not.toContain("glass");

      scrollTo(900);
      expect(bar.className).toContain("-translate-y-full");
      expect(document.documentElement.dataset.topBar).toBe("hidden");

      scrollTo(880);
      expect(bar.className).not.toContain("-translate-y-full");
      expect(bar.className).toContain("glass");

      scrollTo(0);
      expect(bar.className).not.toContain("glass");
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
