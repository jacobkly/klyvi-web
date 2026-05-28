'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BookmarkPlus,
  Eye,
  CheckCircle2,
  Pause,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PosterCard } from '@/components/media/poster-card';
import { useAccessToken, useSupabaseUser } from '@/lib/hooks/use-supabase-user';
import { listTracking } from '@/lib/api/tracking';
import { getMovie } from '@/lib/api/movies';
import { ApiError } from '@/lib/api/client';
import type { ApiTrackingEntry, TrackingStatus } from '@/lib/api/types';

interface TabDef {
  value: string;
  label: string;
  statuses: TrackingStatus[];
  emptyIcon: LucideIcon;
  emptyHeadline: string;
  emptyBody: string;
}

const TABS: TabDef[] = [
  {
    value: 'watchlist',
    label: 'Watchlist',
    statuses: ['planning'],
    emptyIcon: BookmarkPlus,
    emptyHeadline: 'Nothing planned yet',
    emptyBody: 'Save things to watch by tapping the bookmark on any title.',
  },
  {
    value: 'watching',
    label: 'Watching',
    statuses: ['watching', 'rewatching'],
    emptyIcon: Eye,
    emptyHeadline: "You're not watching anything",
    emptyBody: "Start a series or movie and we'll keep your place here.",
  },
  {
    value: 'completed',
    label: 'Completed',
    statuses: ['completed'],
    emptyIcon: CheckCircle2,
    emptyHeadline: 'No completed titles yet',
    emptyBody: "Mark something as watched and it'll land here.",
  },
  {
    value: 'dropped',
    label: 'Dropped',
    statuses: ['dropped', 'paused'],
    emptyIcon: Pause,
    emptyHeadline: 'Nothing dropped or paused',
    emptyBody: "Titles you stop watching show up here so they're out of your feed.",
  },
];

function statusBadgeFor(status: TrackingStatus | undefined) {
  switch (status) {
    case 'watching':
      return { label: 'Watching', cn: 'bg-primary/20 text-primary border-primary/30' };
    case 'rewatching':
      return { label: 'Rewatching', cn: 'bg-accent/20 text-accent border-accent/30' };
    case 'completed':
      return { label: 'Completed', cn: 'bg-celebration/20 text-celebration border-celebration/30' };
    case 'paused':
      return { label: 'Paused', cn: 'bg-muted text-muted-foreground border-white/[0.06]' };
    case 'dropped':
      return { label: 'Dropped', cn: 'bg-destructive/15 text-destructive border-destructive/30' };
    case 'planning':
      return { label: 'Planning', cn: 'bg-card text-muted-foreground border-white/[0.06]' };
    default:
      return null;
  }
}

interface ResolvedEntry {
  entry: ApiTrackingEntry;
  tmdbId: number;
  title: string;
  year?: number;
  posterPath: string;
  voteAverage?: number;
}

async function resolveEntry(entry: ApiTrackingEntry): Promise<ResolvedEntry | null> {
  // /v1/tracking returns internal media_id only. Resolve display data via the
  // movies cache. Tracking API works for both movies and seasons; for seasons
  // we'd need to join differently. For beta we resolve movies and fall back
  // to a placeholder for seasons.
  if (entry.media_type === 'movie') {
    const movie = await getMovie(entry.media_id, { idType: 'media' }).catch(() => null);
    if (!movie) return null;
    return {
      entry,
      tmdbId: movie.movie_id,
      title: movie.title ?? movie.original_title ?? 'Untitled',
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : undefined,
      posterPath: movie.poster_path ?? '',
      voteAverage: movie.vote_average,
    };
  }
  return {
    entry,
    tmdbId: entry.media_id,
    title: 'TV Season',
    posterPath: '',
  };
}

