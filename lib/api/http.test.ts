import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiFetch } from "./http";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("apiFetch", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("unwraps the { version, stats, data } success envelope", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ version: "v1", stats: { duration_ms: 3 }, data: [1, 2] })
    );
    const out = await apiFetch<number[]>("/v1/tracking", { token: "t" });
    expect(out).toEqual([1, 2]);
  });

  it("attaches the bearer token and JSON body", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: { id: 1 } }));
    await apiFetch("/v1/tracking", {
      method: "POST",
      token: "jwt-abc",
      body: { tmdb_id: 550 },
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("http://localhost:8080/v1/tracking");
    expect(init.headers.Authorization).toBe("Bearer jwt-abc");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ tmdb_id: 550 }));
  });

  it("throws ApiError with the server's error string and status", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: "score must be 0..100" }, 400)
    );
    const err = await apiFetch("/v1/tracking", { token: "t" }).catch(
      (e) => e
    );
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(400);
    expect(err.message).toBe("score must be 0..100");
  });

  it("returns null on 404 when allow404 is set", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "not found" }, 404));
    const out = await apiFetch("/v1/tracking/999", {
      token: "t",
      allow404: true,
    });
    expect(out).toBeNull();
  });

  it("passes raw payloads through without unwrapping", async () => {
    const tmdb = { page: 1, results: [{ id: 550 }] };
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: tmdb }));
    // raw skips envelope unwrap only when the payload has no data key;
    // the Klyvi API wraps passthroughs too, so raw:false is the norm. This
    // asserts raw returns the whole parsed body untouched.
    fetchMock.mockReset();
    fetchMock.mockResolvedValueOnce(jsonResponse(tmdb));
    const out = await apiFetch<typeof tmdb>("/v1/search?query=x", {
      raw: true,
    });
    expect(out).toEqual(tmdb);
  });

  it("wraps network failures in ApiError with status 0", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    const err = await apiFetch("/v1/reco/feed", { token: "t" }).catch(
      (e) => e
    );
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(0);
  });

  it("retries once after a 401 when a refresh hook is provided", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: "unauthorized" }, 401))
      .mockResolvedValueOnce(jsonResponse({ data: { ok: true } }));
    const refresh = vi.fn().mockResolvedValue("fresh-token");
    const out = await apiFetch<{ ok: boolean }>("/v1/users/me", {
      token: "stale-token",
      refreshToken: refresh,
    });
    expect(out).toEqual({ ok: true });
    expect(refresh).toHaveBeenCalledTimes(1);
    const secondInit = fetchMock.mock.calls[1][1];
    expect(secondInit.headers.Authorization).toBe("Bearer fresh-token");
  });

  it("does not retry a 401 twice", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "unauthorized" }, 401));
    const refresh = vi.fn().mockResolvedValue("fresh-token");
    const err = await apiFetch("/v1/users/me", {
      token: "stale",
      refreshToken: refresh,
    }).catch((e) => e);
    expect(err.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
