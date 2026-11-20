"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Film, Search, Tv, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { SearchResults } from "@/lib/api/map";
import { search } from "@/lib/api/search";
import { mediaHref } from "@/lib/media-href";

const RECENTS_KEY = "klyvi:recent-searches";
const MAX_RECENTS = 8;
const MAX_ROWS = 20;
const DEBOUNCE_MS = 250;

function readRecents(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function writeRecents(list: string[]) {
  try {
    if (list.length === 0) window.localStorage.removeItem(RECENTS_KEY);
    else window.localStorage.setItem(RECENTS_KEY, JSON.stringify(list));
  } catch {
    // Private mode or blocked storage: recents just do not stick.
  }
}

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; results: SearchResults };

/**
 * Films and series in one list. The API splits them into buckets, so they
 * are woven back together, keeping each bucket in TMDB's ranked order.
 */
function rows(results: SearchResults) {
  const out: SearchResults["movies"] = [];
  const { movies, tv } = results;
  for (let i = 0; i < Math.max(movies.length, tv.length); i++) {
    if (movies[i]) out.push(movies[i]);
    if (tv[i]) out.push(tv[i]);
  }
  return out.slice(0, MAX_ROWS);
}

const ROW =
  "flex min-h-11 items-center gap-3 rounded-lg px-2 py-2 outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30";

/**
 * Search on a phone: a full-screen sheet over the page with the field
 * focused and the keyboard up, recents before you type, and results as
 * poster, title and year. It uses Explore's search call, and "See all in
 * Explore" hands the query over for filters and the full grid. Desktop keeps
 * Ctrl+K and the top bar going straight to Explore.
 */
export function MobileSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = React.useState("");
  const [attempt, setAttempt] = React.useState(0);
  // Read once on the client. The sheet's content only renders once it is
  // open, so the server's empty list never reaches the page.
  const [recents, setRecents] = React.useState<string[]>(() =>
    typeof window === "undefined" ? [] : readRecents()
  );
  const q = query.trim();
  const key = `${attempt}:${q}`;
  // The last search to settle, tagged with its query and attempt, so a
  // stale answer never shows under a newer query.
  const [settled, setSettled] = React.useState<{ key: string; state: State } | null>(null);
  const state: State = !q
    ? { kind: "idle" }
    : settled?.key === key
      ? settled.state
      : { kind: "loading" };

  React.useEffect(() => {
    if (!q) return;
    const ac = new AbortController();
    const t = window.setTimeout(() => {
      search(q, "multi", ac.signal)
        .then((results) => setSettled({ key, state: { kind: "ready", results } }))
        .catch(() => {
          if (!ac.signal.aborted) setSettled({ key, state: { kind: "error" } });
        });
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(t);
      ac.abort();
    };
  }, [q, key]);

  const remember = (term: string) => {
    const next = [term, ...recents.filter((r) => r.toLowerCase() !== term.toLowerCase())].slice(
      0,
      MAX_RECENTS
    );
    setRecents(next);
    writeRecents(next);
  };

  const close = () => {
    if (q) remember(q);
    onOpenChange(false);
  };

  const found = state.kind === "ready" ? rows(state.results) : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="top"
        showCloseButton={false}
        className="[--glass-bg:var(--background)] [--glass-blur:0px] data-[side=top]:h-dvh data-[side=top]:border-b-0"
      >
        <SheetTitle className="sr-only">Search</SheetTitle>
        <div className="flex items-center gap-1 border-b border-border px-2 pt-[env(safe-area-inset-top)]">
          <Button
            variant="ghost"
            size="icon-touch"
            aria-label="Close search"
            onClick={() => onOpenChange(false)}
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
          </Button>
          <div className="relative flex-1 py-2">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              autoFocus
              enterKeyHint="search"
              aria-label="Search films and series"
              placeholder="Films and series"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && q) remember(q);
              }}
              className="h-11 w-full rounded-lg border border-input bg-input/30 pr-10 pl-9 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 [&::-webkit-search-cancel-button]:hidden"
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear the search"
                onClick={() => setQuery("")}
                className="hit-44 absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-2 py-3" aria-live="polite">
          {state.kind === "idle" ? (
            recents.length > 0 ? (
              <section aria-labelledby="recent-searches">
                <div className="flex items-center justify-between px-2">
                  <h2 id="recent-searches" className="text-xs font-medium text-muted-foreground">
                    Recent searches
                  </h2>
                  <Button
                    variant="link"
                    size="xs"
                    className="hit-44 relative px-0"
                    onClick={() => {
                      setRecents([]);
                      writeRecents([]);
                    }}
                  >
                    Clear
                  </Button>
                </div>
                <ul className="mt-1">
                  {recents.map((r) => (
                    <li key={r}>
                      <button type="button" className={`${ROW} w-full text-left text-sm`} onClick={() => setQuery(r)}>
                        <Clock aria-hidden="true" className="size-4 text-muted-foreground" />
                        <span className="truncate">{r}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                Search for a film or a series by its title.
              </p>
            )
          ) : null}

          {state.kind === "loading" ? (
            <ul aria-label="Loading results" className="flex flex-col gap-2 px-2">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="flex items-center gap-3">
                  <Skeleton className="h-15 w-10 rounded-art" />
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {state.kind === "error" ? (
            <div className="flex flex-col items-center gap-3 px-2 py-8 text-center">
              <p className="text-sm text-muted-foreground">Search did not come back. Check your connection.</p>
              <Button variant="outline" size="touch" onClick={() => setAttempt((a) => a + 1)}>
                Try again
              </Button>
            </div>
          ) : null}

          {state.kind === "ready" && found.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">
              Nothing matches &ldquo;{q}&rdquo;. Try another spelling or fewer words.
            </p>
          ) : null}

          {found.length > 0 ? (
            <>
              <ul aria-label="Results">
                {found.map((m) => (
                  <li key={`${m.mediaType}-${m.tmdbId}`}>
                    <Link href={mediaHref(m)} className={ROW} onClick={close}>
                      <div className="h-15 w-10 shrink-0 overflow-hidden rounded-art bg-muted">
                        {m.posterPath ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`https://image.tmdb.org/t/p/w92${m.posterPath}`}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{m.title}</p>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {m.mediaType === "tv" ? (
                            <Tv aria-hidden="true" className="size-3" />
                          ) : (
                            <Film aria-hidden="true" className="size-3" />
                          )}
                          <span>{m.mediaType === "tv" ? "Series" : "Film"}</span>
                          {m.year ? <span className="font-mono">{m.year}</span> : null}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={`/explore?q=${encodeURIComponent(q)}`}
                onClick={close}
                className="tap-target mt-2 flex items-center justify-center rounded-full text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                See all in Explore
              </Link>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
