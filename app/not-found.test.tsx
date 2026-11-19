import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/nowhere",
  useRouter: () => ({ push: vi.fn() }),
}));

const session = vi.hoisted(() => ({
  user: null as { email: string } | null,
}));
vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => ({
    user: session.user,
    profile: null,
    loading: false,
    signOut: vi.fn(),
  }),
}));

import NotFound, { metadata } from "./not-found";

beforeEach(() => {
  session.user = null;
});

describe("NotFound", () => {
  // #114: the tab said only "Klyvi".
  it("is titled Page not found", () => {
    expect(metadata.title).toBe("Page not found · Klyvi");
  });

  it("sits in the site shell, with the nav and footer", () => {
    render(<NotFound />);
    expect(
      screen.getAllByRole("navigation", { name: "Primary" }).length
    ).toBeGreaterThan(0);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("sends a signed-out visitor to the landing page", () => {
    render(<NotFound />);
    expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute(
      "href",
      "/"
    );
  });

  it("sends a signed-in user to their home", () => {
    session.user = { email: "a@b.com" };
    render(<NotFound />);
    expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute(
      "href",
      "/home"
    );
  });
});
