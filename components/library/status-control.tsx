"use client";

import { Check, ChevronDown, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STATUS_LABELS, type TrackingStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const ORDER: TrackingStatus[] = [
  "watching",
  "planning",
  "completed",
  "rewatching",
  "paused",
  "dropped",
];

/**
 * The split status button, the single most-used action in the product
 * (04-components.md tier 2). Violet when tracked, outlined "Add to library"
 * when not. A tracked title comes back out from the same menu. The caller
 * owns the optimistic update and its rollback toast.
 */
function StatusControl({
  status,
  onChange,
  onRemove,
  size = "default",
  options = ORDER,
  className,
}: {
  status: TrackingStatus | null;
  onChange: (next: TrackingStatus) => void;
  /** Offers "Remove from library" while the title is tracked. */
  onRemove?: () => void;
  size?: "default" | "sm" | "touch";
  /** The statuses on offer. An unreleased title offers only Planning. */
  options?: TrackingStatus[];
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant={status ? "default" : "outline"}
            size={size}
            className={cn("gap-1.5", className)}
          >
            {status ? (
              STATUS_LABELS[status]
            ) : (
              <>
                <Plus aria-hidden="true" data-icon="inline-start" />
                Add to library
              </>
            )}
            <ChevronDown aria-hidden="true" data-icon="inline-end" />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="min-w-52">
        {options.map((s) => (
          <DropdownMenuItem key={s} onClick={() => onChange(s)}>
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{
                backgroundColor: `var(--status-${s === "rewatching" ? "watching" : s})`,
              }}
              data-icon="inline-start"
            />
            {STATUS_LABELS[s]}
            {s === status ? <Check aria-hidden="true" className="ml-auto" /> : null}
          </DropdownMenuItem>
        ))}
        {status && onRemove ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onRemove}>
              <Trash2 aria-hidden="true" data-icon="inline-start" />
              Remove from library
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { StatusControl };
