import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { UserMenu } from "./user-menu";

vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => ({
    user: { email: "a@b.com" },
    profile: null,
    loading: false,
    signOut: vi.fn(),
  }),
}));

describe("UserMenu", () => {
  it("has no Donate item", async () => {
    const user = userEvent.setup();
    render(<UserMenu />);
    await user.click(screen.getByRole("button", { name: "Your account" }));
    expect(
      await screen.findByRole("menuitem", { name: "Settings" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Donate" })).toBeNull();
  });
});
