"use client";

import * as React from "react";
import { Search, SearchX, X } from "lucide-react";

import { AnimeSwitch, useBrowseFilters } from "@/components/explore/browse-filters";
import { EmptyState } from "@/components/klyvi/empty-state";
import { FilterField, FilterPanel } from "@/components/klyvi/filter-panel";
import { PosterCard } from "@/components/klyvi/poster-card";
import { MediaRail } from "@/components/klyvi/media-rail";
import { SectionHeader } from "@/components/klyvi/section-header";
import { RankingList } from "@/components/explore/ranking-list";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DEFAULT_PREFS, usePref, type ExploreFilters } from "@/lib/local-prefs";
import { Input } from "@/components/ui/input";
import { PosterCardSkeleton } from "@/components/klyvi/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getMovieList, getTvList, type AnimeOption } from "@/lib/api/catalog";
import { search as apiSearch } from "@/lib/api/search";
import type { SearchMedia, SearchResults } from "@/lib/api/map";
import type { MediaSummary, PersonResult } from "@/lib/types";

/**
 * UI genres map to TMDB's stable genre ids. Sci-Fi differs between movie
 * (878) and TV (10765), so each entry carries every id that counts.
 */
const GENRES: { value: string; label: string; ids: number[] }[] = [
  { value: "all", label: "Any genre", ids: [] },
  { value: "drama", label: "Drama", ids: [18] },
  { value: "thriller", label: "Thriller", ids: [53] },
  { value: "comedy", label: "Comedy", ids: [35] },
  { value: "horror", label: "Horror", ids: [27] },
  { value: "scifi", label: "Sci-Fi", ids: [878, 10765] },
  { value: "action", label: "Action", ids: [28, 10759] },
  { value: "documentary", label: "Documentary", ids: [99] },
];

// A list, not an object: an object puts number-like keys ("2020") first,
// whatever order they are written in.
const DECADE_OPTIONS = [
  { value: "all", label: "Any year" },
  { value: "2020", label: "2020s" },
  { value: "2010", label: "2010s" },
  { value: "2000", label: "2000s" },
  { value: "1990", label: "1990s" },
  { value: "older", label: "Before 1990" },
];

const SORTS: Record<string, string> = {
  relevance: "Relevance",
  rating: "Highest rated",
  newest: "Newest",
  oldest: "Oldest",
};

type ResultTab = "all" | "movie" | "tv" | "person";

type Rail = {
  title: string;
  slug: string;
  load: (signal: AbortSignal, opts: AnimeOption) => Promise<MediaSummary[]>;
};

const RAILS: Rail[] = [
  {
    title: "Trending this week",
    slug: "trending-films",
    load: (s, o) => getMovieList("trending", s, 1, o),
  },
  {
    title: "Popular films",
    slug: "popular-films",
    load: (s, o) => getMovieList("popular", s, 1, o),
  },
  {
    title: "Top rated",
    slug: "top-rated-films",
    load: (s, o) => getMovieList("top_rated", s, 1, o),
  },
  {
    title: "Popular TV",
    slug: "popular-tv",
    load: (s, o) => getTvList("popular", s, 1, o),
  },
];

type RailState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; items: MediaSummary[] };

type SearchState =
  | { kind: "idle" }
  | { kind: "searching" }
  | { kind: "error" }
  | { kind: "ready"; results: SearchResults };

/**
 * Explore is the app's single search surface: the top bar and cmd+K land
 * here. Empty query shows browse rails from the TMDB list passthroughs,
 * each loading on its own; typing runs a debounced multi search, and the
 * tabs pick a bucket from the one response rather than re-querying.
 */
type Filters = ExploreFilters;
const NO_FILTERS: Filters = DEFAULT_PREFS.exploreFilters;

function countFilters(f: Filters): number {
  return (
    (f.genre !== "all" ? 1 : 0) + (f.decade !== "all" ? 1 : 0) + (f.sort !== "relevance" ? 1 : 0)
  );
}

/** What the Filters panel on Explore edits: the search filters, and anime
 *  in or out of the rails and top lists, which View more pages share. */
type PanelValue = { explore: Filters; anime: boolean };
const PANEL_DEFAULTS: PanelValue = {
  explore: NO_FILTERS,
  anime: DEFAULT_PREFS.browseFilters.anime,
};

function countPanel(v: PanelValue): number {
  return countFilters(v.explore) + (v.anime ? 1 : 0);
}

