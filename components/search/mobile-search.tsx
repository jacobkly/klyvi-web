"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Clock, Film, Search, TrendingUp, Tv, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { getMovieList } from "@/lib/api/catalog";
import type { SearchResults } from "@/lib/api/map";
import { search } from "@/lib/api/search";
import type { MediaSummary } from "@/lib/types";
import { mediaHref } from "@/lib/media-href";
import { cn } from "@/lib/utils";

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

type Kind = "all" | "movie" | "tv";
const KINDS: { id: Kind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "movie", label: "Films" },
  { id: "tv", label: "Series" },
];

const CHIP =
  "tap-target rounded-full px-3.5 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30";

function Poster({ path, className }: { path: string | null; className: string }) {
  return (
    <div className={`shrink-0 overflow-hidden rounded-art bg-muted ring-1 ring-foreground/10 ${className}`}>
      {path ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://image.tmdb.org/t/p/w185${path}`}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : null}
    </div>
  );
}

function KindLine({ m }: { m: { mediaType: string; year: number | null } }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {m.mediaType === "tv" ? (
        <Tv aria-hidden="true" className="size-3" />
      ) : (
        <Film aria-hidden="true" className="size-3" />
      )}
      <span>{m.mediaType === "tv" ? "Series" : "Film"}</span>
      {m.year ? <span className="font-mono">{m.year}</span> : null}
    </p>
  );
}

/**
 * Where the sheet starts and ends: cut down to the top bar's Search pill, past
 * the 44px button and gap beside it. Opaque and still, so the pill seems to
 * grow, rather than a page fading or sliding in over it.
 */
const PILL =
  "data-starting-style:opacity-100 data-ending-style:opacity-100 data-[side=top]:data-starting-style:translate-y-0 data-[side=top]:data-ending-style:translate-y-0 data-starting-style:[clip-path:inset(calc(var(--top-bar-height)-2.75rem)_1rem_calc(100%-var(--top-bar-height))_4.25rem_round_1.375rem)] data-ending-style:[clip-path:inset(calc(var(--top-bar-height)-2.75rem)_1rem_calc(100%-var(--top-bar-height))_4.25rem_round_1.375rem)]";

const ROW =
  "flex min-h-11 items-center gap-3 rounded-lg px-2 py-2 outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30";

