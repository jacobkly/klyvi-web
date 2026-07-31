"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Eye, EyeOff, MailCheck } from "lucide-react";

import {
  AppleMark,
  GoogleMark,
  MicrosoftMark,
} from "@/components/auth/provider-logos";
import { FormField } from "@/components/klyvi/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { USERNAME_MAX, USERNAME_MIN, validateUsername } from "@/lib/username";
import {
  availabilityMessage,
  useUsernameAvailability,
} from "@/lib/use-username-availability";
import {
  validateEmail,
  validateOnBlur,
  validatePassword,
  validatePasswordConfirm,
} from "@/lib/validation";

/**
 * OAuth is configured off for now; the buttons stay visible with their real
 * brand marks so the option reads as coming, not missing. Flip `enabled`
 * once the provider is turned on in the Supabase project.
 */
const PROVIDERS: {
  name: string;
  enabled: boolean;
  Mark: (p: { className?: string }) => React.ReactElement;
}[] = [
  { name: "Google", enabled: false, Mark: GoogleMark },
  { name: "Microsoft", enabled: false, Mark: MicrosoftMark },
  { name: "Apple", enabled: false, Mark: AppleMark },
];

/** Form-level copy per 06-copy.md. The collision is deliberate: an already
 *  registered email returns the SAME string as a failed sign-in, so the form
 *  never confirms to a stranger that an address has an account. */
const COPY = {
  noMatch: "That email and password do not match.",
  unverified: "Check your email to confirm your account first.",
  rateLimited: "Too many attempts. Wait a minute and try again.",
  network: "No connection. Check your network and try again.",
  server: "Sign-in is not responding. Something went wrong on Klyvi's end.",
  notConfigured: "Sign-in is not available right now.",
};

type FormError = {
  message: string;
  /** Optional follow-up action rendered after the message. */
  action?: "signin" | "resend";
};

type FieldName = "username" | "email" | "password" | "confirm";
type FieldErrors = Partial<Record<FieldName, string>>;

/**
 * Shared sign-in / sign-up form. Providers first (the path people expect),
 * then email. Sign-up collects a username, which rides along in the
 * Supabase user metadata and is claimed against the Klyvi API on first
 * sign-in (see auth-provider).
 *
 * Fields validate on blur and re-validate on change once they carry an
 * error, so a mistake surfaces next to the field that caused it and clears
 * the moment it is fixed. The submit button stays enabled throughout: a
 * disabled button cannot explain what is wrong, and "every field filled" is
 * not the same as "every field valid" anyway.
 */