export function ExploreClient({
  autofocus,
  initialQuery = "",
}: {
  autofocus?: boolean;
  /** From `?q=`, so Back, reload and a shared link keep the search (#24). */
  initialQuery?: string;
}) {
  const [query, setQuery] = React.useState(initialQuery);
  const [tab, setTab] = React.useState<ResultTab>("all");
  // Remembered with the other preferences, so they follow the account.
  const [filters, commitFilters] = usePref("exploreFilters");
  const { genre, decade, sort } = filters;
  const { filters: browse, setAnime } = useBrowseFilters();
  const anime = browse.anime;
  const panelValue: PanelValue = { explore: filters, anime };
  const savePanel = (v: PanelValue) => {
    commitFilters(v.explore);
    if (v.anime !== anime) setAnime(v.anime);
  };

  /** The last search to settle, tagged with the query and attempt it
   *  answered. Idle and searching are derived from it during render. */
  const [settled, setSettled] = React.useState<{
    key: string;
    state: SearchState;
  } | null>(null);
  /** Bumped by the error state's Try again to rerun the same query. */
  const [retryNonce, setRetryNonce] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (autofocus) inputRef.current?.focus();
  }, [autofocus]);

  // ---------- search ----------
  const q = query.trim();
  const active = q.length >= 2;

  const searchKey = `${retryNonce}:${q}`;

  // The settled query goes in the URL with replaceState: no history entry
  // per keystroke, but Back from a result returns to it. `focus` is dropped
  // once there's a query, so a reload doesn't steal focus from the results.
  React.useEffect(() => {
    const t = setTimeout(() => {
      const sp = new URLSearchParams(window.location.search);
      if (active) {
        sp.set("q", q);
        sp.delete("focus");
      } else {
        sp.delete("q");
      }
      const qs = sp.toString();
      const next = window.location.pathname + (qs ? `?${qs}` : "");
      if (next !== window.location.pathname + window.location.search) {
        window.history.replaceState(window.history.state, "", next);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q, active]);

  React.useEffect(() => {
    if (!active) return;
    const ac = new AbortController();
    const t = setTimeout(() => {
      apiSearch(q, "multi", ac.signal)
        .then((results) =>
          setSettled({ key: searchKey, state: { kind: "ready", results } })
        )
        .catch((e) => {
          if (e instanceof DOMException && e.name === "AbortError") return;
          setSettled({ key: searchKey, state: { kind: "error" } });
        });
    }, 300);
    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [q, active, searchKey]);

  const searchState: SearchState = !active
    ? { kind: "idle" }
    : settled?.key === searchKey
      ? settled.state
      : { kind: "searching" };

  const filterCount = countFilters(filters);

  function applyFilters(items: SearchMedia[]): SearchMedia[] {
    let r = items;
    const g = GENRES.find((x) => x.value === genre);
    if (g && g.ids.length > 0) {
      r = r.filter((m) => m.genreIds.some((id) => g.ids.includes(id)));
    }
    if (decade !== "all") {
      r = r.filter((m) => {
        if (m.year == null) return false;
        if (decade === "older") return m.year < 1990;
        const d = Number(decade);
        return m.year >= d && m.year < d + 10;
      });
    }
    if (sort === "rating")
      r = [...r].sort((a, b) => (b.voteAverage ?? 0) - (a.voteAverage ?? 0));
    if (sort === "newest")
      r = [...r].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    if (sort === "oldest")
      r = [...r].sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
    return r;
  }

  function clearAll() {
    setQuery("");
    commitFilters(NO_FILTERS);
    inputRef.current?.focus();
  }

  // What the current tab shows, filters applied.
  const view =
    searchState.kind === "ready"
      ? {
          movies: applyFilters(searchState.results.movies),
          tv: applyFilters(searchState.results.tv),
          people: searchState.results.people,
        }
      : null;
  const visibleCount = view
    ? tab === "all"
      ? view.movies.length + view.tv.length + view.people.length
      : tab === "movie"
        ? view.movies.length
        : tab === "tv"
          ? view.tv.length
          : view.people.length
    : 0;


  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-8 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Explore</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Find a title by name, or browse the catalog.
      </p>

      {/* Search field: prominent, since this is the only search surface. */}
      <div className="mt-6 flex w-full flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={2}
          />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles"
            aria-label="Search films, TV, and people"
            className="h-11 pr-11 pl-10 text-base max-lg:rounded-full"
          />
          {query ? (
            <button
              type="button"
              onClick={clearAll}
              aria-label="Clear search"
              className="hit-44 absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              <X aria-hidden="true" className="size-4" strokeWidth={2} />
            </button>
          ) : null}
        </div>

        <FilterPanel
          value={panelValue}
          defaults={PANEL_DEFAULTS}
          onSave={savePanel}
          count={countPanel}
          iconOnly
        >
          {(draft, setDraft) => (
            <ExploreFilterFields value={draft} onChange={setDraft} />
          )}
        </FilterPanel>
      </div>

      {q.length === 1 ? (
        <p className="mt-3 text-xs text-muted-foreground">Keep typing.</p>
      ) : null}

      {/* ---------- browse ----------
          Hidden, not unmounted, during a search: clearing the query brings
          the rails back as they were, with no refetch. */}
      <div hidden={active} className="mt-10 flex flex-col gap-10">
        {RAILS.map((rail, i) => (
          <CatalogRail
            // A fresh fetch, with its skeleton, when anime goes in or out.
            key={`${rail.slug}:${anime}`}
            rail={rail}
            anime={anime}
            first={i === 0}
          />
        ))}

        {/* The first ten of each top list, films and series side by side on
            a wide screen, one after the other on a phone. */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-6">
          <section>
            <SectionHeader
              title="Top films"
              action={{ label: "View all", href: "/explore/top-100-films" }}
              className="mb-4"
            />
            <RankingList kind="movies" limit={10} />
          </section>
          <section>
            <SectionHeader
              title="Top series"
              action={{ label: "View all", href: "/explore/top-100-tv" }}
              className="mb-4"
            />
            <RankingList kind="tv" limit={10} />
          </section>
        </div>
      </div>

      {active ? (
        // ---------- results ----------
        <div className="mt-6">
          <Tabs value={tab} onValueChange={(v) => setTab(v as ResultTab)}>
            <TabsList variant="line">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="movie">Films</TabsTrigger>
              <TabsTrigger value="tv">TV</TabsTrigger>
              <TabsTrigger value="person">People</TabsTrigger>
            </TabsList>
          </Tabs>

          {searchState.kind === "searching" ? (
            <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[2/3] rounded-art" />
              ))}
            </div>
          ) : searchState.kind === "error" ? (
            <div className="mt-12 text-center">
              <p className="text-[15px] font-semibold text-foreground">
                Search is not responding.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Something went wrong on Klyvi&apos;s end.
              </p>
              <Button
                className="mt-5"
                onClick={() => setRetryNonce((n) => n + 1)}
              >
                Try again
              </Button>
            </div>
          ) : view && visibleCount === 0 ? (
            <EmptyState
              icon={SearchX}
              title={`Nothing found for "${q}"`}
              body={
                filterCount > 0
                  ? "Nothing matches with these filters. Loosen them, or check the spelling."
                  : "Check the spelling, or try a shorter search."
              }
              action={{ label: "Clear search", onClick: clearAll }}
              className="mt-4"
            />
          ) : view ? (
            <>
              <p
                data-numeric
                className="mt-4 font-mono text-xs text-muted-foreground"
              >
                {visibleCount} {visibleCount === 1 ? "result" : "results"}
              </p>

              {(tab === "all" || tab === "movie") && view.movies.length > 0 ? (
                <ResultGrid
                  heading={tab === "all" ? "Films" : null}
                  items={view.movies}
                />
              ) : null}

              {(tab === "all" || tab === "tv") && view.tv.length > 0 ? (
                <ResultGrid
                  heading={tab === "all" ? "TV" : null}
                  items={view.tv}
                />
              ) : null}

              {(tab === "all" || tab === "person") &&
              view.people.length > 0 ? (
                <PeopleGrid
                  heading={tab === "all" ? "People" : null}
                  people={view.people}
                />
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}

/**
 * One browse rail. It owns its fetch and skeleton, so a slow list does not
 * hold back the others and a failed one says so in place while the rest
 * stay up.
 */
/** Cards the first rail shows on a wide screen before it scrolls. */
const FIRST_SCREEN = 7;

function CatalogRail({
  rail,
  anime,
  first,
}: {
  rail: Rail;
  anime: boolean;
  first: boolean;
}) {
  const [state, setState] = React.useState<RailState>({ kind: "loading" });
  /** Bumped by Try again to refetch just this rail. */
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    const ac = new AbortController();
    rail
      .load(ac.signal, { anime })
      .then((items) => setState({ kind: "ready", items }))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setState({ kind: "error" });
      });
    return () => ac.abort();
  }, [rail, anime, attempt]);

  const action = { label: "View more", href: `/explore/browse/${rail.slug}` };

  if (state.kind === "error") {
    return (
      <section>
        <SectionHeader title={rail.title} action={action} className="mb-4" />
        <div className="rounded-lg bg-card p-6 text-center ring-1 ring-foreground/10">
          <p className="text-sm text-muted-foreground">
            Could not load this list right now.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              setState({ kind: "loading" });
              setAttempt((n) => n + 1);
            }}
          >
            Try again
          </Button>
        </div>
      </section>
    );
  }

  return (
    <MediaRail title={rail.title} action={action}>
      {state.kind === "loading"
        ? Array.from({ length: 7 }).map((_, i) => (
            <PosterCardSkeleton key={i} variant="below" />
          ))
        : state.items.map((m, i) => (
            <PosterCard
              key={`${m.mediaType}-${m.tmdbId}`}
              media={m}
              variant="below"
              eager={first && i < FIRST_SCREEN}
            />
          ))}
    </MediaRail>
  );
}

const SORT_OPTIONS = Object.entries(SORTS).map(([value, label]) => ({ value, label }));

/** One choice from a row of chips. Pressing the chosen chip again keeps
 *  it, so the row always has one on. */
function ChipChoice({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <FilterField label={label}>
      <ToggleGroup
        value={[value]}
        onValueChange={(v: unknown[]) => {
          const next = options.find((o) => o.value === v.at(-1));
          if (next) onChange(next.value);
        }}
        variant="outline"
        size="sm"
        // Named by the field around it, so it is not read out twice.
        className="w-full flex-wrap"
      >
        {options.map((o) => (
          <ToggleGroupItem
            key={o.value}
            value={o.value}
            className="aria-pressed:border-foreground/40 max-lg:h-11 max-lg:px-4"
          >
            {o.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </FilterField>
  );
}

/** The Filters on Explore: genre, year and sort for search results, and
 *  anime in or out of the lists. */
function ExploreFilterFields({
  value,
  onChange,
}: {
  value: PanelValue;
  onChange: (next: PanelValue) => void;
}) {
  const set = (patch: Partial<Filters>) =>
    onChange({ ...value, explore: { ...value.explore, ...patch } });
  return (
    <>
      <p className="-mb-2 text-xs text-muted-foreground">
        Genre, year and sort narrow what a search finds.
      </p>
      <ChipChoice
        label="Genre"
        options={GENRES}
        value={value.explore.genre}
        onChange={(genre) => set({ genre })}
      />
      <ChipChoice
        label="Year"
        options={DECADE_OPTIONS}
        value={value.explore.decade}
        onChange={(decade) => set({ decade })}
      />
      <ChipChoice
        label="Sort by"
        options={SORT_OPTIONS}
        value={value.explore.sort}
        onChange={(sort) => set({ sort })}
      />
      <AnimeSwitch
        checked={value.anime}
        onCheckedChange={(on) => onChange({ ...value, anime: on })}
      />
    </>
  );
}

function ResultGrid({
  heading,
  items,
}: {
  heading: string | null;
  items: MediaSummary[];
}) {
  return (
    <section className="mt-5">
      {heading ? (
        <h2 className="mb-3 text-xs font-medium tracking-[0.12em] uppercase text-muted-foreground">
          {heading}
        </h2>
      ) : null}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
        {items.map((m) => (
          <PosterCard
            key={`${m.mediaType}-${m.tmdbId}`}
            media={m}
            variant="below"
          />
        ))}
      </div>
    </section>
  );
}

/**
 * People render as a quiet list, not poster cards: there is no person detail
 * page yet, so these rows are informational rather than navigational.
 */
function PeopleGrid({
  heading,
  people,
}: {
  heading: string | null;
  people: PersonResult[];
}) {
  return (
    <section className="mt-5">
      {heading ? (
        <h2 className="mb-3 text-xs font-medium tracking-[0.12em] uppercase text-muted-foreground">
          People
        </h2>
      ) : null}
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((p) => (
          <li
            key={p.tmdbId}
            className="flex items-center gap-3 rounded-lg bg-card px-3 py-2.5 ring-1 ring-foreground/10"
          >
            <Avatar className="size-10">
              {p.profilePath ? (
                <AvatarImage
                  src={`https://image.tmdb.org/t/p/w185${p.profilePath}`}
                  alt=""
                />
              ) : null}
              <AvatarFallback className="text-xs">
                {p.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {p.name}
              </p>
              {p.knownFor.length > 0 ? (
                <p className="truncate text-xs text-muted-foreground">
                  {p.knownFor.slice(0, 3).join(", ")}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
