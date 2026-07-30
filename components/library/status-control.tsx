"use client";

import { ChevronDown, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
 * when not. The caller owns the optimistic update and its rollback toast.
 */
function StatusControl({
  status,
  onChange,
  size = "default",
  className,
}: {
  status: TrackingStatus | null;
  onChange: (next: TrackingStatus) => void;
  size?: "default" | "sm" | "touch";
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
      <DropdownMenuContent align="start" className="min-w-44">
        {ORDER.map((s) => (
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
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { StatusControl };
