import { beforeEach, describe, expect, it, vi } from "vitest";

import { browserFetch } from "./http";
import { getFeed } from "./reco";

vi.mock("./http", () => ({ browserFetch: vi.fn() }));

const fetchMock = vi.mocked(browserFetch);

describe("getFeed", () => {
  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue([]);
  });

  it("asks for the mixed feed by default", async () => {
    await getFeed();
    expect(fetchMock.mock.calls[0][0]).toBe("/v1/reco/feed");
  });

  it("sends no filter for all, so it shares the default feed", async () => {
    await getFeed({ media: "all" });
    expect(fetchMock.mock.calls[0][0]).toBe("/v1/reco/feed");
  });

  it("narrows the feed to films or to shows", async () => {
    await getFeed({ media: "movie" });
    await getFeed({ media: "tv" });
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual([
      "/v1/reco/feed?media=movie",
      "/v1/reco/feed?media=tv",
    ]);
  });
});
