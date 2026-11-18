import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthForm } from "./auth-form";

const push = vi.fn();
const refresh = vi.fn();
let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  useSearchParams: () => searchParams,
}));

const signInWithPassword = vi.fn();
const signInWithOAuth = vi.fn();
const signUp = vi.fn();
const resend = vi.fn();
vi.mock("@/lib/supabase/browser", () => ({
  getBrowserSupabase: () => ({
    auth: { signInWithPassword, signInWithOAuth, signUp, resend },
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

  /** Sign-up needs all four fields; confirm defaults to matching. */
  async function fillSignup(
    username: string,
    email: string,
    password: string,
    confirm = password
  ) {
    const user = userEvent.setup();
    if (username)
      await user.type(screen.getByLabelText("Username"), username);
    if (email) await user.type(screen.getByLabelText("Email"), email);
    if (password)
      await user.type(screen.getByLabelText("Password"), password);
    if (confirm)
      await user.type(screen.getByLabelText("Confirm password"), confirm);
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
    const user = await fillSignup("jacob", "a@b.com", "short");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(
      screen.getByText("Passwords need at least 8 characters.")
    ).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it("rejects a signup whose passwords do not match", async () => {
    render(<AuthForm mode="signup" />);
    const user = await fillSignup(
      "jacob",
      "a@b.com",
      "longenough",
      "longenoughX"
    );
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(
      screen.getByText("Those passwords do not match.")
    ).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it("rejects a too-short username and an illegal character", async () => {
    const { unmount } = render(<AuthForm mode="signup" />);
    let user = await fillSignup("ab", "a@b.com", "longenough");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(
      screen.getByText("Usernames need 3 to 40 characters.")
    ).toBeInTheDocument();
    unmount();

    render(<AuthForm mode="signup" />);
    user = await fillSignup("has space", "a@b.com", "longenough");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(
      screen.getByText(
        "Usernames can use letters, numbers, underscores, and hyphens."
      )
    ).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it("carries the chosen username into the signup metadata", async () => {
    signUp.mockResolvedValue({
      data: { user: { identities: [{ id: "x" }] }, session: null },
      error: null,
    });
    render(<AuthForm mode="signup" />);
    const user = await fillSignup("jacob_k", "new@b.com", "longenough");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          data: { username: "jacob_k" },
        }),
      })
    );
  });

  it("validates a field on blur and clears the error once it is fixed", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="signup" />);
    const usernameField = screen.getByLabelText("Username");

    await user.type(usernameField, "ab");
    await user.tab();
    expect(
      screen.getByText("Usernames need 3 to 40 characters.")
    ).toBeInTheDocument();

    // Fixing it clears the message immediately, without waiting for a
    // second blur.
    await user.type(usernameField, "cd");
    expect(
      screen.queryByText("Usernames need 3 to 40 characters.")
    ).toBeNull();
  });

  it("stays quiet on blurring an untouched empty field", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="signup" />);
    await user.click(screen.getByLabelText("Username"));
    await user.tab();
    expect(
      screen.queryByText("Usernames need 3 to 40 characters.")
    ).toBeNull();
  });

  it("reports every empty required field at once on submit", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="signup" />);
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(
      screen.getByText("Usernames need 3 to 40 characters.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("That does not look like an email address.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Passwords need at least 8 characters.")
    ).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it("keeps the submit button enabled while the form is incomplete", () => {
    render(<AuthForm mode="signup" />);
    expect(
      screen.getByRole("button", { name: "Create account" })
    ).toBeEnabled();
  });

  it("ties each error to its input for screen readers", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="signup" />);
    const email = screen.getByLabelText("Email");
    await user.type(email, "nope");
    await user.tab();
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAccessibleDescription(
      "That does not look like an email address."
    );
  });

  it("shows no username or confirm field on sign-in", () => {
    render(<AuthForm mode="signin" />);
    expect(screen.queryByLabelText("Username")).toBeNull();
    expect(screen.queryByLabelText("Confirm password")).toBeNull();
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
    const user = await fillSignup("taken_name", "taken@b.com", "longenough");
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
    const user = await fillSignup("newname", "new@b.com", "longenough");
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

  describe("providers", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
      window.history.pushState({}, "", "/");
    });

    it("hides provider sign-in until it is switched on", () => {
      render(<AuthForm mode="signin" />);
      expect(screen.queryByRole("button", { name: /Continue with/ })).toBeNull();
      expect(screen.queryByText("or")).toBeNull();
      expect(screen.queryByText("Coming soon")).toBeNull();
    });

    it("offers only the providers that are switched on, never Apple", () => {
      vi.stubEnv("NEXT_PUBLIC_AUTH_PROVIDERS", "google, apple");
      render(<AuthForm mode="signup" />);
      expect(
        screen.getByRole("button", { name: "Continue with Google" })
      ).toBeEnabled();
      expect(screen.queryByRole("button", { name: /Microsoft/ })).toBeNull();
      expect(screen.queryByRole("button", { name: /Apple/ })).toBeNull();
      expect(screen.getByText("or")).toBeInTheDocument();
    });

    it("starts Google with the callback and the page to return to", async () => {
      vi.stubEnv("NEXT_PUBLIC_AUTH_PROVIDERS", "google,azure");
      window.history.pushState({}, "", "/signin?next=/tv/95396");
      signInWithOAuth.mockResolvedValue({ error: null });
      const user = userEvent.setup();
      render(<AuthForm mode="signin" />);
      await user.click(
        screen.getByRole("button", { name: "Continue with Google" })
      );
      expect(signInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=%2Ftv%2F95396`,
        },
      });
    });

    it("asks Microsoft for the email scope", async () => {
      vi.stubEnv("NEXT_PUBLIC_AUTH_PROVIDERS", "google,azure");
      signInWithOAuth.mockResolvedValue({ error: null });
      const user = userEvent.setup();
      render(<AuthForm mode="signin" />);
      await user.click(
        screen.getByRole("button", { name: "Continue with Microsoft" })
      );
      expect(signInWithOAuth).toHaveBeenCalledWith({
        provider: "azure",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=%2Fhome`,
          scopes: "email",
        },
      });
    });

    it("says so when the provider cannot start", async () => {
      vi.stubEnv("NEXT_PUBLIC_AUTH_PROVIDERS", "google");
      signInWithOAuth.mockResolvedValue({
        error: { status: 500, message: "down" },
      });
      const user = userEvent.setup();
      render(<AuthForm mode="signin" />);
      const google = screen.getByRole("button", {
        name: "Continue with Google",
      });
      await user.click(google);
      expect(
        await screen.findByText(
          "Sign-in is not responding. Something went wrong on Klyvi's end."
        )
      ).toBeInTheDocument();
      expect(google).toBeEnabled();
    });
  });

  describe("after a failed link", () => {
    afterEach(() => {
      searchParams = new URLSearchParams();
    });

    it("explains an expired or used email link", () => {
      searchParams = new URLSearchParams("error=link");
      render(<AuthForm mode="signin" />);
      expect(screen.getByRole("alert")).toHaveTextContent(
        "That link has expired or was already used."
      );
    });

    it("explains a provider sign-in that did not finish", () => {
      searchParams = new URLSearchParams("error=provider");
      render(<AuthForm mode="signin" />);
      expect(screen.getByRole("alert")).toHaveTextContent(
        "That sign-in did not finish."
      );
    });

    it("ignores an error code it does not know", () => {
      searchParams = new URLSearchParams("error=constructor");
      render(<AuthForm mode="signin" />);
      expect(screen.queryByRole("alert")).toBeNull();
    });
  });

  // Google or Microsoft on the sign-in page can create an account too, so the
  // age line shows in both modes.
  it.each(["signup", "signin"] as const)(
    "has the %s consent line confirm the user is 16 or older",
    (mode) => {
      render(<AuthForm mode={mode} />);
      const line = screen.getByText(/16 or older/);
      expect(line.textContent).toMatch(
        /I'm 16 or older and agree to the Terms of use and Privacy policy/
      );
    }
  );
});
