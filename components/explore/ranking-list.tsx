"use client";

import * as React from "react";

import { RankedRow } from "@/components/explore/ranked-row";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getRankings } from "@/lib/api/catalog";
import type { Ranking } from "@/lib/types";

type State =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; items: Ranking[] };

/**
 * The public Top 100 list, live from GET /v1/rankings/{kind}. `limit` caps
 * the rows for the small explore preview; the full pages omit it.
 */
export function RankingList({
  kind,
  limit,
}: {
  kind: "movies" | "tv";
  limit?: number;
}) {
  const [state, setState] = React.useState<State>({ kind: "loading" });

  const load = React.useCallback(() => {
    setState({ kind: "loading" });
    const ac = new AbortController();
    getRankings(kind, ac.signal)
      .then((items) =>
        setState({
          kind: "ready",
          items: limit ? items.slice(0, limit) : items,
        })
      )
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setState({ kind: "error" });
      });
    return ac;
  }, [kind, limit]);

  React.useEffect(() => {
    const ac = load();
    return () => ac.abort();
  }, [load]);

  if (state.kind === "loading") {
    return (
      <ol className="flex flex-col gap-2">
        {Array.from({ length: limit ?? 10 }).map((_, i) => (
          <li key={i}>
            <Skeleton className="h-[72px] rounded-lg" />
          </li>
        ))}
      </ol>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="rounded-lg bg-card p-6 text-center ring-1 ring-foreground/10">
        <p className="text-sm text-muted-foreground">
          Could not load the ranking right now.
        </p>
        <Button variant="outline" size="sm" className="mt-3" onClick={load}>
          Try again
        </Button>
      </div>
    );
  }

  if (state.items.length === 0) {
    return (
      <p className="rounded-lg bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
        The ranking is empty right now. It refreshes daily.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {state.items.map((item) => (
        <RankedRow key={`${item.rank}-${item.tmdbId}`} item={item} kind={kind} />
      ))}
    </ol>
  );
}
