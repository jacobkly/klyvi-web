// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { GET } from "./route";

// No code in these requests, so the exchange never runs.
vi.mock("@/lib/supabase/server", () => ({
  getServerSupabase: async () => null,
}));

function callback(query: string) {
  return GET(new Request(`https://klyvi.net/auth/callback?${query}`));
}

describe("GET /auth/callback", () => {
  it("sends a protocol-relative next to /home, not off-site", async () => {
    const res = await callback("next=//evil.com");
    expect(res.headers.get("location")).toBe("https://klyvi.net/home");
  });

  it("follows a next that stays in the app", async () => {
    const res = await callback("next=/onboarding");
    expect(res.headers.get("location")).toBe("https://klyvi.net/onboarding");
  });
});
