"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { KeyRound, MailCheck } from "lucide-react";

import { useSession } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getBrowserSupabase } from "@/lib/supabase/browser";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Both halves of the reset flow on one route:
 *
 * - Signed out: ask for the email, send the recovery link. The link routes
 *   through /auth/callback, which signs the user in and returns here.
 * - Signed in (which is what the recovery link produces): set the new
 *   password. A signed-in user visiting directly gets the same form, which
 *   is a legitimate way to change a password.
 *
 * The request form confirms sending WITHOUT confirming the account exists,
 * per the copy rule: same success screen either way.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const { user, loading } = useSession();

  const [email, setEmail] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError("That does not look like an email address.");
      return;
    }
    const sb = getBrowserSupabase();
    if (!sb) {
      setError("Password reset is not available right now.");
      return;
    }
    setPending(true);
    try {
      await sb.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      // Success either way: never reveal whether the address has an account.
      setSent(true);
    } catch {
      setError("No connection. Check your network and try again.");
    } finally {
      setPending(false);
    }
  }

  async function setNewPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const password =
      (form.elements.namedItem("new-password") as HTMLInputElement)?.value ??
      "";
    if (password.length < 8) {
      setError("Passwords need at least 8 characters.");
      return;
    }
    const sb = getBrowserSupabase();
    if (!sb) {
      setError("Password reset is not available right now.");
      return;
    }
    setPending(true);
    try {
      const { error: err } = await sb.auth.updateUser({ password });
      if (err) {
        setError(
          err.status === 429
            ? "Too many attempts. Wait a minute and try again."
            : "Could not update the password. Try again."
        );
        return;
      }
      router.push("/home");
      router.refresh();
    } catch {
      setError("No connection. Check your network and try again.");
    } finally {
      setPending(false);
    }
  }

  if (loading) return null;

  // ---------- signed in: set the new password ----------
  if (user) {
    return (
      <div>
        <KeyRound
          aria-hidden="true"
          className="size-8 text-violet-text"
          strokeWidth={2}
        />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Set a new password
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          For {user.email}
        </p>
        <form
          onSubmit={setNewPassword}
          className="mt-7 flex flex-col gap-4"
          noValidate
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              name="new-password"
              type="password"
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">
              At least 8 characters.
            </p>
          </div>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            size="touch"
            className="w-full"
            disabled={pending}
          >
            {pending ? "Saving" : "Save password"}
          </Button>
        </form>
      </div>
    );
  }

  // ---------- request sent ----------
  if (sent) {
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
          If an account exists for{" "}
          <span className="text-foreground">{email}</span>, a reset link is on
          its way.
        </p>
        <p className="mt-10 text-sm text-muted-foreground">
          <Link href="/signin" className="text-violet-text hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  // ---------- signed out: request the link ----------
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Reset your password
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your email and a reset link goes out.
      </p>
      <form
        onSubmit={requestReset}
        className="mt-7 flex flex-col gap-4"
        noValidate
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reset-email">Email</Label>
          <Input
            id="reset-email"
            name="reset-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="touch" className="w-full" disabled={pending}>
          {pending ? "Sending" : "Send reset link"}
        </Button>
      </form>
      <p className="mt-5 text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/signin" className="text-violet-text hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
