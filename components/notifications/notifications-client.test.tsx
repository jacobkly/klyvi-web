import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserMenu } from "@/components/shell/user-menu";
import { browserFetch } from "@/lib/api/http";
import type { WireNotification, WireNotificationPage } from "@/lib/api/wire";

import { NotificationsClient } from "./notifications-client";
import { UnreadProvider } from "./unread-provider";

const session = vi.hoisted(() => ({
  userId: "u1" as string | null,
  pathname: "/notifications",
  profile: null as null | {
    notifyPremieres: boolean;
    notifyReleases: boolean;
  },
}));

vi.mock("@/lib/api/http", () => ({ browserFetch: vi.fn(), apiFetch: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => session.pathname }));
vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => ({
    user: session.userId ? { id: session.userId, email: "a@b.com" } : null,
    profile: session.profile,
    loading: false,
    signOut: vi.fn(),
  }),
}));

const fetchMock = vi.mocked(browserFetch);

function notice(over: Partial<WireNotification> = {}): WireNotification {
  return {
    id: 1,
    kind: "season_premiere",
    media_type: "tv",
    tmdb_id: 153312,
    season_number: 4,
    title: "Tulsa King",
    poster_path: null,
    event_date: "2026-10-16",
    link: null,
    created_at: "2026-10-09T03:00:00Z",
    read_at: null,
    ...over,
  };
}

const FILM = notice({
  id: 2,
  kind: "film_release",
  media_type: "movie",
  tmdb_id: 791523,
  season_number: null,
  title: "Wildwood",
  event_date: "2026-10-19",
  read_at: "2026-10-19T12:00:00Z",
});

function page(over: Partial<WireNotificationPage> = {}): WireNotificationPage {
  return {
    notifications: [notice(), FILM],
    unread_count: 1,
    has_more: false,
    ...over,
  };
}

/** Answers the list GETs from `pages` in order, and the mark-read POST. */
function serve(...pages: (WireNotificationPage | Error)[]) {
  const queue = [...pages];
  fetchMock.mockImplementation(async (path: string) => {
    if (path === "/v1/notifications/read") return { unread_count: 0 };
    const next = queue.shift();
    if (next instanceof Error) throw next;
    return next;
  });
}

const markCalls = () =>
  fetchMock.mock.calls.filter(([path]) => path === "/v1/notifications/read");

const listCalls = () =>
  fetchMock.mock.calls.filter(([path]) =>
    String(path).startsWith("/v1/notifications?") || path === "/v1/notifications"
  );

beforeEach(() => {
  fetchMock.mockReset();
  session.profile = null;
  session.userId = "u1";
  session.pathname = "/notifications";
});

