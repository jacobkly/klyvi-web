"use client";

import * as React from "react";

import { useBrowseFilters } from "@/components/explore/browse-filters";
import { RankedRow } from "@/components/explore/ranked-row";
import { isWatched, useWatched } from "@/components/klyvi/watched-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getRankings,
  RANKING_MAX_PAGE,
  RANKING_PAGE_SIZE,
} from "@/lib/api/catalog";
import type { WatchedFilter } from "@/lib/local-prefs";
import type { Ranking } from "@/lib/types";
import { usePagedList } from "@/lib/use-paged-list";

function keyOf(r: Ranking): string {
  return String(r.tmdbId);
}

/**
 * A public top list, live from GET /v1/rankings/{kind}, ranked with or
 * without anime as the Filters say. `limit` caps the rows for Explore's
 * preview. Without it the list pages on as the end nears, 100 at a time and
 * 1,000 deep, and watched titles show, dim or hide as asked.
 */
export function RankingList({
  kind,
  limit,
}: {
  kind: "movies" | "tv";
  limit?: number;
}) {
  const { filters } = useBrowseFilters();
  return (
    <RankingPages
      // A different ranking, from its first page, when anime goes in or out.
      key={filters.anime ? "with-anime" : "without-anime"}
      kind={kind}
      limit={limit}
      anime={filters.anime}
      // The preview stays ten rows, so it only marks what is watched.
      watched={limit ? "show" : filters.watched}
    />
  );
}

function RankingPages({
  kind,
  limit,
  anime,
  watched,
}: {
  kind: "movies" | "tv";
  limit?: number;
  anime: boolean;
  watched: WatchedFilter;
}) {
  const fetchPage = React.useCallback(
    async (page: number, signal?: AbortSignal) => {
      const items = await getRankings(kind, signal, { anime, page });
      if (limit) return { items: items.slice(0, limit), last: true };
      return {
        items,
        last: items.length < RANKING_PAGE_SIZE || page >= RANKING_MAX_PAGE,
      };
    },
    [kind, limit, anime]
  );
  const { state, loadMore, retry, sentinelRef } = usePagedList({
    fetchPage,
    keyOf,
  });
  const watchedIds = useWatched();
  const media = kind === "movies" ? "movie" : "tv";

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
        <Button variant="outline" size="sm" className="mt-3" onClick={retry}>
          Try again
        </Button>
      </div>
    );
  }

  const { done, loadingMore } = state;
  const items =
    watched === "hide"
      ? state.items.filter((r) => !isWatched(watchedIds, media, r.tmdbId))
      : state.items;

  if (items.length === 0 && done) {
    return (
      <p className="rounded-lg bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
        {state.items.length > 0
          ? "You have seen every title on this list. Show watched titles in Filters to see them again."
          : "The ranking is empty right now. It refreshes daily."}
      </p>
    );
  }

  return (
    <>
      <ol
        className="flex flex-col gap-2"
        data-dim-watched={watched === "dim" ? "" : undefined}
      >
        {items.map((item) => (
          <RankedRow
            key={`${item.rank}-${item.tmdbId}`}
            item={item}
            kind={kind}
            deep={!limit}
          />
        ))}
        {loadingMore || (items.length === 0 && !done)
          ? Array.from({ length: 4 }).map((_, i) => (
              <li key={`more-${i}`}>
                <Skeleton className="h-[72px] rounded-lg" />
              </li>
            ))
          : null}
      </ol>

      {limit ? null : (
        <>
          <div ref={sentinelRef} aria-hidden="true" />
          <div className="mt-8 flex justify-center">
            {done ? (
              <p className="text-sm text-muted-foreground">
                That is the whole list.
              </p>
            ) : (
              <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                Load more
              </Button>
            )}
          </div>
        </>
      )}
    </>
  );
}
