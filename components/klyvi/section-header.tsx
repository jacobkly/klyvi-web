import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * The overline section header used everywhere content is grouped: rails,
 * dashboard modules, detail-page sections. Enforces the rhythm from the
 * Letterboxd reference: small-caps muted label, hairline rule running to the
 * right edge, optional action link at the far end.
 */
function SectionHeader({
  title,
  action,
  className,
}: {
  title: string;
  action?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <h2 className="shrink-0 text-xs font-medium tracking-[0.12em] uppercase text-muted-foreground">
        {title}
      </h2>
      <div className="h-px flex-1 bg-border" aria-hidden="true" />
      {action ? (
        <Link
          href={action.href}
          className="shrink-0 rounded-full text-xs font-medium text-violet-text outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

export { SectionHeader };
