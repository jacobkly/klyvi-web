import { beforeEach, describe, expect, it, vi } from "vitest";

import { browserFetch } from "./http";
import { listInteractions } from "./interactions";

vi.mock("./http", () => ({ browserFetch: vi.fn() }));

const fetchMock = vi.mocked(browserFetch);

describe("listInteractions", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue([]);
  });

  it("asks for the whole capped history by default", async () => {
    await listInteractions();
    expect(fetchMock.mock.calls[0][0]).toBe("/v1/interactions");
  });

  // The API caps the list, so a count of ratings asks for ratings only and a
  // long tail of impressions cannot crowd them out.
  it("passes the kind, window and limit", async () => {
    await listInteractions({ kind: "rated", sinceDays: 30, limit: 50 });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "/v1/interactions?since_days=30&kind=rated&limit=50"
    );
  });
});
