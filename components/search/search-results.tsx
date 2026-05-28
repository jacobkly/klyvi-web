'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Clock, Eye, Search as SearchIcon, Sparkles, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { cn, tmdb } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { recentSearches, trendingSearches } from '@/lib/placeholder';
import { search as searchApi } from '@/lib/api/search';
import { recordInteraction } from '@/lib/api/interactions';
import { useAccessToken, useSupabaseUser } from '@/lib/hooks/use-supabase-user';
import { ApiError } from '@/lib/api/client';
import type { TmdbListItem } from '@/lib/api/types';

interface SearchResultsProps {
  variant?: 'page' | 'dialog';
  onSelect?: () => void;
}

function useDebounced<T>(value: T, delayMs: number): T {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return v;
}

function titleOf(item: TmdbListItem): string {
  return item.title ?? item.name ?? 'Untitled';
}

function yearOf(item: TmdbListItem): number | undefined {
  const d = item.release_date ?? item.first_air_date;
  if (!d) return undefined;
  const y = new Date(d).getFullYear();
  return Number.isFinite(y) ? y : undefined;
}

function typeOf(item: TmdbListItem): 'movie' | 'tv' | 'person' {
  if (item.media_type === 'tv' || item.media_type === 'person') return item.media_type;
  if (item.first_air_date && !item.release_date) return 'tv';
  return 'movie';
}

export function SearchResults({ variant = 'page', onSelect }: SearchResultsProps) {
  const router = useRouter();
  const { user, unavailable } = useSupabaseUser();
  const token = useAccessToken();
  const signedIn = !!user && !unavailable;

  const [query, setQuery] = React.useState('');
  const debouncedQuery = useDebounced(query.trim(), 200);
  const [results, setResults] = React.useState<TmdbListItem[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setError(null);
      return;
    }
    let cancelled = false;
    setBusy(true);
    setError(null);
    searchApi(debouncedQuery, { type: 'multi' })
      .then((res) => {
        if (cancelled) return;
        const items = (res.results ?? [])
          .filter((r) => typeOf(r) !== 'person')
          .filter((r) => r.poster_path)
          .slice(0, 12);
        setResults(items);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : 'Search failed.');
        setResults([]);
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  function gotoMedia(item: TmdbListItem) {
    onSelect?.();
    const kind = typeOf(item);
    if (kind === 'tv') {
      // Backend's TV detail uses tmdb id as `id`; first nav lands on
      // /media/[id] for now. (Could route to a TV series page later.)
      router.push(`/media/${item.id}`);
    } else {
      router.push(`/media/${item.id}`);
    }
  }

  async function quickLog(item: TmdbListItem, e: React.MouseEvent | React.KeyboardEvent) {
    e.stopPropagation();
    e.preventDefault();
    const title = titleOf(item);
    if (!signedIn) {
      router.push(`/signin?next=${encodeURIComponent('/search')}`);
      return;
    }
    if (!token) return;
    try {
      await recordInteraction(token, {
        tmdb_id: item.id,
        media_type: typeOf(item) === 'tv' ? 'season' : 'movie',
        kind: 'logged',
        source: 'search',
        season_number: typeOf(item) === 'tv' ? 1 : null,
      });
      toast.success('Logged.', { description: title });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to log.';
      toast.error(msg);
    }
  }

  return (
    <Command
      shouldFilter={false}
      className={cn(
        variant === 'page' &&
          'rounded-2xl border border-white/[0.06] bg-card/40 backdrop-blur-xl shadow-glow'
      )}
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder='Search 50,000 titles — try "Parasite" or "slow-burn"…'
        autoFocus
      />
      <CommandList className="max-h-[68vh]">
        {!debouncedQuery && (
          <>
            {recentSearches.length > 0 && (
              <CommandGroup heading="Recent">
                {recentSearches.map((q) => (
                  <CommandItem key={q} onSelect={() => setQuery(q)} value={`recent-${q}`}>
                    <Clock className="text-muted-foreground" strokeWidth={1.5} />
                    <span>{q}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            <CommandSeparator />

            <CommandGroup heading="Trending">
              {trendingSearches.map((q) => (
                <CommandItem key={q} onSelect={() => setQuery(q)} value={`trending-${q}`}>
                  <TrendingUp className="text-accent" strokeWidth={1.5} />
                  <span>{q}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Trending</span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <div className="px-3 py-6 text-center">
              <div className="mx-auto grid size-10 place-items-center rounded-full bg-card hairline">
                <SearchIcon className="size-4 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Start typing to search movies, shows, or keywords.
              </p>
            </div>
          </>
        )}

        {debouncedQuery && (
          <>
            {busy && (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">Searching…</div>
            )}
            {error && !busy && (
              <div className="px-3 py-6 text-center">
                <p className="text-sm">{error}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Make sure the Klyvi API is running.
                </p>
              </div>
            )}
            {!busy && !error && results.length === 0 && (
              <CommandEmpty>
                <div className="px-3 py-8 text-center">
                  <p className="text-sm">Nothing found for &ldquo;{debouncedQuery}&rdquo;.</p>
                  <p className="text-xs text-muted-foreground mt-1">Try a broader search.</p>
                </div>
              </CommandEmpty>
            )}

            {results.length > 0 && (
              <CommandGroup heading={`${results.length} result${results.length === 1 ? '' : 's'}`}>
                {results.map((m) => {
                  const t = titleOf(m);
                  const y = yearOf(m);
                  const kind = typeOf(m);
                  return (
                    <CommandItem
                      key={`${kind}-${m.id}`}
                      value={`${t} ${y ?? ''}`}
                      onSelect={() => gotoMedia(m)}
                      className="!py-2"
                    >
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-md hairline">
                        {m.poster_path && (
                          <Image
                            src={tmdb(m.poster_path, 'w300')}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-1 text-sm font-medium">{t}</div>
                        <div className="text-xs text-muted-foreground tabular-nums">
                          {y ?? '—'} · {kind === 'tv' ? 'TV' : 'Movie'}
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label={`Quick log ${t}`}
                        onClick={(e) => quickLog(m, e)}
                        className="ml-auto inline-grid place-items-center size-9 rounded-md hairline bg-card/60 text-muted-foreground hover:text-foreground transition-colors duration-instant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-[0.96]"
                      >
                        <Eye className="size-4" strokeWidth={1.5} />
                      </button>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {results.length > 0 && (
              <div className="px-3 py-3 text-xs text-muted-foreground border-t border-white/[0.06] flex items-center gap-2">
                <Sparkles className="size-3 text-accent" strokeWidth={1.5} />
                Tip — press <kbd className="rounded bg-muted/60 px-1 py-0.5 text-[10px] font-medium">↵</kbd> to open the top result.
              </div>
            )}
          </>
        )}
      </CommandList>
    </Command>
  );
}
