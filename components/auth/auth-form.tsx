"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Eye, EyeOff, MailCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getBrowserSupabase } from "@/lib/supabase/browser";

/**
 * OAuth is configured off for now; the buttons stay visible so the option
 * reads as coming, not missing. Flip a provider on here once it is enabled
 * in the Supabase project.
 */
const PROVIDERS: { name: string; enabled: boolean }[] = [
  { name: "Google", enabled: false },
  { name: "Microsoft", enabled: false },
  { name: "Apple", enabled: false },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Error strings per 06-copy.md. The collision is deliberate: an already
 *  registered email returns the SAME string as a failed sign-in, so the form
 *  never confirms to a stranger that an address has an account. */
const COPY = {
  noMatch: "That email and password do not match.",
  unverified: "Check your email to confirm your account first.",
  rateLimited: "Too many attempts. Wait a minute and try again.",
  network: "No connection. Check your network and try again.",
  server: "Sign-in is not responding. Something went wrong on Klyvi's end.",
  weakPassword: "Passwords need at least 8 characters.",
  badEmail: "That does not look like an email address.",
  notConfigured: "Sign-in is not available right now.",
};

type FormError = {
  message: string;
  /** Optional follow-up action rendered after the message. */
  action?: "signin" | "resend";
};

/**
 * Shared sign-in / sign-up form. Providers first (the path people expect),
 * then email. Email is controlled so it survives a failed attempt; the
 * password intentionally does not.
 */
export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const signin = mode === "signin";

  const [email, setEmail] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<FormError | null>(null);
  /** Set after a signup that needs email confirmation. */
  const [confirmSent, setConfirmSent] = React.useState(false);
  const [resent, setResent] = React.useState(false);

  function nextPath(): string {
    const n = new URLSearchParams(window.location.search).get("next");
    // Only ever redirect within the app.
    return n && n.startsWith("/") ? n : "/home";
  }

  async function resendConfirmation() {
    const sb = getBrowserSupabase();
    if (!sb || !email) return;
    await sb.auth.resend({ type: "signup", email });
    setResent(true);
  }

  async function submitEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const password =
      (form.elements.namedItem("auth-password") as HTMLInputElement)?.value ??
      "";

    if (!EMAIL_RE.test(email.trim())) {
      setError({ message: COPY.badEmail });
      return;
    }
    if (!signin && password.length < 8) {
      setError({ message: COPY.weakPassword });
      return;
    }

    const sb = getBrowserSupabase();
    if (!sb) {
      setError({ message: COPY.notConfigured });
      return;
    }

    setPending(true);
    try {
      if (signin) {
        const { error: err } = await sb.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) {
          setError(mapAuthError(err.status, err.message));
          return;
        }
        router.push(nextPath());
        router.refresh();
      } else {
        const { data, error: err } = await sb.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
          },
        });
        if (err) {
          setError(mapAuthError(err.status, err.message));
          return;
        }
        // Confirmations on: an already registered email comes back as a
        // fake success with zero identities. Same string as a failed
        // sign-in, on purpose.
        if (data.user && data.user.identities?.length === 0) {
          setError({ message: COPY.noMatch, action: "signin" });
          return;
        }
        if (data.session) {
          // Confirmations off (not the current config, but handle it).
          router.push("/onboarding");
          router.refresh();
          return;
        }
        setConfirmSent(true);
      }
    } catch {
      setError({ message: COPY.network });
    } finally {
      setPending(false);
    }
  }

  function mapAuthError(status: number | undefined, message: string): FormError {
    if (/email not confirmed/i.test(message)) {
      return { message: COPY.unverified, action: "resend" };
    }
    if (status === 429) return { message: COPY.rateLimited };
    if (status != null && status >= 500) return { message: COPY.server };
    if (/password should be at least/i.test(message)) {
      return { message: COPY.weakPassword };
    }
    if (/invalid login credentials/i.test(message) || status === 400) {
      return { message: COPY.noMatch };
    }
    return { message: COPY.server };
  }

  // ---------- post-signup: confirmation sent ----------
  if (confirmSent) {
    return (
      <div>
        <MailCheck
          aria-hidden="true"
          className="size-8 text-violet-text"
          strokeWidth={2}
        />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Check your email
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A confirmation link is on its way to{" "}
          <span className="text-foreground">{email}</span>. Open it and your
          account is ready.
        </p>
        <p className="mt-6 text-sm text-muted-foreground">
          Nothing arriving?{" "}
          {resent ? (
            <span>Sent again. Give it a minute.</span>
          ) : (
            <button
              type="button"
              onClick={() => void resendConfirmation()}
              className="tap-target text-violet-text hover:underline"
            >
              Resend it
            </button>
          )}
        </p>
        <p className="mt-10 text-sm text-muted-foreground">
          Wrong address?{" "}
          <button
            type="button"
            onClick={() => {
              setConfirmSent(false);
              setResent(false);
            }}
            className="tap-target text-violet-text hover:underline"
          >
            Start over
          </button>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        {signin ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {signin ? "Sign in to your account" : "Free, and it stays free"}
      </p>

      <div className="mt-7 flex flex-col gap-2.5">
        {PROVIDERS.map(({ name, enabled }) => (
          <Button
            key={name}
            variant="outline"
            size="touch"
            className="relative w-full"
            disabled={!enabled}
          >
            Continue with {name}
            {!enabled ? (
              <Badge
                variant="secondary"
                className="absolute right-3 text-[10px]"
              >
                Coming soon
              </Badge>
            ) : null}
          </Button>
        ))}
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" aria-hidden="true" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" aria-hidden="true" />
      </div>

      <form onSubmit={submitEmail} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="auth-email">Email</Label>
          <Input
            id="auth-email"
            name="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="auth-password">Password</Label>
            {signin ? (
              <Link
                href="/reset-password"
                className="tap-target inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
              >
                Forgot password?
              </Link>
            ) : null}
          </div>
          <div className="relative">
            <Input
              id="auth-password"
              name="auth-password"
              type={showPassword ? "text" : "password"}
              autoComplete={signin ? "current-password" : "new-password"}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="hit-44 absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" className="size-4" strokeWidth={2} />
              ) : (
                <Eye aria-hidden="true" className="size-4" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error.message}{" "}
            {error.action === "signin" ? (
              <Link href="/signin" className="underline underline-offset-2">
                Sign in instead
              </Link>
            ) : error.action === "resend" ? (
              resent ? (
                <span className="text-muted-foreground">Sent.</span>
              ) : (
                <button
                  type="button"
                  onClick={() => void resendConfirmation()}
                  className="underline underline-offset-2"
                >
                  Resend
                </button>
              )
            ) : null}
          </p>
        ) : null}

        <Button type="submit" size="touch" className="w-full" disabled={pending}>
          {pending
            ? signin
              ? "Signing in"
              : "Creating account"
            : signin
              ? "Sign in"
              : "Create account"}
        </Button>
      </form>

      <p className="mt-5 text-sm text-muted-foreground">
        {signin ? (
          <>
            New here?{" "}
            <Link href="/signup" className="text-violet-text hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/signin" className="text-violet-text hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>

      <p className="mt-10 text-xs text-muted-foreground">
        By continuing you agree to the{" "}
        <Link href="/terms" className="underline underline-offset-2">
          Terms of use
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-2">
          Privacy policy
        </Link>
        .
      </p>
    </div>
  );
}
