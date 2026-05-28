import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Star, AlertTriangle, ListVideo, Calendar } from 'lucide-react';
import { getTVSeries, getTVTmdbRecommendations } from '@/lib/api/tv';
import { ApiError } from '@/lib/api/client';
import { tmdb } from '@/lib/utils';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { BackdropHero } from '@/components/media/backdrop-hero';
import { GenreBadgeRow } from '@/components/media/genre-badge-row';
import { CastRow } from '@/components/media/cast-row';
import { FeedRow } from '@/components/media/feed-row';
import { PosterCard } from '@/components/media/poster-card';
import type { ApiMovieCastMember, TMDBNameRef } from '@/lib/api/types';
import type { CastMember, Genre } from '@/src/types/media';

function adaptCast(cast: ApiMovieCastMember[] | undefined | null): CastMember[] {
  if (!cast) return [];
  return cast.map((c) => ({
    id: c.id,
    name: c.name,
    character: c.character,
    profile_path: c.profile_path ?? undefined,
    order: c.order,
  }));
}

function adaptGenres(genres: TMDBNameRef[] | null): Genre[] {
  return (genres ?? []).map((g) => ({ id: g.id, name: g.name }));
}

function yearRange(first: string | null, last: string | null): string | null {
  const f = first ? new Date(first).getFullYear() : null;
  const l = last ? new Date(last).getFullYear() : null;
  if (!f) return null;
  if (!l || f === l) return String(f);
  return `${f}–${l}`;
}

