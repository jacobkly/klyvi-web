"use client";

import * as React from "react";
import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/klyvi/empty-state";
import { PosterCard } from "@/components/klyvi/poster-card";
import { SectionHeader } from "@/components/klyvi/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockFeed } from "@/lib/mock-reco";
import type { MediaSummary } from "@/lib/types";

const RAILS: { title: string; offset: number }[] = [
  { title: "Trending this week", offset: 0 },
  { title: "Popular films", offset: 2 },
  { title: "Top rated", offset: 4 },
];

type ResultTab = "all" | "movie" | "tv" | "person";

/**
 * Explore: browse rails on an empty query, a results grid while searching.
 * Search runs against the mock pool; the API's /v1/search lands with auth.
 * Titles sit below the artwork here, the explore side of the title placement
 * rule. Rails keep horizontal scroll at every width.
 */
export function ExploreClient() {
  const [query, setQuery] = React.useState("");
  const [tab, setTab] = React.useState<ResultTab>("all");
  const pool = mockFeed(2, 7);

  const q = query.trim().toLowerCase();
  const results =
    q.length >= 2
      ? pool.filter((m) => m.title.toLowerCase().includes(q))
      : null;

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-8 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Explore</h1>

      <div className="mt-5 max-w-md">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search films and TV"
          aria-label="Search films and TV"
        />
        {q.length === 1 ? (
          <p className="mt-2 text-xs text-muted-foreground">Keep typing.</p>
        ) : null}
      </div>

      {results == null ? (
        <div className="mt-8 flex flex-col gap-10">
          {RAILS.map((rail) => {
            const items = [
              ...pool.slice(rail.offset),
              ...pool.slice(0, rail.offset),
            ];
            return (
              <section key={rail.title}>
                <SectionHeader
                  title={rail.title}
                  action={{ label: "View all", href: "/explore" }}
                  className="mb-4"
                />
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {items.map((m) => (
                    <div key={m.mediaId} className="w-28 shrink-0 sm:w-36">
                      <PosterCard media={m as MediaSummary} variant="below" />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="mt-6">
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as ResultTab)}
          >
            <TabsList variant="line">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="movie">Films</TabsTrigger>
              <TabsTrigger value="tv">TV</TabsTrigger>
              <TabsTrigger value="person">People</TabsTrigger>
            </TabsList>
          </Tabs>

          {results.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={`Nothing found for "${query.trim()}"`}
              body="Check the spelling, or try a shorter search."
              action={{ label: "Clear search", onClick: () => setQuery("") }}
              className="mt-4"
            />
          ) : tab === "tv" || tab === "person" ? (
            <div className="mt-6">
              <p className="text-sm text-muted-foreground">
                {tab === "tv"
                  ? "TV search lands with the live catalog."
                  : "People search lands with the live catalog."}
              </p>
              <Button
                variant="link"
                size="sm"
                className="mt-1 px-0"
                onClick={() => setTab("all")}
              >
                Back to all results
              </Button>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
              {results.map((m) => (
                <PosterCard
                  key={m.mediaId}
                  media={m as MediaSummary}
                  variant="below"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
