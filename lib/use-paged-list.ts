"use client";

import * as React from "react";

import { useLoadNearEnd } from "@/lib/use-load-near-end";

export type PagedState<T> =
  | { kind: "loading" }
  | { kind: "error" }
  | {
      kind: "ready";
      items: T[];
      page: number;
      /** True once the last page is in. */
      done: boolean;
      loadingMore: boolean;
    };

/** One page as the caller fetched it, and whether it was the last. */
export type FetchedPage<T> = { items: T[]; last: boolean };

/**
 * A list that loads page by page as its end nears. The first `firstPages`
 * come in together before anything shows, then the next one each time the
 * sentinel (put `sentinelRef` just past the list) is within three screens
 * (see useLoadNearEnd). Items are deduped by `keyOf`, since a list can shift
 * between page reads. A page that filters down to little keeps the end in
 * view, so the next one follows.
 *
 * `fetchPage` should be stable (a useCallback). A new one refetches from the
 * first page but keeps what is shown until it lands, so a caller that wants
 * a clean slate keys the component instead.
 */
export function usePagedList<T>({
  fetchPage,
  keyOf,
  firstPages = 1,
}: {
  fetchPage: (page: number, signal?: AbortSignal) => Promise<FetchedPage<T>>;
  keyOf: (item: T) => string;
  firstPages?: number;
}): {
  state: PagedState<T>;
  loadMore: () => void;
  retry: () => void;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
} {
  const [state, setState] = React.useState<PagedState<T>>({ kind: "loading" });
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  // Synchronous mirror of `state`, so loadMore can guard against the scroll
  // check and the button firing in the same tick (and StrictMode
  // double-invoking updaters) without starting effects inside setState.
  const stateRef = React.useRef<PagedState<T>>(state);
  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const keyRef = React.useRef(keyOf);
  React.useEffect(() => {
    keyRef.current = keyOf;
  }, [keyOf]);

  /** Bumped by Try again to refetch the first pages. */
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    const ac = new AbortController();
    Promise.all(
      Array.from({ length: firstPages }, (_, i) => fetchPage(i + 1, ac.signal))
    )
      .then((pages) => {
        const key = keyRef.current;
        const seen = new Set<string>();
        const items: T[] = [];
        let done = false;
        for (const p of pages) {
          if (done) break;
          for (const item of p.items) {
            if (seen.has(key(item))) continue;
            seen.add(key(item));
            items.push(item);
          }
          done = p.last;
        }
        setState({
          kind: "ready",
          items,
          page: firstPages,
          done,
          loadingMore: false,
        });
      })
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setState({ kind: "error" });
      });
    return () => ac.abort();
  }, [fetchPage, firstPages, attempt]);

  const retry = React.useCallback(() => {
    setState({ kind: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  const loadMore = React.useCallback(() => {
    const cur = stateRef.current;
    if (cur.kind !== "ready" || cur.done || cur.loadingMore) return;
    const marked: PagedState<T> = { ...cur, loadingMore: true };
    stateRef.current = marked;
    setState(marked);
    const nextPage = cur.page + 1;
    fetchPage(nextPage)
      .then((fetched) => {
        setState((s) => {
          if (s.kind !== "ready") return s;
          const key = keyRef.current;
          const seen = new Set(s.items.map(key));
          const fresh = fetched.items.filter((item) => !seen.has(key(item)));
          return {
            kind: "ready",
            items: [...s.items, ...fresh],
            page: nextPage,
            done: fetched.last,
            loadingMore: false,
          };
        });
      })
      .catch(() => {
        // A failed page is not a failed screen. Stop quietly and let the
        // button offer another try.
        setState((s) => (s.kind === "ready" ? { ...s, loadingMore: false } : s));
      });
  }, [fetchPage]);

  // loadMore is guarded (done, loadingMore), so an eager call is safe.
  const ready = state.kind === "ready";
  useLoadNearEnd(sentinelRef, loadMore, ready, ready ? state.page : 0);

  return { state, loadMore, retry, sentinelRef };
}
