import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The one empty-state shape used across the app: centred icon in a muted
 * circle, one short bold line, one muted sentence, one action. Copy comes from
 * docs/planning/06-copy.md per screen, never improvised. "No items found" is a
 * failure.
 */
function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: { label: string; onClick?: () => void; href?: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center px-6 py-12 text-center",
        className
      )}
    >
      <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon aria-hidden="true" className="size-5" strokeWidth={2} />
      </div>
      <p className="text-[15px] font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-[36ch] text-sm text-muted-foreground">{body}</p>
      {action ? (
        <div className="mt-5">
          {action.href ? (
            <Button
              render={<Link href={action.href}>{action.label}</Link>}
            />
          ) : (
            <Button onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

export { EmptyState };
