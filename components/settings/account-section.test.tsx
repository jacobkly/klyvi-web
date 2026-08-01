import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AccountSection } from "./account-section";

const updateUser = vi.fn();
vi.mock("@/lib/supabase/browser", () => ({
  getBrowserSupabase: () => ({ auth: { updateUser } }),
}));
vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => ({
    user: { email: "jacob@example.com" },
    signOut: vi.fn(),
  }),
}));

describe("AccountSection password change", () => {
  beforeEach(() => updateUser.mockReset());

  it("changes the password and clears the fields", async () => {
    updateUser.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<AccountSection />);

    await user.type(screen.getByLabelText("New password"), "longenough1");
    await user.type(
      screen.getByLabelText("Retype new password"),
      "longenough1"
    );
    await user.click(
      screen.getByRole("button", { name: "Change password" })
    );

    await waitFor(() =>
      expect(updateUser).toHaveBeenCalledWith({ password: "longenough1" })
    );
    expect(screen.getByLabelText("New password")).toHaveValue("");
  });

  it("blocks mismatched passwords before calling supabase", async () => {
    const user = userEvent.setup();
    render(<AccountSection />);

    await user.type(screen.getByLabelText("New password"), "longenough1");
    await user.type(screen.getByLabelText("Retype new password"), "different1");
    await user.click(
      screen.getByRole("button", { name: "Change password" })
    );

    expect(
      await screen.findByText("Those passwords do not match.")
    ).toBeInTheDocument();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("surfaces a supabase refusal in honest words", async () => {
    updateUser.mockResolvedValue({
      error: {
        message:
          "New password should be different from the old password.",
      },
    });
    const user = userEvent.setup();
    render(<AccountSection />);

    await user.type(screen.getByLabelText("New password"), "longenough1");
    await user.type(
      screen.getByLabelText("Retype new password"),
      "longenough1"
    );
    await user.click(
      screen.getByRole("button", { name: "Change password" })
    );

    expect(
      await screen.findByText(/different from your current one/i)
    ).toBeInTheDocument();
  });
});
