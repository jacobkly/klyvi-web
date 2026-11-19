"use client";

import * as React from "react";
import { toast } from "sonner";

import { useSession } from "@/components/auth/auth-provider";
import { FormField } from "@/components/klyvi/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import {
  validateOnBlur,
  passwordReauthProblem,
  validatePassword,
  validatePasswordConfirm,
} from "@/lib/validation";

import { FieldStack, SectionHeading, SettingRow } from "./section";

/**
 * Supabase refusals arrive as prose meant for developers. Map the known
 * ones to Klyvi's voice and fall back to one honest generic line.
 */
function passwordChangeError(message: string): string {
  if (/different from the old password/i.test(message))
    return "The new password has to be different from your current one.";
  if (/security purposes|rate limit/i.test(message))
    return "Too many tries for now. Wait a minute, then try again.";
  if (/weak|easy to guess|pwned/i.test(message))
    return "That password is too easy to guess. Try a longer one.";
  return "Could not change the password. Try again.";
}

/**
 * Whether the account has a password at all. One made with Google or
 * Microsoft only has none to change. Without provider info (mock mode),
 * assume it does.
 */
function hasPasswordSignIn(user: {
  app_metadata?: { provider?: string; providers?: string[] };
} | null): boolean {
  const meta = user?.app_metadata;
  if (Array.isArray(meta?.providers)) return meta.providers.includes("email");
  return meta?.provider == null || meta.provider === "email";
}

/** Who holds the email for an account with no password: Google or
 *  Microsoft. Null for a password account, whose email is its own. */
function emailProvider(user: {
  app_metadata?: { provider?: string; providers?: string[] };
} | null): string | null {
  if (hasPasswordSignIn(user)) return null;
  const meta = user?.app_metadata;
  const ids = meta?.providers ?? (meta?.provider ? [meta.provider] : []);
  if (ids.includes("google")) return "Google";
  if (ids.includes("azure")) return "Microsoft";
  return null;
}

/**
 * Email, password and sign-out. The export lives in Import and export, so
 * this only points there (`onOpenData` switches the pane).
 */
export function AccountSection({ onOpenData }: { onOpenData?: () => void }) {
  const { user, signOut } = useSession();
  const [current, setCurrent] = React.useState("");
  const [currentError, setCurrentError] = React.useState<string | null>(null);
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [passwordError, setPasswordError] = React.useState<string | null>(
    null
  );
  const [confirmError, setConfirmError] = React.useState<string | null>(null);
  const [changing, setChanging] = React.useState(false);
  const provider = emailProvider(user);

  /**
   * The current password is checked first, by signing in with it, so
   * someone at an unlocked browser can't take the account over. A right one
   * also refreshes the session, which Supabase's secure password change
   * wants to be recent.
   */
  async function changePassword() {
    const currentProblem = current === "" ? "Enter your current password" : null;
    const pwProblem = validatePassword(password);
    const confirmProblem = validatePasswordConfirm(password, confirm);
    setCurrentError(currentProblem);
    setPasswordError(pwProblem);
    setConfirmError(confirmProblem);
    if (currentProblem || pwProblem || confirmProblem) return;

    const sb = getBrowserSupabase();
    if (!sb || !user?.email) {
      toast("Could not reach the sign-in service.");
      return;
    }
    setChanging(true);
    try {
      const check = await sb.auth.signInWithPassword({
        email: user.email,
        password: current,
      });
      if (check.error) {
        setCurrentError(
          /rate limit|security purposes/i.test(check.error.message)
            ? "Too many tries for now. Wait a minute, then try again."
            : "That's not your current password"
        );
        return;
      }
      const { error } = await sb.auth.updateUser({ password });
      if (error) {
        setPasswordError(
          passwordReauthProblem(error) ?? passwordChangeError(error.message)
        );
        return;
      }
      setCurrent("");
      setPassword("");
      setConfirm("");
      toast("Password changed");
    } catch {
      toast("Could not change the password. Try again.");
    } finally {
      setChanging(false);
    }
  }

  return (
    <section>
      <SectionHeading>Account</SectionHeading>
      <FieldStack>
        <FormField
          id="st-email"
          label="Email"
          hint={
            provider
              ? `Managed through your ${provider} sign-in.`
              : "The address you sign in with."
          }
        >
          {(field) => (
            <Input {...field} type="email" disabled value={user?.email ?? ""} />
          )}
        </FormField>

        {hasPasswordSignIn(user) ? (
          <>
            <Separator />

            <div>
              <p className="text-sm font-medium text-foreground">
                Change password
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Takes effect immediately on every device.
              </p>
            </div>
            <FormField
              id="st-current-password"
              label="Current password"
              error={currentError ?? undefined}
            >
              {(field) => (
                <Input
                  {...field}
                  type="password"
                  autoComplete="current-password"
                  value={current}
                  onChange={(e) => {
                    setCurrent(e.target.value);
                    if (currentError) setCurrentError(null);
                  }}
                />
              )}
            </FormField>
            <FormField
              id="st-new-password"
              label="New password"
              error={passwordError ?? undefined}
            >
              {(field) => (
                <Input
                  {...field}
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError)
                      setPasswordError(validatePassword(e.target.value));
                  }}
                  onBlur={(e) =>
                    setPasswordError(
                      validateOnBlur(e.target.value, validatePassword)
                    )
                  }
                />
              )}
            </FormField>
            <FormField
              id="st-confirm-password"
              label="Retype new password"
              error={confirmError ?? undefined}
            >
              {(field) => (
                <Input
                  {...field}
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    if (confirmError)
                      setConfirmError(
                        validatePasswordConfirm(password, e.target.value)
                      );
                  }}
                  onBlur={(e) =>
                    setConfirmError(
                      validateOnBlur(e.target.value, (v) =>
                        validatePasswordConfirm(password, v)
                      )
                    )
                  }
                />
              )}
            </FormField>
            <div>
              <Button onClick={() => void changePassword()} disabled={changing}>
                {changing ? "Changing" : "Change password"}
              </Button>
            </div>
          </>
        ) : null}

        <Separator />

        <SettingRow
          title="Your data"
          description="Download your library or everything Klyvi holds, in Import and export."
        >
          <Button variant="outline" size="sm" onClick={onOpenData}>
            Go to Import and export
          </Button>
        </SettingRow>

        <SettingRow
          title="Sign out"
          description="Signs this device out. Your library stays put."
        >
          <Button variant="outline" size="sm" onClick={() => void signOut()}>
            Sign out
          </Button>
        </SettingRow>
      </FieldStack>
    </section>
  );
}
