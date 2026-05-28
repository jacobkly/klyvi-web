'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Clock3, ListVideo } from 'lucide-react';
import { toast } from 'sonner';
import { tmdb, formatRuntime } from '@/lib/utils';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { EpisodeRow } from '@/components/media/episode-row';
import { useAccessToken, useSupabaseUser } from '@/lib/hooks/use-supabase-user';
import { recordInteraction } from '@/lib/api/interactions';
import { ApiError } from '@/lib/api/client';
import type { Season, Series } from '@/src/types/media';

interface SeasonDetailProps {
  series: Series;
  season: Season;
}

export function SeasonDetail({ series, season }: SeasonDetailProps) {
  const router = useRouter();
  const { user, unavailable } = useSupabaseUser();
  const token = useAccessToken();
  const signedIn = !!user && !unavailable;

  const initial = React.useMemo(() => {
    const map = new Map<number, boolean>();
    season.episodes.forEach((e) => map.set(e.id, Boolean(e.watched)));
    return map;
  }, [season.episodes]);

  const [watchedMap, setWatchedMap] = React.useState<Map<number, boolean>>(initial);
  const seasonLogged = React.useRef(false);

  const watchedCount = React.useMemo(
    () => Array.from(watchedMap.values()).filter(Boolean).length,
    [watchedMap]
  );
  const total = season.episode_count || season.episodes.length || 0;
  const pct = total > 0 ? Math.round((watchedCount / total) * 100) : 0;

  function toggle(episodeId: number) {
    const wasWatched = Boolean(watchedMap.get(episodeId));
    setWatchedMap((prev) => {
      const next = new Map(prev);
      next.set(episodeId, !wasWatched);
      return next;
    });

    // Fire a `logged` interaction once per session when the user transitions
    // any episode to watched. Subsequent toggles don't re-fire.
    if (!wasWatched && !seasonLogged.current) {
      seasonLogged.current = true;
      if (!signedIn) {
        toast('Sign in to save your progress.', {
          description: 'Your watched marks won\'t persist until you sign in.',
          action: {
            label: 'Sign in',
            onClick: () => router.push(`/signin?next=${encodeURIComponent(window.location.pathname)}`),
          },
        });
        return;
      }
      if (!token) return;
      recordInteraction(token, {
        tmdb_id: series.id,
        media_type: 'season',
        season_number: season.season_number,
        kind: 'logged',
        source: 'detail',
      }).catch((e) => {
        const msg = e instanceof ApiError ? e.message : 'Failed to log.';
        toast.error(msg);
        seasonLogged.current = false; // allow retry
      });
    }
  }

  return (
    <article className="pb-16">
      <div className="px-4 md:px-8 pt-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href={`/tv/${series.id}`}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  <ArrowLeft className="size-3.5" strokeWidth={1.5} />
                  {series.name}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{season.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="px-4 md:px-8 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 md:gap-10 items-start">
          <div className="w-40 md:w-full mx-auto md:mx-0 hairline rounded-xl overflow-hidden shadow-glow">
            <AspectRatio ratio={2 / 3}>
              {season.poster_path ? (
                <Image
                  src={tmdb(season.poster_path, 'w500')}
                  alt={`${season.name} poster`}
                  fill
                  sizes="(max-width: 768px) 40vw, 220px"
                  priority
                  className="object-cover"
                />
              ) : (
                <div className="size-full bg-muted grid place-items-center text-xs text-muted-foreground">
                  No poster
                </div>
              )}
            </AspectRatio>
          </div>

          <div className="min-w-0">
            <div className="text-sm text-muted-foreground">{series.name}</div>
            <h1 className="text-balance text-3xl md:text-5xl font-semibold tracking-tight mt-1">
              {season.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              {season.air_date && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-3.5" strokeWidth={1.5} />
                  <time dateTime={season.air_date} className="tabular-nums">
                    {new Date(season.air_date).getFullYear()}
                  </time>
                </span>
              )}
              {total > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <ListVideo className="size-3.5" strokeWidth={1.5} />
                  <span className="tabular-nums">{total} episodes</span>
                </span>
              )}
              {season.avg_runtime > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="size-3.5" strokeWidth={1.5} />
                  <span className="tabular-nums">avg {formatRuntime(season.avg_runtime)}</span>
                </span>
              )}
              {pct === 100 && total > 0 && <Badge variant="celebration">Completed</Badge>}
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Watched</span>
                <span className="tabular-nums font-medium">
                  {watchedCount} / {total}{' '}
                  <span className="text-muted-foreground">({pct}%)</span>
                </span>
              </div>
              <Progress value={pct} className="mt-2 h-2" />
            </div>

            {season.overview && (
              <p className="mt-6 max-w-prose text-sm md:text-base text-muted-foreground leading-relaxed">
                {season.overview}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Episode list */}
      {season.episodes.length > 0 ? (
        <section className="px-4 md:px-8 mt-12">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Episodes</h2>
          <ul className="mt-6 space-y-3">
            {season.episodes.map((ep) => (
              <EpisodeRow
                key={ep.id}
                episode={ep}
                watched={Boolean(watchedMap.get(ep.id))}
                onToggle={() => toggle(ep.id)}
              />
            ))}
          </ul>
        </section>
      ) : (
        <section className="px-4 md:px-8 mt-12">
          <div className="rounded-xl hairline bg-card/40 p-6 text-sm text-muted-foreground">
            No episodes listed for this season yet.
          </div>
        </section>
      )}
    </article>
  );
}
