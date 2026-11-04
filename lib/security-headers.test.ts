import { describe, expect, it } from "vitest";

import { securityHeaders } from "./security-headers";

const production = {
  apiUrl: "https://api.klyvi.net",
  supabaseUrl: "https://abc.supabase.co",
  dev: false,
};

function header(key: string, opts = production) {
  return securityHeaders(opts).find((h) => h.key === key)?.value;
}

function directive(name: string, opts = production) {
  const parts = header("Content-Security-Policy", opts)?.split("; ") ?? [];
  return parts.find((p) => p === name || p.startsWith(`${name} `));
}

describe("securityHeaders", () => {
  it("sets the plain hardening headers", () => {
    expect(header("X-Content-Type-Options")).toBe("nosniff");
    expect(header("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(header("Permissions-Policy")).toContain("camera=()");
    expect(header("Permissions-Policy")).toContain("microphone=()");
    expect(header("Permissions-Policy")).toContain("geolocation=()");
  });

  it("refuses framing, plugins and a moved base", () => {
    expect(directive("frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(directive("object-src")).toBe("object-src 'none'");
    expect(directive("base-uri")).toBe("base-uri 'self'");
    expect(directive("form-action")).toBe("form-action 'self'");
  });

  // This is the point of the policy: script that gets in can't send data out.
  it("only lets the page talk to itself, the API and Supabase", () => {
    expect(directive("connect-src")).toBe(
      "connect-src 'self' https://api.klyvi.net https://abc.supabase.co"
    );
  });

  // Posters come from TMDB and avatars from the Supabase storage bucket.
  it("only loads images from the site, TMDB and Supabase", () => {
    expect(directive("img-src")).toBe(
      "img-src 'self' https://image.tmdb.org https://abc.supabase.co"
    );
  });

  // A source with a path only matches that path, which would block other routes.
  it("reduces a configured URL to its origin", () => {
    const opts = {
      ...production,
      apiUrl: "https://api.klyvi.net/v1/",
      supabaseUrl: "https://abc.supabase.co/",
    };
    expect(directive("connect-src", opts)).toBe(
      "connect-src 'self' https://api.klyvi.net https://abc.supabase.co"
    );
  });

  it("leaves out a URL that is not set", () => {
    const opts = { ...production, supabaseUrl: "" };
    expect(directive("connect-src", opts)).toBe(
      "connect-src 'self' https://api.klyvi.net"
    );
    expect(directive("img-src", opts)).toBe(
      "img-src 'self' https://image.tmdb.org"
    );
  });

  it("keeps inline script for Next and never allows eval in production", () => {
    expect(directive("script-src")).toBe("script-src 'self' 'unsafe-inline'");
  });

  it("allows what the dev server needs only in dev", () => {
    const opts = { ...production, dev: true };
    expect(directive("script-src", opts)).toContain("'unsafe-eval'");
    expect(directive("connect-src", opts)).toContain("ws:");
    expect(directive("connect-src")).not.toContain("ws:");
  });
});
