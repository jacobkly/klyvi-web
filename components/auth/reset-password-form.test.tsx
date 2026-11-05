import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ResetPasswordForm } from "./reset-password-form";

const updateUser = vi.fn();
vi.mock("@/lib/supabase/browser", () => ({
  getBrowserSupabase: () => ({ auth: { updateUser } }),
}));
vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => ({
    user: { email: "jacob@example.com" },
    loading: false,
  }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("ResetPasswordForm when signed in", () => {
  beforeEach(() => updateUser.mockReset());

  it("tells someone with an old session to sign in again", async () => {
    updateUser.mockResolvedValue({
      error: {
        code: "reauthentication_needed",
        message: "Password update requires reauthentication",
        status: 400,
      },
    });
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText("New password"), "longenough1");
    await user.click(screen.getByRole("button", { name: "Save password" }));

    expect(
      await screen.findByText(
        "For your security, sign out and sign back in, then change your password."
      )
    ).toBeInTheDocument();
  });
});
