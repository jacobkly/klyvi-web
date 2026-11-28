"use client";

import * as React from "react";
import { SearchX } from "lucide-react";

import { useBrowseFilters } from "@/components/explore/browse-filters";
import { EmptyState } from "@/components/klyvi/empty-state";
import { PosterCard } from "@/components/klyvi/poster-card";
import { isWatched, useWatched } from "@/components/klyvi/watched-provider";
import { Button } from "@/components/ui/button";
import { PosterCardSkeleton } from "@/components/klyvi/skeletons";
import { getListPage } from "@/lib/api/catalog";
import type { BrowseCategory } from "@/lib/browse-categories";
import type { WatchedFilter } from "@/lib/local-prefs";
import type { MediaSummary } from "@/lib/types";
import { usePagedList } from "@/lib/use-paged-list";

function keyOf(m: MediaSummary): string {
  return `${m.mediaType}:${m.tmdbId}`;
}

/** Titles to a page of a TMDB list. */
const PAGE_SIZE = 20;

/** Pages fetched before anything shows, so the first screen is full. */
const FIRST_PAGES = 2;

/** TMDB serves no list past page 500, and the API clamps there. */
const LAST_PAGE = 500;

const GRID =
  "grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8";

/**
 * The grid behind a rail's View more, filtered by the page's Filters: the
 * list is fetched again when anime goes in or out, and watched titles show,
 * dim or hide as asked.
 */
export function BrowseClient({ category }: { category: BrowseCategory }) {
  const { filters } = useBrowseFilters();
  return (
    <BrowseList
      // A different list, from its first page, when anime goes in or out.
      key={filters.anime ? "with-anime" : "without-anime"}
      category={category}
      anime={filters.anime}
      watched={filters.watched}
    />
  );
}

/**
 * Two pages up front, then the next page each time the end nears, with a
 * visible Load more button as the accessible fallback. The list ends at
 * TMDB's last page. A page can come back short or empty with anime left
 * out, so the end is the page count, never a short page.
 */
function BrowseList({
  category,
  anime,
  watched,
}: {
  category: BrowseCategory;
  anime: boolean;
  watched: WatchedFilter;
}) {
  const fetchPage = React.useCallback(
    async (page: number, signal?: AbortSignal) => {
      const p = await getListPage(category.kind, category.type, page, { anime }, signal);
      return {
        items: p.items,
        last: page >= Math.min(p.totalPages, LAST_PAGE),
      };
    },
    [category, anime]
  );
  const { state, loadMore, retry, sentinelRef } = usePagedList({
    fetchPage,
    keyOf,
    firstPages: FIRST_PAGES,
  });

  const watchedIds = useWatched();

  if (state.kind === "loading") {
    return (
      <div className={GRID}>
        {Array.from({ length: 24 }).map((_, i) => (
          <PosterCardSkeleton key={i} variant="compact" />
        ))}
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
        <p className="text-[15px] font-semibold text-foreground">
          Could not load this list.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Something went wrong on Klyvi&apos;s end.
        </p>
        <Button className="mt-5" onClick={retry}>
          Try again
        </Button>
      </div>
    );
  }

  const { done, loadingMore } = state;
  const items =
    watched === "hide"
      ? state.items.filter((m) => !isWatched(watchedIds, m.mediaType, m.tmdbId))
      : state.items;

  if (items.length === 0 && done) {
    const hidden = state.items.length > 0;
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={SearchX}
          title={hidden ? "You have seen all of these" : "Nothing here right now"}
          body={
            hidden
              ? "Every title on this list is one you have watched. Show watched titles in Filters to see them again."
              : "This list came back empty. It refreshes as the catalog does."
          }
          action={{ label: "Back to Explore", href: "/explore" }}
        />
      </div>
    );
  }

  return (
    <>
      <div
        className={GRID}
        data-dim-watched={watched === "dim" ? "" : undefined}
      >
        {items.map((m) => (
          <PosterCard key={keyOf(m)} media={m} variant="compact" />
        ))}
        {loadingMore || (items.length === 0 && !done)
          ? Array.from({ length: PAGE_SIZE / 2 }).map((_, i) => (
              <PosterCardSkeleton key={`more-${i}`} variant="compact" />
            ))
          : null}
      </div>

      <div ref={sentinelRef} aria-hidden="true" />

      <div className="mt-8 flex justify-center">
        {done ? (
          <p className="text-sm text-muted-foreground">
            That is the whole list.
          </p>
        ) : (
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loadingMore}
          >
            Load more
          </Button>
        )}
      </div>
    </>
  );
}
