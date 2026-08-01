"use client";

import * as React from "react";
import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/klyvi/empty-state";
import { PosterCard } from "@/components/klyvi/poster-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getMovieList, getTvList } from "@/lib/api/catalog";
import type { BrowseCategory } from "@/lib/browse-categories";
import type { MediaSummary } from "@/lib/types";

type State =
  | { kind: "loading" }
  | { kind: "error" }
  | {
      kind: "ready";
      items: MediaSummary[];
      page: number;
      /** True once a page added nothing new: the list has run dry. */
      done: boolean;
      loadingMore: boolean;
    };

function keyOf(m: MediaSummary): string {
  return `${m.mediaType}:${m.tmdbId}`;
}

/**
 * The grid behind a rail's View more: first page up front, then an
 * IntersectionObserver sentinel pulls the next page as the user nears the
 * bottom, with a visible Load more button as the accessible fallback.
 * Pages are deduped by id and the list ends the first time a page brings
 * nothing new, so a backend that pins page 1 (today's) degrades to one
 * quiet page instead of a spinner that never stops.
 */
export function BrowseClient({ category }: { category: BrowseCategory }) {
  const [state, setState] = React.useState<State>({ kind: "loading" });
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  // Synchronous mirror of `state` so loadMore can guard against the
  // observer and the button firing in the same tick (and StrictMode
  // double-invoking updaters) without starting effects inside setState.
  const stateRef = React.useRef<State>(state);
  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const fetchPage = React.useCallback(
    (page: number, signal?: AbortSignal) =>
      category.kind === "movie"
        ? getMovieList(category.type, signal, page)
        : getTvList(category.type, signal, page),
    [category]
  );

  const loadFirst = React.useCallback(() => {
    setState({ kind: "loading" });
    const ac = new AbortController();
    fetchPage(1, ac.signal)
      .then((items) =>
        setState({
          kind: "ready",
          items,
          page: 1,
          done: items.length === 0,
          loadingMore: false,
        })
      )
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setState({ kind: "error" });
      });
    return ac;
  }, [fetchPage]);

  React.useEffect(() => {
    const ac = loadFirst();
    return () => ac.abort();
  }, [loadFirst]);

  const loadMore = React.useCallback(() => {
    const cur = stateRef.current;
    if (cur.kind !== "ready" || cur.done || cur.loadingMore) return;
    const marked: State = { ...cur, loadingMore: true };
    stateRef.current = marked;
    setState(marked);
    const nextPage = cur.page + 1;
    fetchPage(nextPage)
      .then((fetched) => {
        setState((s) => {
          if (s.kind !== "ready") return s;
          const seen = new Set(s.items.map(keyOf));
          const fresh = fetched.filter((m) => !seen.has(keyOf(m)));
          return {
            kind: "ready",
            items: [...s.items, ...fresh],
            page: nextPage,
            done: fresh.length === 0,
            loadingMore: false,
          };
        });
      })
      .catch(() => {
        // A failed page is not a failed screen; stop quietly and let
        // the button offer another try.
        setState((s) =>
          s.kind === "ready" ? { ...s, loadingMore: false } : s
        );
      });
  }, [fetchPage]);

  // Observe the sentinel; the button below stays as the fallback.
  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore, state.kind]);

  if (state.kind === "loading") {
    return (
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
        {Array.from({ length: 16 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[2/3] rounded-art" />
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
        <Button className="mt-5" onClick={() => loadFirst()}>
          Try again
        </Button>
      </div>
    );
  }

  const { items, done, loadingMore } = state;

  if (items.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={SearchX}
          title="Nothing here right now"
          body="This list came back empty. It refreshes as the catalog does."
          action={{ label: "Back to Explore", href: "/explore" }}
        />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
        {items.map((m) => (
          <PosterCard key={keyOf(m)} media={m} variant="compact" />
        ))}
      </div>

      <div ref={sentinelRef} aria-hidden="true" />

      <div className="mt-8 flex justify-center">
        {done ? (
          <p className="text-sm text-muted-foreground">
            That is the whole list for now.
          </p>
        ) : (
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading" : "Load more"}
          </Button>
        )}
      </div>
    </>
  );
}
