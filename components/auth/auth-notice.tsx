"use client";

import { useSearchParams } from "next/navigation";

const NOTICES = new Map([
  [
    "link",
    "That link has expired or was already used. If it was a sign-up link, your email may be confirmed anyway, so try signing in.",
  ],
  [
    "provider",
    "That sign-in did not finish. If this email already has a Klyvi account, sign in with your password instead.",
  ],
]);

/**
 * Explains why the auth routes sent someone back to sign-in. Reading the
 * query needs a Suspense boundary on a prerendered page, so the form renders
 * this inside one.
 */
export function AuthNotice() {
  const message = NOTICES.get(useSearchParams().get("error") ?? "");
  if (!message) return null;
  return (
    <p role="alert" className="mt-5 text-sm text-destructive">
      {message}
    </p>
  );
}
