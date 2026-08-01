import * as React from "react";

import { cn } from "@/lib/utils";

/** Section heading, one per settings pane. */
export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-xl font-semibold tracking-tight">{children}</h1>
  );
}

/** The standard field column: capped width, consistent rhythm. */
export function FieldStack({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mt-6 flex max-w-[440px] flex-col gap-5", className)}>
      {children}
    </div>
  );
}

/**
 * A settings row: title and description on the left, a control on the
 * right. The pattern the Lists toggle established; everything row-shaped
 * reuses it so the pane reads as one system.
 */
export function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </div>
  );
}

/**
 * The one honest line for anything that holds local state but does not
 * persist to the backend yet. One per surface, not one per control.
 */
export function SettingsNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-muted-foreground">
      {children ?? "Saved on this device. Syncing arrives with a coming update."}
    </p>
  );
}