export function LibraryGrid() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, unavailable } = useSupabaseUser();
  const token = useAccessToken();
  const tabFromUrl = params.get('tab') ?? 'watchlist';
  const current = TABS.find((t) => t.value === tabFromUrl) ? tabFromUrl : 'watchlist';

  const [entries, setEntries] = React.useState<ResolvedEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (unavailable) {
      setLoading(false);
      return;
    }
    if (!token) {
      // Middleware should have already redirected to /signin, but render
      // an inline state in case it didn't.
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    listTracking(token)
      .then(async (rows) => {
        const resolved = await Promise.all(rows.map((r) => resolveEntry(r)));
        if (cancelled) return;
        setEntries(resolved.filter((r): r is ResolvedEntry => r !== null));
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : 'Failed to load library.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, unavailable]);

  function setTab(v: string) {
    const sp = new URLSearchParams(params);
    sp.set('tab', v);
    router.replace(`/library?${sp.toString()}`, { scroll: false });
  }

  const totals = React.useMemo(() => {
    const out: Record<string, number> = {};
    TABS.forEach((t) => {
      out[t.value] = entries.filter((r) => t.statuses.includes(r.entry.status)).length;
    });
    return out;
  }, [entries]);

  if (unavailable) {
    return (
      <div className="mt-6 rounded-xl hairline bg-card/40 p-6 flex items-start gap-3">
        <AlertTriangle className="size-4 mt-0.5 text-destructive" strokeWidth={2} />
        <div className="text-sm">
          <div className="font-medium">Sign-in not configured</div>
          <div className="text-muted-foreground mt-1">
            Add Supabase env vars to enable accounts and load your library.
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mt-6 rounded-xl hairline bg-card/40 p-6 text-center">
        <p className="text-sm text-muted-foreground">Sign in to see your library.</p>
        <Button asChild className="mt-4" size="sm">
          <Link href="/signin?next=/library">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <Tabs value={current} onValueChange={setTab} className="mt-6">
      <TabsList className="w-full md:w-auto overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <TabsTrigger key={t.value} value={t.value} className="whitespace-nowrap">
            {t.label}
            <span className="ml-2 rounded-full bg-background/40 px-1.5 py-0.5 text-[10px] tabular-nums">
              {totals[t.value]}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      {TABS.map((t) => {
        const items = entries.filter((r) => t.statuses.includes(r.entry.status));
        const Icon = t.emptyIcon;
        return (
          <TabsContent key={t.value} value={t.value}>
            {loading ? (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="aspect-[2/3] rounded-xl w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="mt-6 rounded-xl hairline bg-card/40 p-6 flex items-start gap-3">
                <AlertTriangle className="size-4 mt-0.5 text-destructive" strokeWidth={2} />
                <div className="text-sm">
                  <div className="font-medium">Couldn&apos;t load library</div>
                  <div className="text-muted-foreground mt-1">{error}</div>
                </div>
              </div>
            ) : items.length === 0 ? (
              <div className="mt-6 grid place-items-center rounded-2xl hairline bg-card/30 py-16 px-6 text-center">
                <div className="grid size-12 place-items-center rounded-full bg-card hairline">
                  <Icon className="size-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <h2 className="mt-4 text-lg font-semibold">{t.emptyHeadline}</h2>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t.emptyBody}</p>
                <Button asChild className="mt-6" size="sm">
                  <Link href="/">Browse recommendations</Link>
                </Button>
              </div>
            ) : (
              <ul className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {items.map((r) => {
                  const badge = statusBadgeFor(r.entry.status);
                  return (
                    <li key={r.entry.id}>
                      <PosterCard
                        id={r.tmdbId}
                        title={r.title}
                        year={r.year}
                        posterPath={r.posterPath}
                        voteAverage={r.voteAverage}
                        fill
                        badgeSlot={
                          badge && (
                            <span
                              className={`inline-flex items-center rounded-full border backdrop-blur-md px-2 py-0.5 text-[10px] font-medium ${badge.cn}`}
                            >
                              {badge.label}
                            </span>
                          )
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
