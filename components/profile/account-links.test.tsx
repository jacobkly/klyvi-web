import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const signOut = vi.fn();

vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => ({ user: { email: "a@b.com" }, profile: null, loading: false, signOut }),
}));
vi.mock("@/components/notifications/unread-provider", () => ({
  useUnreadNotices: () => ({ unread: 2, setUnread: vi.fn() }),
}));

import { AccountLinks } from "./account-links";

describe("AccountLinks", () => {
  it("lists the account pages as 44px rows, on phones only", () => {
    render(<AccountLinks />);
    const nav = screen.getByRole("navigation", { name: "Account" });
    expect(nav.className).toContain("md:hidden");
    const links = within(nav).getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual([
      "/library/favorites",
      "/settings",
      "/notifications",
    ]);
    expect(links[0].className).toContain("min-h-12");
    expect(within(nav).getByText("2 unread")).toBeInTheDocument();
  });

  it("signs you out", async () => {
    render(<AccountLinks />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Sign out" }));
    expect(signOut).toHaveBeenCalledOnce();
  });
});
