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

export function AccountSection() {
  const { user, signOut } = useSession();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [passwordError, setPasswordError] = React.useState<string | null>(
    null
  );
  const [confirmError, setConfirmError] = React.useState<string | null>(null);
  const [changing, setChanging] = React.useState(false);

  function changePassword() {
    const pwProblem = validatePassword(password);
    const confirmProblem = validatePasswordConfirm(password, confirm);
    setPasswordError(pwProblem);
    setConfirmError(confirmProblem);
    if (pwProblem || confirmProblem) return;

    const sb = getBrowserSupabase();
    if (!sb) {
      toast("Could not reach the sign-in service.");
      return;
    }
    setChanging(true);
    sb.auth
      .updateUser({ password })
      .then(({ error }: { error: { message: string } | null }) => {
        if (error) {
          setPasswordError(passwordChangeError(error.message));
          return;
        }
        setPassword("");
        setConfirm("");
        toast("Password changed");
      })
      .catch(() => toast("Could not change the password. Try again."))
      .finally(() => setChanging(false));
  }

  return (
    <section>
      <SectionHeading>Account</SectionHeading>
      <FieldStack>
        <FormField
          id="st-email"
          label="Email"
          hint="Managed through your sign-in provider."
        >
          {(field) => (
            <Input {...field} type="email" disabled value={user?.email ?? ""} />
          )}
        </FormField>

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
          <Button onClick={changePassword} disabled={changing}>
            {changing ? "Changing" : "Change password"}
          </Button>
        </div>

        <Separator />

        <SettingRow
          title="Download your data"
          description="One file with your account, library, ratings, and taste profile. Lands with a coming update."
        >
          <Button variant="outline" size="sm" disabled>
            Download
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
