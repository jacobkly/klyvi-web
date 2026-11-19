import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const token = vi.hoisted(() => ({ value: null as string | null, fail: false }));

vi.mock("@/lib/supabase/browser", () => ({
  getBrowserAccessToken: async () => {
    if (token.fail) throw new Error("no session store");
    return token.value;
  },
}));

import {
  REPORT_BODY_LIMIT,
  reportApiFailure,
  reportError,
  resetErrorReports,
} from "./errors";

const fetchMock = vi.fn();

function sent(i = 0) {
  const [url, init] = fetchMock.mock.calls[i] as [string, RequestInit];
  return { url, init, body: JSON.parse(String(init.body)) };
}

function boom(message: string, name = "TypeError") {
  const e = new Error(message);
  e.name = name;
  e.stack = `${name}: ${message}\n    at render (app/page.tsx:10:5)`;
  return e;
}

beforeEach(() => {
  resetErrorReports();
  token.value = null;
  token.fail = false;
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response(null, { status: 202 }));
  vi.stubGlobal("fetch", fetchMock);
  window.history.pushState({}, "", "/home?tab=new#top");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("reportError", () => {
  it("posts the error to /v1/errors and keeps it alive past an unload", async () => {
    await reportError(boom("x is undefined"), "abc123");

    const { url, init, body } = sent();
    expect(url).toBe("http://localhost:8080/v1/errors");
    expect(init.method).toBe("POST");
    expect(init.keepalive).toBe(true);
    expect(body).toEqual({
      kind: "TypeError",
      message: "x is undefined",
      stack: "TypeError: x is undefined\n    at render (app/page.tsx:10:5)",
      page: "/home",
      digest: "abc123",
    });
  });

  it("names the user when signed in, and nobody when not", async () => {
    await reportError(boom("signed out"));
    token.value = "jwt-abc";
    await reportError(boom("signed in"));

    expect(sent(0).init.headers).not.toHaveProperty("Authorization");
    expect(sent(1).init.headers).toHaveProperty("Authorization", "Bearer jwt-abc");
  });

  it("sends the same error once", async () => {
    await reportError(boom("same"));
    await reportError(boom("same"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sends at most five reports per page load", async () => {
    for (let i = 0; i < 8; i++) await reportError(boom(`error ${i}`));
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it("reports things that aren't Errors", async () => {
    await reportError("a thrown string");
    expect(sent().body).toMatchObject({ kind: "Error", message: "a thrown string" });
  });

  it("never throws, whatever fails", async () => {
    token.fail = true;
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(reportError(boom("first"))).resolves.toBeUndefined();
    await expect(reportError(null)).resolves.toBeUndefined();
  });

  it("trims a huge stack so the body fits the API's 4 KB cap", async () => {
    const e = boom("é".repeat(3000));
    e.stack = "    at frame (file.js:1:1)\n".repeat(500);
    await reportError(e);

    const raw = String(sent().init.body);
    expect(new TextEncoder().encode(raw).length).toBeLessThanOrEqual(
      REPORT_BODY_LIMIT
    );
    expect(sent().body.stack.startsWith("    at frame (file.js:1:1)")).toBe(true);
  });
});

describe("reportApiFailure", () => {
  it("sends no stack, and hides ids so one bug stays one group", async () => {
    window.history.pushState({}, "", "/movie/550-fight-club");
    await reportApiFailure("NetworkError", "GET /v1/movies/550?x=1 failed");

    expect(sent().body).toEqual({
      kind: "NetworkError",
      message: "GET /v1/movies/:id failed",
      page: "/movie/:id",
    });
  });
});
