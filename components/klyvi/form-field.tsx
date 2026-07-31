import * as React from "react";

import { Label } from "@/components/ui/label";

/** What the field hands back so the control is wired correctly. */
export type FieldProps = {
  id: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
};

/**
 * Label, control, and a single message slot underneath: the field's hint
 * normally, its error once it has one.
 *
 * The control is a render prop rather than a plain child because some
 * fields wrap their input (the password field holds a show/hide button
 * beside it). Cloning the child would then stamp the id and aria onto a
 * wrapper div, silently detaching the label and the error from the input
 * that owns them. Handing the props out makes that impossible to get wrong.
 *
 * Error replaces hint rather than stacking, so the field never grows and
 * shoves the rest of the form down as the user tabs through it.
 */
export function FormField({
  id,
  label,
  hint,
  error,
  action,
  children,
}: {
  id: string;
  label: string;
  /** Shown when there is no error. */
  hint?: React.ReactNode;
  error?: string | null;
  /** Rendered opposite the label, e.g. a "Forgot password?" link. */
  action?: React.ReactNode;
  children: (field: FieldProps) => React.ReactNode;
}) {
  const messageId = `${id}-message`;
  const hasMessage = Boolean(error) || hint != null;

  return (
    <div className="flex flex-col gap-1.5">
      {action ? (
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor={id}>{label}</Label>
          {action}
        </div>
      ) : (
        <Label htmlFor={id}>{label}</Label>
      )}

      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": hasMessage ? messageId : undefined,
      })}

      {error ? (
        <p id={messageId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : hint != null ? (
        <p id={messageId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
