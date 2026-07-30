"use client";

import Link from "next/link";
import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PROVIDERS = ["Google", "Microsoft", "Apple"] as const;
const LAST_USED_KEY = "klyvi:last-provider";

/**
 * Shared sign-in / sign-up form. Providers first (the path we want people to
 * take), then email. The "Last used" badge remembers the returning user's
 * provider. Submission wires to Supabase when auth lands; until then the
 * error path renders the copy-doc strings.
 */
export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [lastUsed, setLastUsed] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLastUsed(window.localStorage.getItem(LAST_USED_KEY));
  }, []);

  function chooseProvider(name: string) {
    window.localStorage.setItem(LAST_USED_KEY, name);
    setLastUsed(name);
    // supabase.auth.signInWithOAuth lands here.
    setError(`${name} sign-in did not complete.`);
  }

  function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    // supabase.auth.signInWithPassword / signUp lands here. Until then the
    // form is honest that nothing is connected.
    setError("Sign-in is not connected yet. It arrives with the next update.");
  }

  const signin = mode === "signin";

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        {signin ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {signin ? "Sign in to your account" : "Free, and it stays free"}
      </p>

      <div className="mt-7 flex flex-col gap-2.5">
        {PROVIDERS.map((name) => (
          <Button
            key={name}
            variant="outline"
            size="touch"
            className="relative w-full"
            onClick={() => chooseProvider(name)}
          >
            Continue with {name}
            {lastUsed === name ? (
              <Badge
                variant="secondary"
                className="absolute right-3 text-[10px] text-violet-text"
              >
                Last used
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
          <Input id="auth-email" type="email" autoComplete="email" />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="auth-password">Password</Label>
            {signin ? (
              <Link
                href="/signin"
                className="tap-target inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
              >
                Forgot password?
              </Link>
            ) : null}
          </div>
          <div className="relative">
            <Input
              id="auth-password"
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
            {error}
          </p>
        ) : null}

        <Button type="submit" size="touch" className="w-full">
          {signin ? "Sign in" : "Create account"}
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
