// @vitest-environment node
import { NextRequest } from "next/server";
import {
  getRedirectUrl,
  unstable_doesMiddlewareMatch,
} from "next/experimental/testing/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

type Cookie = { name: string; value: string };

// Stands in for the Supabase session a request arrives with.
const session = vi.hoisted(() => ({
  claims: null as { sub: string } | null,
  // Cookies a refresh writes. Empty when the access token is still fresh.
  refreshedCookies: [] as Cookie[],
  authServerRequests: 0,
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _key: string,
    opts: { cookies: { setAll(c: (Cookie & { options: object })[]): void } }
  ) => ({
    auth: {
      // Refreshes an expired session, then verifies the JWT locally.
      async getClaims() {
        if (session.refreshedCookies.length > 0) {
          opts.cookies.setAll(
            session.refreshedCookies.map((c) => ({ ...c, options: { path: "/" } }))
          );
        }
        return {
          data: session.claims ? { claims: session.claims } : null,
          error: null,
        };
      },
      // Asks the Auth server on every call.
      async getUser() {
        session.authServerRequests++;
        return {
          data: { user: session.claims ? { id: session.claims.sub } : null },
          error: null,
        };
      },
    },
  }),
}));

vi.mock("@/lib/env", () => ({
  env: { supabaseUrl: "https://sb.test", supabaseAnonKey: "anon" },
  supabaseConfigured: true,
}));

import { AUTH_SCREENS, PROTECTED_PREFIXES } from "@/lib/gated-routes";
import { config, proxy } from "./proxy";

const origin = "https://klyvi.test";
const visit = (path: string) => proxy(new NextRequest(`${origin}${path}`));

beforeEach(() => {
  session.claims = null;
  session.refreshedCookies = [];
  session.authServerRequests = 0;
});

describe("proxy", () => {
  it("knows a signed-in user without asking the Auth server", async () => {
    session.claims = { sub: "user-1" };

    const res = await visit("/home");

    expect(getRedirectUrl(res)).toBeNull();
    expect(session.authServerRequests).toBe(0);
  });

  it("sends a signed-out visitor on a protected page to sign in", async () => {
    const res = await visit("/library/favorites");

    expect(getRedirectUrl(res)).toBe(
      `${origin}/signin?next=%2Flibrary%2Ffavorites`
    );
  });

  // #100: the query comes back too, so a gated link to a filtered view
  // lands on that view after sign-in.
  it("keeps the query in next", async () => {
    const res = await visit("/library?view=grid&status=watching");

    expect(getRedirectUrl(res)).toBe(
      `${origin}/signin?next=${encodeURIComponent("/library?view=grid&status=watching")}`
    );
  });

  // Literals on purpose. Reading the shared list here would let a route fall
  // off it, and lose its gate, with every test still passing.
  it.each([
    "/home",
    "/find",
    "/library",
    "/profile",
    "/settings",
    "/notifications",
    "/onboarding",
  ])("gates %s for a signed-out visitor", async (path) => {
    const res = await visit(path);

    expect(getRedirectUrl(res)).toBe(
      `${origin}/signin?next=${encodeURIComponent(path)}`
    );
  });

  it.each(["/", "/signin", "/signup"])(
    "sends a signed-in user on %s home",
    async (path) => {
      session.claims = { sub: "user-1" };

      const res = await visit(path);

      expect(getRedirectUrl(res)).toBe(`${origin}/home`);
    }
  );

  it("keeps a signed-in user on /reset-password", async () => {
    session.claims = { sub: "user-1" };

    const res = await visit("/reset-password");

    expect(getRedirectUrl(res)).toBeNull();
  });

  it("hands a refreshed session to the page", async () => {
    session.claims = { sub: "user-1" };
    session.refreshedCookies = [{ name: "sb-auth-token", value: "fresh" }];

    const res = await visit("/home");

    expect(res.cookies.get("sb-auth-token")?.value).toBe("fresh");
  });

  it("hands a refreshed session through a redirect", async () => {
    // Refresh tokens are single use. A redirect that drops the new cookies
    // leaves the browser holding a spent one.
    session.claims = { sub: "user-1" };
    session.refreshedCookies = [{ name: "sb-auth-token", value: "fresh" }];

    const res = await visit("/signin");

    expect(getRedirectUrl(res)).toBe(`${origin}/home`);
    expect(res.cookies.get("sb-auth-token")?.value).toBe("fresh");
  });
});

// The admin page reads the session on the server, so the proxy refreshes it
// there. It doesn't gate it: a signed-out visitor gets the same 404 page as
// anyone else who isn't an admin, not a sign-in screen that shows it exists.
describe("proxy on /admin", () => {
  it("lets a signed-out visitor through to the page's own 404", async () => {
    const res = await visit("/admin");

    expect(getRedirectUrl(res)).toBeNull();
  });

  it("saves a refreshed session", async () => {
    session.claims = { sub: "user-1" };
    session.refreshedCookies = [{ name: "sb-auth-token", value: "fresh" }];

    const res = await visit("/admin?status=all");

    expect(getRedirectUrl(res)).toBeNull();
    expect(res.cookies.get("sb-auth-token")?.value).toBe("fresh");
  });
});

describe("proxy matcher", () => {
  const matches = (path: string) =>
    unstable_doesMiddlewareMatch({ config, url: `${origin}${path}` });

  it.each([
    "/",
    "/home",
    "/find",
    "/library",
    "/library/favorites",
    "/profile/stats",
    "/settings",
    "/notifications",
    "/onboarding",
    "/onboarding/rate",
    "/signin",
    "/signup",
    "/admin",
  ])("runs on %s", (path) => {
    expect(matches(path)).toBe(true);
  });

  // Next reads the matcher as literals at build time, so nothing else ties it
  // to the list the proxy gates from.
  it.each([...PROTECTED_PREFIXES, ...AUTH_SCREENS])(
    "runs on gated route %s",
    (path) => {
      expect(matches(path)).toBe(true);
    }
  );

  // The browser client keeps the session fresh on these, so the proxy has
  // nothing to do and the page skips a Supabase round trip.
  it.each([
    "/explore",
    "/explore/browse/trending",
    "/explore/top-100-films",
    "/movie/550",
    "/tv/1399",
    "/tv/1399/season/1",
    "/terms",
    "/donate",
    "/reset-password",
    "/auth/callback",
    "/homepage",
    "/_next/static/chunks/main.js",
  ])("skips %s", (path) => {
    expect(matches(path)).toBe(false);
  });
});
