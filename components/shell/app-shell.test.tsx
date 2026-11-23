import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/home",
  useRouter: () => ({ push: vi.fn() }),
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