/**
 * Search on a phone: a full-screen sheet over the page with the field
 * focused and the keyboard up. It grows out of the top bar's Search pill and
 * closes back into it, with its own field where the pill was. Before you type: recent searches as chips
 * and what is trending. After: the best match as a large card, the rest as
 * poster, title and year, narrowed to films or series with one tap. It uses Explore's search call, and "See all in
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
  const [kind, setKind] = React.useState<Kind>("all");
  const [trending, setTrending] = React.useState<MediaSummary[] | null>(null);
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

  // Something to tap before typing. Fetched once per mount, and a failure
  // just leaves the section out.
  React.useEffect(() => {
    if (!open || trending) return;
    const ac = new AbortController();
    getMovieList("trending", ac.signal)
      .then((list) => setTrending(list.slice(0, 6)))
      .catch(() => {});
    return () => ac.abort();
  }, [open, trending]);

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

  const all = state.kind === "ready" ? rows(state.results) : [];
  const counts = {
    all: all.length,
    movie: all.filter((m) => m.mediaType === "movie").length,
    tv: all.filter((m) => m.mediaType === "tv").length,
  };
  // A filter with nothing under it (after a new search) falls back to All.
  const shown: Kind = counts[kind] > 0 ? kind : "all";
  const found = shown === "all" ? all : all.filter((m) => m.mediaType === shown);
  const [top, ...rest] = found;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="top"
        showCloseButton={false}
        className={cn(
          "[--glass-bg:var(--background)] [--glass-blur:0px] data-[side=top]:h-dvh data-[side=top]:border-b-0",
          "transition-[clip-path,opacity] duration-(--dur-slow) ease-(--ease-enter) [clip-path:inset(0_0_0_0_round_0px)]",
          PILL
        )}
      >
        <SheetTitle className="sr-only">Search</SheetTitle>
        <div className="flex h-(--top-bar-height) shrink-0 items-end gap-2 px-4">
          <Button
            variant="outline"
            size="icon-touch"
            aria-label="Close search"
            className="shrink-0 rounded-full"
            onClick={() => onOpenChange(false)}
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
          </Button>
          <div className="relative min-w-0 flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
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
              className="h-11 w-full rounded-full border border-input bg-input/30 pr-11 pl-10 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 [&::-webkit-search-cancel-button]:hidden"
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear the search"
                onClick={() => setQuery("")}
                className="hit-44 absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-2 py-3" aria-live="polite">
          {state.kind === "idle" ? (
            <>
            {recents.length > 0 ? (
              <section aria-labelledby="recent-searches" className="px-2">
                <div className="flex items-center justify-between">
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
                <ul className="mt-2 flex flex-wrap gap-2">
                  {recents.map((r) => (
                    <li key={r} className="max-w-full">
                      <button
                        type="button"
                        className={`${CHIP} flex max-w-full items-center gap-1.5 bg-card text-foreground ring-1 ring-foreground/10 hover:bg-muted`}
                        onClick={() => setQuery(r)}
                      >
                        <Clock aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{r}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <p className="px-2 pt-4 pb-2 text-center text-sm text-muted-foreground">
                Search for a film or a series by its title.
              </p>
            )}
            {trending && trending.length > 0 ? (
              <section aria-labelledby="trending-now" className="mt-6 px-2">
                <h2
                  id="trending-now"
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
                >
                  <TrendingUp aria-hidden="true" className="size-3.5" />
                  Trending this week
                </h2>
                <ul className="mt-2 grid grid-cols-3 gap-3">
                  {trending.map((m) => (
                    <li key={m.tmdbId}>
                      <Link
                        href={mediaHref(m)}
                        onClick={close}
                        className="block rounded-art outline-none focus-visible:ring-3 focus-visible:ring-ring/30 active:scale-[0.98] motion-reduce:active:scale-100"
                      >
                        <Poster path={m.posterPath} className="aspect-[2/3] w-full" />
                        <p className="mt-1.5 truncate text-xs font-medium text-foreground">{m.title}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            </>
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

          {state.kind === "ready" && all.length > 0 ? (
            <div role="group" aria-label="Show" className="mb-3 flex gap-2 px-2">
              {KINDS.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  aria-pressed={shown === k.id}
                  disabled={counts[k.id] === 0}
                  onClick={() => setKind(k.id)}
                  className={`${CHIP} disabled:opacity-50 ${
                    shown === k.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground"
                  }`}
                >
                  {k.label}
                  <span data-numeric className="ml-1.5 font-mono text-xs opacity-70">
                    {counts[k.id]}
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {state.kind === "ready" && all.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">
              Nothing matches &ldquo;{q}&rdquo;. Try another spelling or fewer words.
            </p>
          ) : null}

          {found.length > 0 ? (
            <>
              <ul aria-label="Results">
                <li key={`${top.mediaType}-${top.tmdbId}`} className="mb-2">
                  <Link
                    href={mediaHref(top)}
                    onClick={close}
                    className={`${ROW} bg-card p-3 ring-1 ring-foreground/10`}
                  >
                    <Poster path={top.posterPath} className="h-24 w-16" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium tracking-[0.12em] text-violet-text uppercase">
                        Top result
                      </p>
                      <p className="mt-1 line-clamp-2 text-base font-semibold text-foreground">
                        {top.title}
                      </p>
                      <div className="mt-1">
                        <KindLine m={top} />
                      </div>
                    </div>
                    <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" />
                  </Link>
                </li>
                {rest.map((m) => (
                  <li key={`${m.mediaType}-${m.tmdbId}`}>
                    <Link href={mediaHref(m)} className={ROW} onClick={close}>
                      <Poster path={m.posterPath} className="h-15 w-10" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{m.title}</p>
                        <KindLine m={m} />
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
