import { ExternalLink } from "lucide-react";

import type { Fact } from "@/lib/media-facts";
import { cn } from "@/lib/utils";

/**
 * The label-above-value metadata rail from the AniList reference: no borders,
 * no table. A row with no value and no links drops out entirely rather than
 * rendering a dash.
 */
function MetadataList({
  items,
  className,
}: {
  items: Fact[];
  className?: string;
}) {
  const present = items.filter(
    (i) => (i.value != null && i.value !== "") || (i.links?.length ?? 0) > 0
  );
  if (present.length === 0) return null;

  return (
    <dl className={cn("flex flex-col gap-3", className)}>
      {present.map((i) => (
        <div key={i.label}>
          <dt className="text-xs text-muted-foreground">{i.label}</dt>
          {i.links && i.links.length > 0 ? (
            <dd className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {i.links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hit-44 relative inline-flex items-center gap-1 rounded-sm text-foreground underline decoration-foreground/30 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {l.label}
                  <ExternalLink aria-hidden="true" className="size-3 text-muted-foreground" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ))}
            </dd>
          ) : (
            <dd
              className={cn(
                "mt-0.5 text-sm text-foreground",
                typeof i.value === "number" && "font-mono"
              )}
              data-numeric={typeof i.value === "number" || undefined}
            >
              {i.value}
            </dd>
          )}
        </div>
      ))}
    </dl>
  );
}

export { MetadataList };
