import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const path = vi.hoisted(() => ({ current: "/home" }));
vi.mock("next/navigation", () => ({
  usePathname: () => path.current,
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
  useUnreadNotices: () => ({ unread: 0, setUnread: vi.fn() }),
}));
vi.mock("@/app/(app)/find/find-client", () => ({
  FindClient: ({ embedded }: { embedded?: boolean }) => (
    <div data-testid="find">{embedded ? "embedded" : "page"}</div>
  ),
}));

import { TooltipProvider } from "@/components/ui/tooltip";
import { LeftRail } from "./left-rail";

function renderRail(onOpenSearch = vi.fn()) {
  render(
    <TooltipProvider delay={0}>
      <LeftRail onOpenSearch={onOpenSearch} />
    </TooltipProvider>
  );
  return screen.getByRole("navigation", { name: "Primary" });
}

beforeEach(() => {
  path.current = "/home";
});

describe("LeftRail", () => {
  it("lists the pages, Find next, search and the account, and marks the page you are on", () => {
    path.current = "/library/favorites";
    const nav = renderRail();
    for (const name of ["Klyvi, home", "Home", "Explore", "Library"]) {
      expect(within(nav).getByRole("link", { name })).toBeInTheDocument();
    }
    expect(within(nav).getByRole("button", { name: "Find next" })).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: "Search" })).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: "Your account" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Library" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
  });

  it("names each icon in a tooltip to the right on hover", async () => {
    const user = userEvent.setup();
    const nav = renderRail();
    await user.hover(within(nav).getByRole("link", { name: "Explore" }));
    expect(await screen.findByText("Explore", { selector: "[data-slot=tooltip-content] *, [data-slot=tooltip-content]" })).toBeInTheDocument();
  });

  it("opens Find next as a pop-up over the page", async () => {
    const user = userEvent.setup();
    const nav = renderRail();
    await user.click(within(nav).getByRole("button", { name: "Find next" }));
    const dialog = await screen.findByRole("dialog", { name: "Find next" });
    expect(await within(dialog).findByTestId("find")).toHaveTextContent("embedded");
  });

  it("closes the pop-up when you follow a link to another page", async () => {
    const user = userEvent.setup();
    const ui = (
      <TooltipProvider delay={0}>
        <LeftRail onOpenSearch={vi.fn()} />
      </TooltipProvider>
    );
    const { rerender } = render(ui);
    await user.click(screen.getByRole("button", { name: "Find next" }));
    await screen.findByRole("dialog", { name: "Find next" });

    path.current = "/movie/577922";
    rerender(
      <TooltipProvider delay={0}>
        <LeftRail onOpenSearch={vi.fn()} />
      </TooltipProvider>
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("is a plain link to the page when you are already on Find next", () => {
    path.current = "/find";
    const nav = renderRail();
    expect(within(nav).getByRole("link", { name: "Find next" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).queryByRole("button", { name: "Find next" })).toBeNull();
  });

  it("is a short pill at every width, and docks beside the page past 1080p", () => {
    const nav = renderRail();
    expect(nav).toHaveClass("top-8", "left-3", "gap-6", "ultrawide:left-(--rail-dock)");
    expect(nav).not.toHaveClass("inset-y-3");
    expect(nav).not.toHaveClass("justify-between");
  });

  it("hands search to the shell", async () => {
    const user = userEvent.setup();
    const onOpenSearch = vi.fn();
    const nav = renderRail(onOpenSearch);
    await user.click(within(nav).getByRole("button", { name: "Search" }));
    expect(onOpenSearch).toHaveBeenCalledOnce();
  });
});
