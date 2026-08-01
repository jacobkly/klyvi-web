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

/** Scores at or above this stand in for favorites until starring ships. */
const FAVORITE_THRESHOLD = 90;

type State =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; favorites: LibraryEntry[] };

/**
 * Favorites, driven by the real tracking list. The API has no favorites
 * flag yet, so the honest stand-in is the user's own highest-rated titles,
 * and the copy says so.
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
            .filter((e) => (e.score ?? -1) >= FAVORITE_THRESHOLD)
            .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
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
            body={`Rate something ${FAVORITE_THRESHOLD} or higher and it lands here. Starring arrives later.`}
            action={{ label: "Find something to watch", href: "/find" }}
          />
        </div>
      ) : (
        <section className="mt-8">
          <SectionHeader title="Your highest rated" className="mb-4" />
          <p className="mb-4 -mt-2 text-xs text-muted-foreground">
            Titles you rated {FAVORITE_THRESHOLD} or higher stand in for
            favorites until starring ships.
          </p>
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
