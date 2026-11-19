import { beforeEach, describe, expect, it, vi } from "vitest";

import { getErrorGroups, setErrorResolved } from "./admin";
import { apiFetch, browserFetch } from "./http";
import type { WireErrorGroup, WireErrorGroupPage } from "./wire";

vi.mock("./http", () => ({ browserFetch: vi.fn(), apiFetch: vi.fn() }));

const apiMock = vi.mocked(apiFetch);
const browserMock = vi.mocked(browserFetch);

/** Shape from klyvi/docs/API.md, GET /v1/admin/errors. */
const GROUP: WireErrorGroup = {
  id: 12,
  source: "web",
  kind: "TypeError",
  message: "x is undefined",
  stack: "TypeError: x is undefined\n    at Feed",
  route: "/movies/:id",
  method: null,
  status: null,
  user_id: "8b1c0000-0000-0000-0000-000000000000",
  count: 4,
  first_seen: "2026-11-17T09:12:00Z",
  last_seen: "2026-11-18T14:03:00Z",
  resolved_at: null,
};

const PAGE: WireErrorGroupPage = {
  errors: [GROUP],
  counts: { open: 3, resolved: 1 },
  has_more: true,
};

beforeEach(() => {
  apiMock.mockReset();
  browserMock.mockReset();
});

describe("getErrorGroups", () => {
  it("asks with the token for a status and offset, and maps the page", async () => {
    apiMock.mockResolvedValue(PAGE);

    const page = await getErrorGroups("tok", { status: "all", offset: 50 });

    expect(apiMock).toHaveBeenCalledWith(
      "/v1/admin/errors?status=all&offset=50",
      expect.objectContaining({ token: "tok", allow404: true, cache: "no-store" })
    );
    expect(page).toEqual({
      errors: [
        {
          id: 12,
          source: "web",
          kind: "TypeError",
          message: "x is undefined",
          stack: "TypeError: x is undefined\n    at Feed",
          route: "/movies/:id",
          method: null,
          status: null,
          userId: "8b1c0000-0000-0000-0000-000000000000",
          count: 4,
          firstSeen: "2026-11-17T09:12:00Z",
          lastSeen: "2026-11-18T14:03:00Z",
          resolvedAt: null,
        },
      ],
      counts: { open: 3, resolved: 1 },
      hasMore: true,
    });
  });

  it("leaves the defaults out of the query", async () => {
    apiMock.mockResolvedValue({ ...PAGE, errors: null });

    const page = await getErrorGroups("tok", { status: "open", offset: 0 });

    expect(apiMock.mock.calls[0][0]).toBe("/v1/admin/errors");
    expect(page?.errors).toEqual([]);
  });

  // Not an admin, or the routes aren't on: the API's unknown-route 404.
  it("is null when the API answers 404", async () => {
    apiMock.mockResolvedValue(null);

    expect(await getErrorGroups("tok", { status: "open", offset: 0 })).toBeNull();
  });
});

describe("setErrorResolved", () => {
  it("patches the group and returns it mapped", async () => {
    browserMock.mockResolvedValue({ ...GROUP, resolved_at: "2026-11-18T15:00:00Z" });

    const g = await setErrorResolved(12, true);

    expect(browserMock).toHaveBeenCalledWith("/v1/admin/errors/12", {
      method: "PATCH",
      body: { resolved: true },
    });
    expect(g.resolvedAt).toBe("2026-11-18T15:00:00Z");
  });
});