export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const signin = mode === "signin";

  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [showPassword, setShowPassword] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<FormError | null>(null);
  /** Set after a signup that needs email confirmation. */
  const [confirmSent, setConfirmSent] = React.useState(false);
  const [resent, setResent] = React.useState(false);

  // Live availability, sign-up only. The claim itself happens after email
  // confirmation, so this is the only chance to warn before the name is
  // gone; the unique index is still what actually decides.
  const availability = useUsernameAvailability(signin ? "" : username);
  const availabilityNote = availabilityMessage(availability, username);

  /** Every field's rule in one place, so blur and submit cannot disagree. */
  const rules: Record<FieldName, (v: string) => string | null> =
    React.useMemo(
      () => ({
        username: validateUsername,
        email: validateEmail,
        password: validatePassword,
        confirm: (v) => validatePasswordConfirm(password, v),
      }),
      [password]
    );

  function setFieldError(name: FieldName, message: string | null) {
    setFieldErrors((prev) => {
      if (!message) {
        if (!(name in prev)) return prev;
        const next = { ...prev };
        delete next[name];
        return next;
      }
      if (prev[name] === message) return prev;
      return { ...prev, [name]: message };
    });
  }

  /** Re-check a field the user has already been told about, so the error
   *  disappears as soon as the value is good rather than on the next blur. */
  function revalidate(name: FieldName, value: string) {
    if (fieldErrors[name]) setFieldError(name, rules[name](value));
  }

  function handleBlur(name: FieldName, value: string) {
    setFieldError(name, validateOnBlur(value, rules[name]));
  }

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

    // Empty fields are only a problem here, which is why blur stays quiet
    // about them. Collect every failure at once rather than stopping at the
    // first, so the form does not reveal its problems one at a time.
    const checks: FieldName[] = signin
      ? ["email", "password"]
      : ["username", "email", "password", "confirm"];
    const values: Record<FieldName, string> = {
      username,
      email,
      password,
      confirm,
    };
    const found: FieldErrors = {};
    for (const name of checks) {
      const message = rules[name](values[name]);
      if (message) found[name] = message;
    }
    if (Object.keys(found).length > 0) {
      setFieldErrors(found);
      return;
    }
    setFieldErrors({});

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
          // The credentials were rejected, so the password is worth
          // retyping. The email is not.
          setPassword("");
          return;
        }
        router.push(nextPath());
        router.refresh();
      } else {
        const { data, error: err } = await sb.auth.signUp({
          email: email.trim(),
          password,
          options: {
            // Claimed against the Klyvi API on first sign-in. There is no
            // availability endpoint to check it against here, and no session
            // yet to check with, so the claim happens once one exists.
            data: { username: username.trim() },
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
        {PROVIDERS.map(({ name, enabled, Mark }) => (
          <Button
            key={name}
            variant="outline"
            size="touch"
            className="relative w-full gap-2.5"
            disabled={!enabled}
          >
            <Mark className="size-[18px]" />
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
        {!signin ? (
          <FormField
            id="auth-username"
            label="Username"
            error={
              fieldErrors.username ??
              (availabilityNote?.tone === "error"
                ? availabilityNote.text
                : undefined)
            }
            hint={
              availabilityNote?.tone === "hint"
                ? availabilityNote.text
                : `${USERNAME_MIN} to ${USERNAME_MAX} characters. Letters, numbers, underscores, and hyphens.`
            }
          >
            {(field) => (
              <Input
                {...field}
                name="auth-username"
                autoComplete="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  revalidate("username", e.target.value);
                }}
                onBlur={(e) => handleBlur("username", e.target.value)}
              />
            )}
          </FormField>
        ) : null}

        <FormField id="auth-email" label="Email" error={fieldErrors.email}>
          {(field) => (
            <Input
              {...field}
              name="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                revalidate("email", e.target.value);
              }}
              onBlur={(e) => handleBlur("email", e.target.value)}
            />
          )}
        </FormField>

        <FormField
          id="auth-password"
          label="Password"
          error={fieldErrors.password}
          hint={signin ? undefined : "At least 8 characters."}
          action={
            signin ? (
              <Link
                href="/reset-password"
                className="tap-target inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
              >
                Forgot password?
              </Link>
            ) : undefined
          }
        >
          {(field) => (
            <div className="relative">
              <Input
                {...field}
                name="auth-password"
                type={showPassword ? "text" : "password"}
                autoComplete={signin ? "current-password" : "new-password"}
                className="pr-10"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  revalidate("password", e.target.value);
                }}
                onBlur={(e) => handleBlur("password", e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="hit-44 absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                {showPassword ? (
                  <EyeOff
                    aria-hidden="true"
                    className="size-4"
                    strokeWidth={2}
                  />
                ) : (
                  <Eye aria-hidden="true" className="size-4" strokeWidth={2} />
                )}
              </button>
            </div>
          )}
        </FormField>

        {!signin ? (
          <FormField
            id="auth-confirm"
            label="Confirm password"
            error={fieldErrors.confirm}
          >
            {(field) => (
              <Input
                {...field}
                name="auth-confirm"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  revalidate("confirm", e.target.value);
                }}
                onBlur={(e) => handleBlur("confirm", e.target.value)}
              />
            )}
          </FormField>
        ) : null}

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
