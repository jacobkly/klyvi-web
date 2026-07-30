"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import type { CastMember } from "@/lib/mock-media";

/**
 * Cast as wrapped chips with a trailing "Show all", the Letterboxd pattern.
 * Dense and calm; keeps faces from competing with the poster art. Empty cast
 * gets the copy-doc line rather than an empty section.
 */
function CastChips({ cast, initial = 10 }: { cast: CastMember[]; initial?: number }) {
  const [expanded, setExpanded] = React.useState(false);

  if (cast.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Cast is not listed for this title.
      </p>
    );
  }

  const shown = expanded ? cast : cast.slice(0, initial);
  const hidden = cast.length - shown.length;

  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((c) => (
        <Badge key={c.id} variant="secondary">
          {c.name}
        </Badge>
      ))}
      {hidden > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="tap-target inline-flex h-5 items-center rounded-full bg-muted px-2 text-xs font-medium text-violet-text outline-none hover:bg-muted/70 focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          Show all ({cast.length})
        </button>
      ) : null}
    </div>
  );
}

export { CastChips };
