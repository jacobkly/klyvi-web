import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AccountSection } from "./account-section";

const updateUser = vi.fn();
const signInWithPassword = vi.fn();
vi.mock("@/lib/supabase/browser", () => ({
  getBrowserSupabase: () => ({ auth: { updateUser, signInWithPassword } }),
}));

const passwordUser = {
  email: "jacob@example.com",
  app_metadata: { provider: "email", providers: ["email"] },
};
let sessionUser: object = passwordUser;
vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => ({ user: sessionUser, signOut: vi.fn() }),
}));

/** Fills the three password fields, current first. */
async function fillPasswords(
  user: ReturnType<typeof userEvent.setup>,
  current = "oldpassword1",
  next = "longenough1",
  confirm = next
) {
  if (current) await user.type(screen.getByLabelText("Current password"), current);
  await user.type(screen.getByLabelText("New password"), next);
  await user.type(screen.getByLabelText("Retype new password"), confirm);
}

describe("AccountSection password change", () => {
  beforeEach(() => {
    updateUser.mockReset();
    signInWithPassword.mockReset();
    signInWithPassword.mockResolvedValue({ error: null });
    sessionUser = passwordUser;
  });

  it("checks the current password before changing it", async () => {
    updateUser.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<AccountSection />);

    await fillPasswords(user);
    await user.click(screen.getByRole("button", { name: "Change password" }));

    await waitFor(() => expect(updateUser).toHaveBeenCalled());
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "jacob@example.com",
      password: "oldpassword1",
    });
    expect(screen.getByLabelText("Current password")).toHaveValue("");
  });

  it("stops at a wrong current password", async () => {
    signInWithPassword.mockResolvedValue({
      error: { code: "invalid_credentials", message: "Invalid login credentials" },
    });
    const user = userEvent.setup();
    render(<AccountSection />);

    await fillPasswords(user, "notmypassword");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(
      await screen.findByText("That's not your current password")
    ).toBeInTheDocument();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("asks for the current password when it's blank", async () => {
    const user = userEvent.setup();
    render(<AccountSection />);

    await fillPasswords(user, "");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(
      await screen.findByText("Enter your current password")
    ).toBeInTheDocument();
    expect(signInWithPassword).not.toHaveBeenCalled();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("hides the form for an account that signs in with Google only", () => {
    sessionUser = {
      email: "jacob@example.com",
      app_metadata: { provider: "google", providers: ["google"] },
    };
    render(<AccountSection />);
    expect(screen.queryByLabelText("Current password")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Change password" })
    ).not.toBeInTheDocument();
  });

  it("changes the password and clears the fields", async () => {
    updateUser.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<AccountSection />);

    await user.type(screen.getByLabelText("Current password"), "oldpassword1");
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

    await user.type(screen.getByLabelText("Current password"), "oldpassword1");
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

    await user.type(screen.getByLabelText("Current password"), "oldpassword1");
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

  it("tells someone with an old session to sign in again", async () => {
    updateUser.mockResolvedValue({
      error: {
        code: "reauthentication_needed",
        message: "Password update requires reauthentication",
      },
    });
    const user = userEvent.setup();
    render(<AccountSection />);

    await user.type(screen.getByLabelText("Current password"), "oldpassword1");
    await user.type(screen.getByLabelText("New password"), "longenough1");
    await user.type(
      screen.getByLabelText("Retype new password"),
      "longenough1"
    );
    await user.click(
      screen.getByRole("button", { name: "Change password" })
    );

    expect(
      await screen.findByText(
        "For your security, sign out and sign back in, then change your password."
      )
    ).toBeInTheDocument();
  });
});
