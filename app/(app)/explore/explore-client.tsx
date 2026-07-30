"use client";

import * as React from "react";
import { Search, SearchX, SlidersHorizontal, X } from "lucide-react";

import { EmptyState } from "@/components/klyvi/empty-state";
import { PosterCard } from "@/components/klyvi/poster-card";
import { MediaRail } from "@/components/klyvi/media-rail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockFeed } from "@/lib/mock-reco";
import type { MediaSummary } from "@/lib/types";

const RAILS = [
  { title: "Trending this week", offset: 0 },
  { title: "Popular films", offset: 2 },
  { title: "Top rated", offset: 4 },
];

const GENRES = {
  all: "Any genre",
  drama: "Drama",
  thriller: "Thriller",
  comedy: "Comedy",
  horror: "Horror",
  scifi: "Sci-Fi",
  documentary: "Documentary",
};

const DECADES = {
  all: "Any year",
  "2020": "2020s",
  "2010": "2010s",
  "2000": "2000s",
  "1990": "1990s",
  older: "Before 1990",
};

const SORTS = {
  relevance: "Relevance",
  rating: "Highest rated",
  newest: "Newest",
  oldest: "Oldest",
};

type ResultTab = "all" | "movie" | "tv" | "person";

/**
 * Explore is now the app's single search surface: the top bar and cmd+K both
 * land here, so the field and its filters have to carry that weight. Empty
 * query shows browse rails; typing switches to a filtered results grid.
 * Filters sit in a horizontal bar (the explore side of the filter rule in
 * 05-responsive.md), collapsing behind a toggle on mobile.
 */
export function ExploreClient({ autofocus }: { autofocus?: boolean }) {
  const [query, setQuery] = React.useState("");
  const [tab, setTab] = React.useState<ResultTab>("all");
  const [genre, setGenre] = React.useState("all");
  const [decade, setDecade] = React.useState("all");
  const [sort, setSort] = React.useState("relevance");
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [searching, setSearching] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (autofocus) inputRef.current?.focus();
  }, [autofocus]);

  const pool = mockFeed(2, 7);
  const q = query.trim().toLowerCase();
  const active = q.length >= 2;

  // Debounce so the results grid does not thrash on every keystroke.
  React.useEffect(() => {
    if (!active) return;
    setSearching(true);
    const t = setTimeout(() => setSearching(false), 220);
    return () => clearTimeout(t);
  }, [q, active]);

  const filterCount =
    (genre !== "all" ? 1 : 0) + (decade !== "all" ? 1 : 0) + (sort !== "relevance" ? 1 : 0);

  let results: MediaSummary[] | null = null;
  if (active) {
    let r = pool.filter((m) => m.title.toLowerCase().includes(q));
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
    if (sort === "newest") r = [...r].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    if (sort === "oldest") r = [...r].sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
    results = r as MediaSummary[];
  }

  function clearAll() {
    setQuery("");
    setGenre("all");
    setDecade("all");
    setSort("relevance");
    inputRef.current?.focus();
  }

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-8 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Explore</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Search the catalog, or browse when you do not know.
      </p>

      {/* Search field: prominent, since this is the only search surface. */}
      <div className="mt-6 flex w-full flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={2}
          />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search films, TV, and people"
            aria-label="Search films, TV, and people"
            className="h-11 pr-10 pl-9 text-base"
          />
          {query ? (
            <button
              type="button"
              onClick={clearAll}
              aria-label="Clear search"
              className="hit-44 absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              <X aria-hidden="true" className="size-4" strokeWidth={2} />
            </button>
          ) : null}
        </div>

        <Button
          variant="outline"
          size="touch"
          className="gap-2 lg:hidden"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
        >
          <SlidersHorizontal aria-hidden="true" data-icon="inline-start" />
          {filterCount > 0 ? `Filters (${filterCount})` : "Filters"}
        </Button>

        {/* Desktop: filters inline. Mobile: revealed by the toggle. */}
        <div
          className={
            (filtersOpen ? "flex" : "hidden lg:flex") +
            " w-full flex-wrap items-center gap-2 lg:w-auto lg:shrink-0"
          }
        >
          <Select value={genre} onValueChange={(v) => setGenre(v ?? "all")} items={GENRES}>
            <SelectTrigger aria-label="Genre" className="data-[size=default]:h-11 min-w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(GENRES).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={decade} onValueChange={(v) => setDecade(v ?? "all")} items={DECADES}>
            <SelectTrigger aria-label="Year" className="data-[size=default]:h-11 min-w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DECADES).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(v) => setSort(v ?? "relevance")} items={SORTS}>
            <SelectTrigger aria-label="Sort by" className="data-[size=default]:h-11 min-w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SORTS).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {filterCount > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => { setGenre("all"); setDecade("all"); setSort("relevance"); }}>
              Clear filters
            </Button>
          ) : null}
        </div>
      </div>

      {q.length === 1 ? (
        <p className="mt-3 text-xs text-muted-foreground">Keep typing.</p>
      ) : null}

      {!active ? (
        <div className="mt-10 flex flex-col gap-10">
          {RAILS.map((rail) => {
            const items = [...pool.slice(rail.offset), ...pool.slice(0, rail.offset)];
            return (
              <MediaRail key={rail.title} title={rail.title}>
                {items.map((m) => (
                  <div
                    key={m.mediaId}
                    className="w-28 shrink-0 snap-start sm:w-36 lg:w-40"
                  >
                    <PosterCard media={m as MediaSummary} variant="below" />
                  </div>
                ))}
              </MediaRail>
            );
          })}
        </div>
      ) : (
        <div className="mt-6">
          <Tabs value={tab} onValueChange={(v) => setTab(v as ResultTab)}>
            <TabsList variant="line">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="movie">Films</TabsTrigger>
              <TabsTrigger value="tv">TV</TabsTrigger>
              <TabsTrigger value="person">People</TabsTrigger>
            </TabsList>
          </Tabs>

          {searching ? (
            <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[2/3] rounded-art" />
              ))}
            </div>
          ) : tab === "tv" || tab === "person" ? (
            <p className="mt-6 text-sm text-muted-foreground">
              {tab === "tv" ? "TV" : "People"} search lands with the live
              catalog.
            </p>
          ) : results && results.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={`Nothing found for "${query.trim()}"`}
              body="Check the spelling, or try a shorter search."
              action={{ label: "Clear search", onClick: clearAll }}
              className="mt-4"
            />
          ) : (
            <>
              <p data-numeric className="mt-4 font-mono text-xs text-muted-foreground">
                {results?.length} {results?.length === 1 ? "result" : "results"}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
                {results?.map((m) => (
                  <PosterCard key={m.tmdbId} media={m} variant="below" />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
