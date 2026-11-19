"use client";

import * as React from "react";

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
  label = "Why this was picked",
  wrap = false,
  className,
}: {
  reasons: Reason[];
  max?: number;
  /** What the row is, for a screen reader. A pick's reasons by default. */
  label?: string;
  /** Let a long chip run onto a second line instead of cutting it off, for
   *  narrow columns such as a poster's width on a phone. */
  wrap?: boolean;
  className?: string;
}) {
  // "+N" opens the rest. A tap can't reach a tooltip, so it's a button.
  const [open, setOpen] = React.useState(false);
  const named = reasons.filter(
    (r): r is Reason & { name: string } => Boolean(r.name)
  );
  if (named.length === 0) return null;

  const shown = open ? named : named.slice(0, max);
  const hidden = named.length - shown.length;
  // Once opened, every chip is readable in full.
  const wraps = wrap || open;

  return (
    <ul
      aria-label={label}
      className={cn("flex flex-wrap items-center gap-1.5", className)}
    >
      {shown.map((r) => {
        const label = chipLabel(r);
        return (
          <li
            key={`${r.kind}-${r.id}`}
            title={r.kind === "because" ? label : undefined}
            className={cn(
              "inline-flex min-w-0 max-w-full items-center rounded-full bg-muted px-2 text-xs font-medium text-violet-text",
              wraps ? "min-h-5 py-0.5 leading-4" : "h-5"
            )}
          >
            <span className={wraps ? "break-words" : "truncate"}>{label}</span>
          </li>
        );
      })}
      {hidden > 0 ? (
        <li className="inline-flex">
          <button
            type="button"
            aria-expanded={false}
            aria-label={`Show ${hidden} more ${hidden === 1 ? "reason" : "reasons"}`}
            onClick={(e) => {
              // Chips often sit inside a card link. Opening them shouldn't
              // follow it.
              e.preventDefault();
              e.stopPropagation();
              setOpen(true);
            }}
            className="hit-44 relative inline-flex h-5 items-center rounded-full bg-muted px-2 text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            +{hidden}
          </button>
        </li>
      ) : null}
    </ul>
  );
}

/** A because reason names the title. A keyword reads as a tag, in title
 *  case. The others show their label as it is. */
function chipLabel(r: Reason & { name: string }): string {
  if (r.kind === "because") return `because you liked ${r.name}`;
  return r.kind === "keyword" ? titleCase(r.name) : r.name;
}

/** Joining words stay small unless they open the label. */
const SMALL = new Set([
  "a", "an", "and", "as", "at", "but", "by", "for", "in", "nor", "of", "on",
  "or", "the", "to", "vs",
]);

/** "based on novel or book" reads "Based on Novel or Book", and each part of
 *  a hyphenated word is capitalised ("Neo-Noir"). Digits are left alone. */
export function titleCase(s: string): string {
  return s
    .split(" ")
    .map((word, i) =>
      i > 0 && SMALL.has(word.toLowerCase())
        ? word.toLowerCase()
        : word.replace(/(^|-)(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase())
    )
    .join(" ");
}

export { ReasonChips };
