import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({
  user: { email: "a@b.com" } as { email: string } | null,
}));
vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => ({ user: session.user, loading: false }),
}));

import { SiteFooter } from "./site-footer";

beforeEach(() => {
  session.user = { email: "a@b.com" };
});

describe("SiteFooter", () => {
  // #102: links that would only bounce a visitor to sign-in are left out.
  it("links a signed-out visitor only to pages they can open", () => {
    session.user = null;
    render(<SiteFooter />);
    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    for (const gated of ["/find", "/library", "/profile/stats", "/settings"]) {
      expect(hrefs).not.toContain(gated);
    }
    expect(hrefs).toEqual(
      expect.arrayContaining(["/explore", "/signup", "/signin", "/privacy"])
    );
  });

  it("has no Donate link", () => {
    render(<SiteFooter />);
    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(hrefs).toContain("/settings");
    expect(hrefs).not.toContain("/donate");
  });

  it("carries the TMDB notice in the API terms wording", () => {
    render(<SiteFooter />);
    expect(
      screen.getByText(
        "This website uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB."
      )
    ).toBeInTheDocument();
  });
});
