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
  ChevronDown,
  Bookmark,
  Play,
  Check,
  PauseCircle,
  XCircle,
  RotateCcw,
  Trash2,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PosterCard } from '@/components/media/poster-card';
import { useAccessToken, useSupabaseUser } from '@/lib/hooks/use-supabase-user';
import { listTracking, updateTracking, deleteTracking } from '@/lib/api/tracking';
import { getMovie } from '@/lib/api/movies';
import { ApiError } from '@/lib/api/client';
import { cn } from '@/lib/utils';
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

const STATUS_OPTIONS: Array<{ value: TrackingStatus; label: string; icon: LucideIcon }> = [
  { value: 'planning', label: 'Planning', icon: Bookmark },
  { value: 'watching', label: 'Watching', icon: Play },
  { value: 'completed', label: 'Completed', icon: Check },
  { value: 'rewatching', label: 'Rewatching', icon: RotateCcw },
  { value: 'paused', label: 'Paused', icon: PauseCircle },
  { value: 'dropped', label: 'Dropped', icon: XCircle },
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

interface LibraryCardProps {
  resolved: ResolvedEntry;
  token: string;
  onStatusChange: (mediaId: number, updated: ApiTrackingEntry) => void;
  onRemove: (mediaId: number) => void;
}

function LibraryCard({ resolved, token, onStatusChange, onRemove }: LibraryCardProps) {
  const { entry, tmdbId, title, year, posterPath, voteAverage } = resolved;
  const [pending, setPending] = React.useState<TrackingStatus | 'remove' | null>(null);
  const badge = statusBadgeFor(entry.status);

  async function changeStatus(next: TrackingStatus) {
    if (next === entry.status) return;
    setPending(next);
    try {
      const updated = await updateTracking(token, entry.media_id, { status: next });
      onStatusChange(entry.media_id, updated);
      const label = STATUS_OPTIONS.find((o) => o.value === next)?.label ?? next;
      toast.success(`Moved to ${label}`, { description: title });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to update status.');
    } finally {
      setPending(null);
    }
  }

  async function remove() {
    setPending('remove');
    try {
      await deleteTracking(token, entry.media_id);
      onRemove(entry.media_id);
      toast(`Removed from library`, { description: title });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to remove.');
    } finally {
      setPending(null);
    }
  }

  return (
    <li className="relative">
      <PosterCard
        id={tmdbId}
        title={title}
        year={year}
        posterPath={posterPath}
        voteAverage={voteAverage}
        fill
      />
      {badge && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Change status — currently ${badge.label}`}
              className={cn(
                'absolute top-2 right-2 z-20 inline-flex items-center gap-1 rounded-full border backdrop-blur-md px-2 py-0.5 text-[10px] font-medium transition-colors duration-instant ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-[0.95]',
                badge.cn,
                pending && 'opacity-80'
              )}
            >
              {pending && pending !== 'remove' ? (
                <Loader2 className="size-3 motion-safe:animate-spin" strokeWidth={2} />
              ) : null}
              <span>{pending && pending !== 'remove' ? 'Updating…' : badge.label}</span>
              <ChevronDown className="size-3 opacity-70" strokeWidth={2} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Move to</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {STATUS_OPTIONS.map(({ value, label, icon: Icon }) => {
              const current = value === entry.status;
              return (
                <DropdownMenuItem
                  key={value}
                  disabled={current || !!pending}
                  onSelect={() => changeStatus(value)}
                >
                  <Icon className="size-4" strokeWidth={1.5} />
                  <span>{label}</span>
                  {current && <Check className="ml-auto size-3.5 text-accent" strokeWidth={2} />}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={!!pending}
              onSelect={remove}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              {pending === 'remove' ? (
                <Loader2 className="size-4 motion-safe:animate-spin" strokeWidth={2} />
              ) : (
                <Trash2 className="size-4" strokeWidth={1.5} />
              )}
              <span>Remove from library</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </li>
  );
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
    if (!token) return;
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

  function handleStatusChange(mediaId: number, updated: ApiTrackingEntry) {
    setEntries((prev) =>
      prev.map((r) => (r.entry.media_id === mediaId ? { ...r, entry: updated } : r))
    );
  }

  function handleRemove(mediaId: number) {
    setEntries((prev) => prev.filter((r) => r.entry.media_id !== mediaId));
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
                {items.map((r) => (
                  <LibraryCard
                    key={r.entry.id}
                    resolved={r}
                    token={token!}
                    onStatusChange={handleStatusChange}
                    onRemove={handleRemove}
                  />
                ))}
              </ul>
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
