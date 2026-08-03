"use client";

import * as React from "react";
import { Star } from "lucide-react";

import { EmptyState } from "@/components/klyvi/empty-state";
import { PosterCard } from "@/components/klyvi/poster-card";
import { SectionHeader } from "@/components/klyvi/section-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listTracking } from "@/lib/api/tracking";
import type { LibraryEntry } from "@/lib/types";

type State =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; favorites: LibraryEntry[] };

/**
 * Favorites: the entries the user has starred, from the tracking list's
 * `favorite` flag. Sorted highest-rated first, unrated last.
 */
export function FavoritesClient() {
  const [state, setState] = React.useState<State>({ kind: "loading" });

  const load = React.useCallback(() => {
    setState({ kind: "loading" });
    listTracking()
      .then((entries) =>
        setState({
          kind: "ready",
          favorites: entries
            .filter((e) => e.favorite)
            .sort((a, b) => (b.score ?? -1) - (a.score ?? -1)),
        })
      )
      .catch(() => setState({ kind: "error" }));
  }, []);

  React.useEffect(load, [load]);

  if (state.kind === "loading") {
    return (
      <main className="mx-auto w-full max-w-[1400px] px-4 py-8 md:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Favorites</h1>
        <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-art" />
          ))}
        </div>
      </main>
    );
  }

  if (state.kind === "error") {
    return (
      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 py-8 md:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Favorites</h1>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-[15px] font-semibold text-foreground">
            Could not load your favorites.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Something went wrong on Klyvi&apos;s end.
          </p>
          <Button className="mt-5" onClick={load}>
            Try again
          </Button>
        </div>
      </main>
    );
  }

  const { favorites } = state;

  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 py-8 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Favorites</h1>

      {favorites.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <EmptyState
            icon={Star}
            title="No favorites yet"
            body="Star a film or season from its page and it lands here."
            action={{ label: "Find something to watch", href: "/find" }}
          />
        </div>
      ) : (
        <section className="mt-8">
          <SectionHeader title="Starred" className="mb-4" />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {favorites.map((e) => (
              <PosterCard key={e.mediaId} media={e} variant="compact" />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
