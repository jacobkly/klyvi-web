import { beforeEach, describe, expect, it, vi } from "vitest";

import { browserFetch } from "./http";
import { getNotifications, markAllNotificationsRead } from "./notifications";
import type { WireNotificationPage } from "./wire";

vi.mock("./http", () => ({ browserFetch: vi.fn(), apiFetch: vi.fn() }));

const fetchMock = vi.mocked(browserFetch);

/** Shape from klyvi/docs/API.md, GET /v1/notifications. */
const PAGE: WireNotificationPage = {
  notifications: [
    {
      id: 3,
      kind: "season_premiere",
      media_type: "tv",
      tmdb_id: 1416,
      season_number: 23,
      title: "Grey's Anatomy",
      poster_path: "/grey.jpg",
      event_date: "2026-10-15",
      created_at: "2026-10-09T03:00:00Z",
      read_at: null,
    },
    {
      id: 2,
      kind: "film_release",
      media_type: "movie",
      tmdb_id: 791523,
      season_number: null,
      title: "Wildwood",
      poster_path: null,
      event_date: "2026-10-19",
      created_at: "2026-10-19T03:00:00Z",
      read_at: "2026-10-19T12:00:00Z",
    },
  ],
  unread_count: 1,
  has_more: true,
};

beforeEach(() => fetchMock.mockReset());

describe("getNotifications", () => {
  it("maps the page", async () => {
    fetchMock.mockResolvedValue(PAGE);
    const page = await getNotifications();

    expect(fetchMock.mock.calls[0][0]).toBe("/v1/notifications");
    expect(page.unreadCount).toBe(1);
    expect(page.hasMore).toBe(true);
    expect(page.notifications[0]).toEqual({
      id: 3,
      kind: "season_premiere",
      tmdbId: 1416,
      seasonNumber: 23,
      title: "Grey's Anatomy",
      posterPath: "/grey.jpg",
      eventDate: "2026-10-15",
      readAt: null,
    });
    expect(page.notifications[1].seasonNumber).toBeNull();
    expect(page.notifications[1].readAt).toBe("2026-10-19T12:00:00Z");
  });

  it("asks for the page it was given", async () => {
    fetchMock.mockResolvedValue(PAGE);
    await getNotifications({ limit: 1, offset: 30 });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "/v1/notifications?limit=1&offset=30"
    );
  });

  it("copes with an empty list sent as null", async () => {
    fetchMock.mockResolvedValue({
      notifications: null,
      unread_count: 0,
      has_more: false,
    });
    expect((await getNotifications()).notifications).toEqual([]);
  });
});

describe("markAllNotificationsRead", () => {
  it("posts all and returns what is still unread", async () => {
    fetchMock.mockResolvedValue({ unread_count: 0 });
    await expect(markAllNotificationsRead()).resolves.toBe(0);
    expect(fetchMock).toHaveBeenCalledWith("/v1/notifications/read", {
      method: "POST",
      body: { all: true },
    });
  });
});