describe("NotificationsClient", () => {
  it("makes one list request, which the menu's dot reads from too", async () => {
    serve(page());
    session.userId = null;
    const { rerender } = render(
      <UnreadProvider>
        <NotificationsClient />
      </UnreadProvider>
    );
    // The session resolves after the page mounts.
    session.userId = "u1";
    rerender(
      <UnreadProvider>
        <NotificationsClient />
      </UnreadProvider>
    );

    await screen.findByRole("link", { name: /Tulsa King/ });
    await waitFor(() => expect(markCalls()).toHaveLength(1));
    expect(listCalls()).toHaveLength(1);
    expect(listCalls()[0][0]).toBe("/v1/notifications");
  });

  it("links each row to its season or film", async () => {
    serve(page());
    render(<NotificationsClient />);

    expect(await screen.findByRole("link", { name: /Tulsa King/ })).toHaveAttribute(
      "href",
      "/tv/153312/season/4"
    );
    expect(screen.getByRole("link", { name: /Wildwood/ })).toHaveAttribute(
      "href",
      "/movie/791523"
    );
  });

  it("links a policy notice to its page and shows its whole text", async () => {
    const text =
      "Our terms change on 1 March. We now say how long server logs are kept.";
    serve(
      page({
        notifications: [
          notice({
            id: 9,
            kind: "policy",
            media_type: null,
            tmdb_id: null,
            season_number: null,
            title: text,
            event_date: "2026-10-01",
            link: "/terms",
          }),
        ],
      })
    );
    render(<NotificationsClient />);

    const link = await screen.findByRole("link", { name: /Our terms change/ });
    expect(link).toHaveAttribute("href", "/terms");
    expect(within(link).getByText(text)).not.toHaveClass("truncate");
    expect(link).toHaveTextContent(/Policy update/);
  });

  it("keeps the server's order, newest first", async () => {
    serve(page());
    render(<NotificationsClient />);

    await screen.findByRole("link", { name: /Tulsa King/ });
    const names = within(screen.getByRole("list"))
      .getAllByRole("link")
      .map((l) => l.textContent);
    expect(names[0]).toContain("Tulsa King");
    expect(names[1]).toContain("Wildwood");
  });

  it("marks only the unread row as new, and says how many", async () => {
    serve(page());
    render(<NotificationsClient />);

    expect(
      await screen.findByRole("link", { name: /Tulsa King.*New/ })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Wildwood/ })).not.toHaveTextContent(
      "New"
    );
    expect(screen.getByText("1 new")).toBeInTheDocument();
  });

  it("marks everything read on opening, and keeps the markers for this visit", async () => {
    serve(page());
    render(<NotificationsClient />);

    await waitFor(() => expect(markCalls()).toHaveLength(1));
    expect(markCalls()[0][1]).toEqual({ method: "POST", body: { all: true } });
    expect(screen.getByRole("link", { name: /Tulsa King.*New/ })).toBeInTheDocument();
  });

  it("writes nothing when there is nothing unread", async () => {
    serve(page({ notifications: [FILM], unread_count: 0 }));
    render(<NotificationsClient />);

    await screen.findByRole("link", { name: /Wildwood/ });
    expect(markCalls()).toHaveLength(0);
    expect(screen.queryByText(/\bnew\b/)).toBeNull();
  });

  it("shows the empty state's promise", async () => {
    serve(page({ notifications: [], unread_count: 0 }));
    render(<NotificationsClient />);

    expect(await screen.findByText("Nothing yet")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Season premieres and updates for what you track will show up here."
      )
    ).toBeInTheDocument();
  });

  it("offers a retry when the list fails, and it works", async () => {
    const user = userEvent.setup();
    serve(new Error("down"), page());
    render(<NotificationsClient />);

    await user.click(await screen.findByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("link", { name: /Tulsa King/ })
    ).toBeInTheDocument();
  });

  it("loads older notices on request and appends them", async () => {
    const user = userEvent.setup();
    serve(
      page({ has_more: true }),
      page({
        notifications: [notice({ id: 9, title: "Older Show" })],
        unread_count: 0,
        has_more: false,
      })
    );
    render(<NotificationsClient />);

    await user.click(await screen.findByRole("button", { name: "Show more" }));

    expect(
      await screen.findByRole("link", { name: /Older Show/ })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Tulsa King/ })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/v1/notifications?offset=2",
      expect.anything()
    );
    expect(screen.queryByRole("button", { name: "Show more" })).toBeNull();
  });

  it("loads older notices on its own as the end nears", async () => {
    // jsdom lays nothing out, so put every element a little below the top.
    const spy = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue({ top: 100, bottom: 100 } as DOMRect);
    serve(
      page({ has_more: true }),
      page({
        notifications: [notice({ id: 9, title: "Older Show" })],
        unread_count: 0,
        has_more: false,
      })
    );
    render(<NotificationsClient />);

    expect(
      await screen.findByRole("link", { name: /Older Show/ })
    ).toBeInTheDocument();
    expect(listCalls()).toHaveLength(2);
    spy.mockRestore();
  });

  it("stops loading on its own after a failure, until Try again", async () => {
    const spy = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue({ top: 100, bottom: 100 } as DOMRect);
    const user = userEvent.setup();
    serve(page({ has_more: true }), new Error("down"), page({
      notifications: [notice({ id: 9, title: "Older Show" })],
      unread_count: 0,
    }));
    render(<NotificationsClient />);

    expect(await screen.findByText("Could not load more.")).toBeInTheDocument();
    await new Promise((r) => window.requestAnimationFrame(r));
    expect(listCalls()).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("link", { name: /Older Show/ })
    ).toBeInTheDocument();
    spy.mockRestore();
  });

  it("keeps the rows when older ones fail to load", async () => {
    const user = userEvent.setup();
    serve(page({ has_more: true }), new Error("down"), page({
      notifications: [notice({ id: 9, title: "Older Show" })],
      unread_count: 0,
    }));
    render(<NotificationsClient />);

    await user.click(await screen.findByRole("button", { name: "Show more" }));

    expect(await screen.findByText("Could not load more.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Tulsa King/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("link", { name: /Older Show/ })
    ).toBeInTheDocument();
  });

  it.each([
    [{ notifyPremieres: true, notifyReleases: true }, null],
    [{ notifyPremieres: false, notifyReleases: true }, /Season premieres are off/],
    [{ notifyPremieres: true, notifyReleases: false }, /Film releases are off/],
    [
      { notifyPremieres: false, notifyReleases: false },
      /Season premieres and film releases are off/,
    ],
  ])("says when a type is turned off: %o", async (profile, expected) => {
    session.profile = profile;
    serve(page());
    render(<NotificationsClient />);

    await screen.findByRole("link", { name: /Tulsa King/ });
    if (expected) {
      expect(screen.getByText(expected)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
        "href",
        "/settings"
      );
    } else {
      expect(screen.queryByRole("link", { name: "Settings" })).toBeNull();
    }
  });
});

describe("the dot and the page together", () => {
  it("clears the dot when the page opens", async () => {
    // The menu's count, then the page's list.
    serve(page({ notifications: [], unread_count: 2 }), page({ unread_count: 2 }));
    render(
      <UnreadProvider>
        <UserMenu />
        <NotificationsClient />
      </UnreadProvider>
    );

    await waitFor(() => expect(markCalls()).toHaveLength(1));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Your account" })
      ).toBeInTheDocument()
    );
  });

  it("leaves the dot when marking read fails", async () => {
    fetchMock.mockImplementation(async (path: string) => {
      if (path === "/v1/notifications/read") throw new Error("down");
      return page({ unread_count: 2 });
    });
    render(
      <UnreadProvider>
        <UserMenu />
        <NotificationsClient />
      </UnreadProvider>
    );

    await waitFor(() => expect(markCalls()).toHaveLength(1));
    expect(
      await screen.findByRole("button", {
        name: "Your account, 2 unread notifications",
      })
    ).toBeInTheDocument();
  });
});
