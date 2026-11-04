// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

const verifyOtp = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/server", () => ({
  getServerSupabase: async () => ({ auth: { verifyOtp } }),
}));

function confirm(query: string) {
  return GET(new Request(`https://klyvi.net/auth/confirm?${query}`));
}

describe("GET /auth/confirm", () => {
  beforeEach(() => {
    verifyOtp.mockReset();
    verifyOtp.mockResolvedValue({ error: null });
  });

  it("verifies a valid token and follows next", async () => {
    const res = await confirm("token_hash=abc&type=email&next=/onboarding");
    expect(verifyOtp).toHaveBeenCalledWith({
      type: "email",
      token_hash: "abc",
    });
    expect(res.headers.get("location")).toBe("https://klyvi.net/onboarding");
  });

  it.each(["email", "signup", "recovery", "email_change"])(
    "accepts the %s link type",
    async (type) => {
      const res = await confirm(`token_hash=abc&type=${type}&next=/settings`);
      expect(res.headers.get("location")).toBe("https://klyvi.net/settings");
    }
  );

  it("sends a rejected token to the sign-in explanation", async () => {
    verifyOtp.mockResolvedValue({ error: { message: "expired" } });
    const res = await confirm("token_hash=old&type=email&next=/onboarding");
    expect(res.headers.get("location")).toBe(
      "https://klyvi.net/signin?error=link"
    );
  });

  it("does not call Supabase without a token", async () => {
    const res = await confirm("type=email&next=/onboarding");
    expect(verifyOtp).not.toHaveBeenCalled();
    expect(res.headers.get("location")).toBe(
      "https://klyvi.net/signin?error=link"
    );
  });

  it("refuses a link type it does not send", async () => {
    const res = await confirm("token_hash=abc&type=invite&next=/home");
    expect(verifyOtp).not.toHaveBeenCalled();
    expect(res.headers.get("location")).toBe(
      "https://klyvi.net/signin?error=link"
    );
  });

  it("sends a protocol-relative next to /home, not off-site", async () => {
    const res = await confirm("token_hash=abc&type=email&next=//evil.com");
    expect(res.headers.get("location")).toBe("https://klyvi.net/home");
  });
});
