import { render, screen } from "@testing-library/react";
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

  it("leaves the account to the Profile tab", () => {
    render(<MobileTopBar />);
    expect(screen.queryByRole("link", { name: /Your account/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Your account/ })).toBeNull();
  });

  it("offers Get started signed out", () => {
    session.user = null;
    render(<MobileTopBar />);
    expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute("href", "/signup");
    expect(screen.queryByRole("link", { name: "Your account" })).toBeNull();
  });
});
