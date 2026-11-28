"use client";

import * as React from "react";

import { useSession } from "@/components/auth/auth-provider";
import { getWatched, TRACKING_CHANGED } from "@/lib/api/tracking";
import type { Watched } from "@/lib/types";

const EMPTY: Watched = { movies: new Set(), tv: new Set() };

const WatchedContext = React.createContext<Watched>(EMPTY);

/** What the signed-in user has seen through. Empty signed out, and before
 *  the first answer. */
export function useWatched(): Watched {
  return React.useContext(WatchedContext);
}

/** Is this title one the user has seen through? Only films and shows can
 *  be. A season is judged on its own page, not here. */
export function isWatched(
  watched: Watched,
  mediaType: string,
  tmdbId: number
): boolean {
  if (mediaType === "movie") return watched.movies.has(tmdbId);
  if (mediaType === "tv") return watched.tv.has(tmdbId);
  return false;
}

/** How long after a tracking write to ask again, so a run of quick edits
 *  costs one fetch. */
const REFETCH_DELAY_MS = 600;

/**
 * Loads the watched ids once per sign-in, and again after any tracking write
 * in this tab, so a mark turns up as soon as a title is marked completed.
 * Keyed on the user id, not the user object, which a token refresh replaces.
 */
export function WatchedProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
  const userId = user?.id ?? null;
  // Tagged with its owner, so signing out drops the marks without an effect.
  const [owned, setOwned] = React.useState<{
    userId: string;
    watched: Watched;
  } | null>(null);

  React.useEffect(() => {
    if (!userId) return;
    let stale = false;
    let ac: AbortController | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const load = () => {
      ac?.abort();
      ac = new AbortController();
      getWatched(ac.signal)
        .then((watched) => {
          if (!stale) setOwned({ userId, watched });
        })
        .catch(() => {
          // No marks is the fallback, and every list still works.
        });
    };
    const onChange = () => {
      if (timer != null) clearTimeout(timer);
      timer = setTimeout(load, REFETCH_DELAY_MS);
    };

    load();
    window.addEventListener(TRACKING_CHANGED, onChange);
    return () => {
      stale = true;
      ac?.abort();
      if (timer != null) clearTimeout(timer);
      window.removeEventListener(TRACKING_CHANGED, onChange);
    };
  }, [userId]);

  const watched = owned && owned.userId === userId ? owned.watched : EMPTY;
  return (
    <WatchedContext.Provider value={watched}>{children}</WatchedContext.Provider>
  );
}
