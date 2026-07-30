import type { Reason } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The signature element: the "because you liked X" tokens on recommendations.
 *
 * Renders the API's {kind, id, name} explainability payload. Reasons without a
 * name are skipped entirely (the catalog does not carry a label for that id),
 * and when nothing survives, the component renders null rather than a
 * placeholder: a Tier 0 cold-start pick has no reasons and "because you liked
 * undefined" is worse than silence. The screen decides what honest line, if
 * any, replaces the row (06-copy.md, Find Next).
 */
function ReasonChips({
  reasons,
  max = 3,
  className,
}: {
  reasons: Reason[];
  max?: number;
  className?: string;
}) {
  const named = reasons.filter(
    (r): r is Reason & { name: string } => Boolean(r.name)
  );
  if (named.length === 0) return null;

  const shown = named.slice(0, max);
  const hidden = named.length - shown.length;

  return (
    <ul
      aria-label="Why this was picked"
      className={cn("flex flex-wrap items-center gap-1.5", className)}
    >
      {shown.map((r) => (
        <li
          key={`${r.kind}-${r.id}`}
          className="inline-flex h-5 items-center rounded-full bg-muted px-2 text-xs font-medium text-violet-text"
        >
          {r.name}
        </li>
      ))}
      {hidden > 0 ? (
        <li
          aria-label={`${hidden} more reasons`}
          className="inline-flex h-5 items-center rounded-full bg-muted px-2 text-xs font-medium text-muted-foreground"
        >
          +{hidden}
        </li>
      ) : null}
    </ul>
  );
}

export { ReasonChips };
