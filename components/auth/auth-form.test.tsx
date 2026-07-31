import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthForm } from "./auth-form";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

const signInWithPassword = vi.fn();
const signUp = vi.fn();
const resend = vi.fn();
vi.mock("@/lib/supabase/browser", () => ({
  getBrowserSupabase: () => ({
    auth: { signInWithPassword, signUp, resend },
  }),
}));

describe("AuthForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function fill(email: string, password: string) {
    const user = userEvent.setup();
    if (email) await user.type(screen.getByLabelText("Email"), email);
    if (password)
      await user.type(screen.getByLabelText("Password"), password);
    return user;
  }

  it("rejects a malformed email without calling Supabase", async () => {
    render(<AuthForm mode="signin" />);
    const user = await fill("not-an-email", "hunter22222");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(
      screen.getByText("That does not look like an email address.")
    ).toBeInTheDocument();
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("rejects a short signup password client-side", async () => {
    render(<AuthForm mode="signup" />);
    const user = await fill("a@b.com", "short");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(
      screen.getByText("Passwords need at least 8 characters.")
    ).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it("maps invalid credentials to the no-match copy and keeps the email", async () => {
    signInWithPassword.mockResolvedValue({
      error: { status: 400, message: "Invalid login credentials" },
    });
    render(<AuthForm mode="signin" />);
    const user = await fill("a@b.com", "wrongpassword");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(
      await screen.findByText("That email and password do not match.")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveValue("a@b.com");
  });

  it("shows the SAME no-match copy for an already registered signup email", async () => {
    signUp.mockResolvedValue({
      data: { user: { identities: [] }, session: null },
      error: null,
    });
    render(<AuthForm mode="signup" />);
    const user = await fill("taken@b.com", "longenough");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(
      await screen.findByText("That email and password do not match.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Sign in instead" })
    ).toBeInTheDocument();
  });

  it("shows the check-your-email state after a signup needing confirmation", async () => {
    signUp.mockResolvedValue({
      data: { user: { identities: [{ id: "x" }] }, session: null },
      error: null,
    });
    render(<AuthForm mode="signup" />);
    const user = await fill("new@b.com", "longenough");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(
      await screen.findByRole("heading", { name: "Check your email" })
    ).toBeInTheDocument();
    expect(screen.getByText("new@b.com")).toBeInTheDocument();
  });

  it("routes a successful sign-in to /home", async () => {
    signInWithPassword.mockResolvedValue({ error: null });
    render(<AuthForm mode="signin" />);
    const user = await fill("a@b.com", "rightpassword");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(push).toHaveBeenCalledWith("/home");
  });

  it("renders the disabled coming-soon providers", () => {
    render(<AuthForm mode="signin" />);
    const google = screen.getByRole("button", {
      name: /Continue with Google/,
    });
    expect(google).toBeDisabled();
    expect(screen.getAllByText("Coming soon")).toHaveLength(3);
  });
});