export default async function TVDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tmdbId = Number(id);
  if (!Number.isFinite(tmdbId) || tmdbId <= 0) notFound();

  let series;
  try {
    series = await getTVSeries(tmdbId, { type: 'external' });
  } catch (e) {
    return <CatalogUnavailable error={e instanceof ApiError ? e.message : 'Unknown error'} />;
  }
  if (!series) notFound();

  let similar: Array<{
    id: number;
    title: string;
    year?: number;
    poster_path?: string | null;
    vote_average?: number;
  }> = [];
  try {
    const res = await getTVTmdbRecommendations(tmdbId);
    similar = (res.results ?? [])
      .slice(0, 12)
      .filter((r) => r.poster_path)
      .map((r) => ({
        id: r.id,
        title: r.name ?? r.title ?? 'Untitled',
        year: r.first_air_date
          ? new Date(r.first_air_date).getFullYear()
          : r.release_date
            ? new Date(r.release_date).getFullYear()
            : undefined,
        poster_path: r.poster_path,
        vote_average: r.vote_average,
      }));
  } catch {
    // non-blocking
  }

  const title = series.name ?? series.original_name ?? 'Untitled';
  const yr = yearRange(series.first_air_date, series.last_air_date);
  // Seasons array: exclude season 0 (specials) by default unless that's all there is.
  const allSeasons = series.seasons ?? [];
  const watchableSeasons = allSeasons.filter((s) => (s.season_number ?? 0) > 0);
  const seasons = watchableSeasons.length > 0 ? watchableSeasons : allSeasons;

  return (
    <article className="pb-16">
      {/* HERO + POSTER */}
      <div className="relative">
        {series.backdrop_path && (
          <BackdropHero backdropPath={series.backdrop_path} alt={`${title} backdrop`} priority />
        )}

        <div className="px-4 md:px-8 -mt-20 md:-mt-32 relative">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:gap-8">
            <div className="w-40 md:w-56 shrink-0 hairline rounded-xl overflow-hidden shadow-glow">
              <AspectRatio ratio={2 / 3}>
                {series.poster_path ? (
                  <Image
                    src={tmdb(series.poster_path, 'w500')}
                    alt={`${title} poster`}
                    fill
                    sizes="(max-width: 768px) 40vw, 224px"
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

            <div className="flex-1 min-w-0">
              <h1 className="text-balance text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight">
                {title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
                {yr && (
                  <>
                    <Calendar className="size-3.5" strokeWidth={1.5} />
                    <span className="tabular-nums">{yr}</span>
                    <span aria-hidden className="text-muted-foreground/40">•</span>
                  </>
                )}
                {series.number_of_seasons > 0 && (
                  <>
                    <ListVideo className="size-3.5" strokeWidth={1.5} />
                    <span className="tabular-nums">
                      {series.number_of_seasons} season{series.number_of_seasons === 1 ? '' : 's'}
                    </span>
                  </>
                )}
                {series.number_of_episodes > 0 && (
                  <>
                    <span aria-hidden className="text-muted-foreground/40">•</span>
                    <span className="tabular-nums">{series.number_of_episodes} episodes</span>
                  </>
                )}
                {series.vote_average > 0 && (
                  <>
                    <span aria-hidden className="text-muted-foreground/40">•</span>
                    <span className="inline-flex items-center gap-1">
                      <Star className="size-3.5 fill-accent text-accent" strokeWidth={0} />
                      <span className="tabular-nums text-foreground">
                        {series.vote_average.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground"> / 10</span>
                    </span>
                  </>
                )}
              </div>

              {series.genres && series.genres.length > 0 && (
                <div className="mt-4">
                  <GenreBadgeRow genres={adaptGenres(series.genres)} />
                </div>
              )}

              <p className="mt-6 text-xs text-muted-foreground">
                TV is tracked per season — open a season to log it or add it to your watchlist.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SYNOPSIS */}
      {series.overview && (
        <section className="px-4 md:px-8 mt-12 max-w-prose">
          <h2 className="sr-only">Synopsis</h2>
          <p className="text-base md:text-lg leading-relaxed text-muted-foreground">
            {series.overview}
          </p>
        </section>
      )}

      {/* SEASONS */}
      {seasons.length > 0 && (
        <section className="px-4 md:px-8 mt-12">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Seasons</h2>
          <ul className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {seasons.map((s) => (
              <li key={`s-${s.season_number}`}>
                <Link
                  href={`/tv/${tmdbId}/season/${s.season_number}`}
                  className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <div className="overflow-hidden rounded-xl hairline transition-transform duration-base ease-out motion-safe:group-hover:scale-[1.02] motion-safe:group-hover:shadow-glow">
                    <AspectRatio ratio={2 / 3}>
                      {s.poster_path ? (
                        <Image
                          src={tmdb(s.poster_path, 'w500')}
                          alt={`${title} ${s.name ?? `Season ${s.season_number}`} poster`}
                          fill
                          sizes="(max-width: 768px) 50vw, 200px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="size-full bg-muted grid place-items-center text-xs text-muted-foreground">
                          No poster
                        </div>
                      )}
                    </AspectRatio>
                  </div>
                  <div className="mt-2">
                    <div className="line-clamp-1 text-sm font-medium">
                      {s.name ?? `Season ${s.season_number}`}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                      {s.episode_count ? `${s.episode_count} ep` : '—'}
                      {s.air_date && (
                        <>
                          {' · '}
                          {new Date(s.air_date).getFullYear()}
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* CAST */}
      {series.credits?.cast && series.credits.cast.length > 0 && (
        <section className="px-4 md:px-8 mt-12">
          <CastRow cast={adaptCast(series.credits.cast)} />
        </section>
      )}

      {/* SIMILAR */}
      {similar.length > 0 && (
        <section className="px-4 md:px-8 mt-12">
          <FeedRow heading="More like this">
            {similar.map((m) => (
              <li key={m.id}>
                <PosterCard
                  id={m.id}
                  title={m.title}
                  year={m.year}
                  posterPath={m.poster_path ?? ''}
                  voteAverage={m.vote_average}
                  href={`/tv/${m.id}`}
                />
              </li>
            ))}
          </FeedRow>
        </section>
      )}
    </article>
  );
}

function CatalogUnavailable({ error }: { error: string }) {
  return (
    <div className="px-4 md:px-8 py-16">
      <div className="mx-auto max-w-md rounded-xl hairline bg-card/40 p-6 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-card hairline">
          <AlertTriangle className="size-5 text-destructive" strokeWidth={1.5} />
        </div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">Couldn&apos;t load this series</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Make sure the Klyvi API is running locally and reachable at the configured URL.
        </p>
        <div className="mt-6">
          <Link href="/" className="text-sm font-medium text-accent hover:text-foreground">
            Back to home →
          </Link>
        </div>
      </div>
    </div>
  );
}
