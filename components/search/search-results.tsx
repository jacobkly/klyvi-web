'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
import { Button } from '@/components/ui/button';
import { allMovies, recentSearches, trendingSearches } from '@/lib/placeholder';

interface SearchResultsProps {
  /** When true, render in a compact dialog layout (no surrounding margins). */
  variant?: 'page' | 'dialog';
  /** Called when the user navigates to a result, for closing the dialog. */
  onSelect?: () => void;
}

export function SearchResults({ variant = 'page', onSelect }: SearchResultsProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');

  const trimmed = query.trim().toLowerCase();

  const liveResults = React.useMemo(() => {
    if (!trimmed) return [];
    return allMovies
      .filter((m) =>
        [m.title, ...(m.keywords ?? []).map((k) => k.name)]
          .filter(Boolean)
          .some((s) => String(s).toLowerCase().includes(trimmed))
      )
      .slice(0, 8);
  }, [trimmed]);

  function gotoMedia(id: number) {
    onSelect?.();
    router.push(`/media/${id}`);
  }

  function quickLog(title: string, e: React.MouseEvent | React.KeyboardEvent) {
    e.stopPropagation();
    e.preventDefault();
    toast.success('Logged.', { description: title });
  }

  return (
    <Command
      shouldFilter={false}
      className={cn(
        variant === 'page' && 'rounded-2xl border border-white/[0.06] bg-card/40 backdrop-blur-xl shadow-glow'
      )}
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search 50,000 titles — try “Parasite” or “slow-burn”…"
        autoFocus
      />
      <CommandList className="max-h-[68vh]">
        {!trimmed && (
          <>
            {recentSearches.length > 0 && (
              <CommandGroup heading="Recent">
                {recentSearches.map((q) => (
                  <CommandItem
                    key={q}
                    onSelect={() => setQuery(q)}
                    value={`recent-${q}`}
                  >
                    <Clock className="text-muted-foreground" strokeWidth={1.5} />
                    <span>{q}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            <CommandSeparator />

            <CommandGroup heading="Trending">
              {trendingSearches.map((q) => (
                <CommandItem
                  key={q}
                  onSelect={() => setQuery(q)}
                  value={`trending-${q}`}
                >
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

        {trimmed && (
          <>
            <CommandEmpty>
              <div className="px-3 py-8 text-center">
                <p className="text-sm">Nothing found for &ldquo;{query}&rdquo;.</p>
                <p className="text-xs text-muted-foreground mt-1">Try a broader search.</p>
              </div>
            </CommandEmpty>

            {liveResults.length > 0 && (
              <CommandGroup heading={`${liveResults.length} result${liveResults.length === 1 ? '' : 's'}`}>
                {liveResults.map((m) => (
                  <CommandItem
                    key={m.id}
                    value={`${m.title} ${m.release_year}`}
                    onSelect={() => gotoMedia(m.id)}
                    className="!py-2"
                  >
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-md hairline">
                      <Image
                        src={tmdb(m.poster_path, 'w300')}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-1 text-sm font-medium">{m.title}</div>
                      <div className="text-xs text-muted-foreground tabular-nums">
                        {m.release_year} · {m.genres.slice(0, 2).map((g) => g.name).join(', ')}
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={`Quick log ${m.title}`}
                      onClick={(e) => quickLog(m.title, e)}
                      className="ml-auto inline-grid place-items-center size-9 rounded-md hairline bg-card/60 text-muted-foreground hover:text-foreground transition-colors duration-instant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-[0.96]"
                    >
                      <Eye className="size-4" strokeWidth={1.5} />
                    </button>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {liveResults.length > 0 && (
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
