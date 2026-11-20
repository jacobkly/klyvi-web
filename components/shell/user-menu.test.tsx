import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserMenu } from "./user-menu";

const notices = vi.hoisted(() => ({ unread: 0 }));

vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => ({
    user: { email: "a@b.com" },
    profile: null,
    loading: false,
    signOut: vi.fn(),
  }),
}));
vi.mock("@/components/notifications/unread-provider", () => ({
  useUnreadNotices: () => ({ unread: notices.unread, setUnread: vi.fn() }),
}));

const dots = () => document.querySelectorAll('[data-slot="unread-dot"]');

beforeEach(() => {
  notices.unread = 0;
});

describe("UserMenu", () => {
  it("has no Donate item", async () => {
    const user = userEvent.setup();
    render(<UserMenu />);
    await user.click(screen.getByRole("button", { name: "Your account" }));
    expect(
      await screen.findByRole("menuitem", { name: "Settings" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Donate" })).toBeNull();
  });

  it("shows no dot with nothing unread", async () => {
    const user = userEvent.setup();
    render(<UserMenu />);
    expect(dots()).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Your account" }));
    expect(
      await screen.findByRole("menuitem", { name: "Notifications" })
    ).toBeInTheDocument();
    expect(dots()).toHaveLength(0);
  });

  it("shows the dot on the avatar and on the item with unread notices", async () => {
    notices.unread = 2;
    const user = userEvent.setup();
    render(<UserMenu />);
    expect(dots()).toHaveLength(1);

    await user.click(
      screen.getByRole("button", {
        name: "Your account, 2 unread notifications",
      })
    );
    expect(
      await screen.findByRole("menuitem", { name: /Notifications.*2 unread/ })
    ).toHaveAttribute("href", "/notifications");
    expect(dots()).toHaveLength(2);
  });

  it("names you at the top and reaches the library's pages in one tap", async () => {
    const user = userEvent.setup();
    render(<UserMenu />);
    await user.click(screen.getByRole("button", { name: "Your account" }));

    expect(await screen.findByText("a@b.com")).toBeInTheDocument();
    // Library is a tab, so the menu doesn't repeat it.
    expect(screen.queryByRole("menuitem", { name: "Library" })).toBeNull();
    expect(screen.getByRole("menuitem", { name: "Favorites" })).toHaveAttribute(
      "href",
      "/library/favorites"
    );
    expect(screen.getByRole("menuitem", { name: "Stats" })).toHaveAttribute(
      "href",
      "/profile/stats"
    );
    // Terms and Privacy live in the footer.
    expect(screen.queryByRole("menuitem", { name: "Terms" })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: "Privacy" })).toBeNull();
  });

  it("uses the singular for one", () => {
    notices.unread = 1;
    render(<UserMenu />);
    expect(
      screen.getByRole("button", {
        name: "Your account, 1 unread notification",
      })
    ).toBeInTheDocument();
  });
});
