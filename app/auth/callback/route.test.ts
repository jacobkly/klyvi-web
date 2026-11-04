// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

const exchangeCodeForSession = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/server", () => ({
  getServerSupabase: async () => ({ auth: { exchangeCodeForSession } }),
}));

function callback(query: string) {
  return GET(new Request(`https://klyvi.net/auth/callback?${query}`));
}

/** An account created `ageMs` ago, as the code exchange returns it. */
function accountAged(ageMs: number) {
  return {
    data: {
      user: { created_at: new Date(Date.now() - ageMs).toISOString() },
    },
    error: null,
  };
}

const DAY = 24 * 60 * 60 * 1000;

describe("GET /auth/callback", () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset();
    exchangeCodeForSession.mockResolvedValue(accountAged(DAY));
  });

  it("sends a protocol-relative next to /home, not off-site", async () => {
    const res = await callback("next=//evil.com");
    expect(res.headers.get("location")).toBe("https://klyvi.net/home");
  });

  it("follows a next that stays in the app", async () => {
    const res = await callback("next=/onboarding");
    expect(res.headers.get("location")).toBe("https://klyvi.net/onboarding");
  });

  it("lands an existing account on /home", async () => {
    const res = await callback("code=abc");
    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc");
    expect(res.headers.get("location")).toBe("https://klyvi.net/home");
  });

  it("lands an account created by this sign-in on onboarding", async () => {
    exchangeCodeForSession.mockResolvedValue(accountAged(3000));
    const res = await callback("code=abc");
    expect(res.headers.get("location")).toBe("https://klyvi.net/onboarding");
  });

  it("keeps a deep link for a brand new account", async () => {
    exchangeCodeForSession.mockResolvedValue(accountAged(3000));
    const res = await callback("code=abc&next=/tv/95396");
    expect(res.headers.get("location")).toBe("https://klyvi.net/tv/95396");
  });

  it("sends a failed exchange to the link explanation", async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: { user: null },
      error: { message: "expired" },
    });
    const res = await callback("code=abc");
    expect(res.headers.get("location")).toBe(
      "https://klyvi.net/signin?error=link"
    );
  });

  it("treats an expired email link as a link failure", async () => {
    const res = await callback(
      "next=/onboarding&error=access_denied&error_code=otp_expired"
    );
    expect(res.headers.get("location")).toBe(
      "https://klyvi.net/signin?error=link"
    );
  });

  it("sends a provider error to the provider explanation", async () => {
    const res = await callback(
      "error=server_error&error_description=Unverified+email"
    );
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(res.headers.get("location")).toBe(
      "https://klyvi.net/signin?error=provider"
    );
  });
});
