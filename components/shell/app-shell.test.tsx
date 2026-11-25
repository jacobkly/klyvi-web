import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const nav = vi.hoisted(() => ({ path: "/home", replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => nav.path,
  useRouter: () => ({ push: vi.fn(), replace: nav.replace }),
}));
vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => ({
    user: { email: "a@b.com" },
    profile: null,
    loading: false,
    signOut: vi.fn(),
  }),
}));
vi.mock("@/components/notifications/unread-provider", () => ({
  UnreadProvider: ({ children }: { children: React.ReactNode }) => children,
  useUnreadNotices: () => ({ unread: 0, setUnread: vi.fn() }),
}));

import { AppShell } from "./app-shell";

beforeEach(() => {
  nav.path = "/home";
});

describe("AppShell", () => {
  it("has a skip link first, which moves focus to the page content", async () => {
    const user = userEvent.setup();
    render(
      <AppShell>
        <h1>Library</h1>
      </AppShell>
    );

    // The first stop on Tab, ahead of the nav.
    await user.tab();
    const skip = screen.getByRole("link", { name: "Skip to content" });
    expect(skip).toHaveFocus();

    await user.keyboard("{Enter}");
    const content = screen.getByRole("heading", { name: "Library" })
      .parentElement as HTMLElement;
    expect(content).toHaveAttribute("id", "content");
    expect(content).toHaveFocus();
  });

  it("puts a way back on every details page, on desktop and phones", async () => {
    nav.path = "/tv/1399/season/2";
    render(
      <AppShell>
        <h1>Season 2</h1>
      </AppShell>
    );
    const backs = screen.getAllByRole("button", { name: "Back" });
    expect(backs).toHaveLength(2);
    for (const back of backs) {
      nav.replace.mockClear();
      await userEvent.setup().click(back);
      expect(nav.replace).toHaveBeenCalledWith("/tv/1399");
    }
  });

  it("has none on the pages the nav already reaches", () => {
    render(
      <AppShell>
        <h1>Home</h1>
      </AppShell>
    );
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
  });

  it("swaps the desktop top bar for the left rail when signed in", () => {
    const { container } = render(
      <AppShell>
        <h1>Home</h1>
      </AppShell>
    );
    expect(container.querySelector('[data-slot="left-rail"]')).not.toBeNull();
    expect(container.querySelector("header.sticky:not(.md\\:hidden)")).toBeNull();
  });
});
