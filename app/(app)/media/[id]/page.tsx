import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Star, AlertTriangle } from 'lucide-react';
import { getMovie, getMovieTmdbRecommendations } from '@/lib/api/movies';
import { ApiError } from '@/lib/api/client';
import { tmdb, formatRuntime } from '@/lib/utils';
import { sampleReason } from '@/lib/placeholder';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { BackdropHero } from '@/components/media/backdrop-hero';
import { RatingPill } from '@/components/media/rating-pill';
import { GenreBadgeRow } from '@/components/media/genre-badge-row';
import { CastRow } from '@/components/media/cast-row';
import { FeedRow } from '@/components/media/feed-row';
import { PosterCard } from '@/components/media/poster-card';
import { MediaActions } from '@/components/media/media-actions';
import { WhyThisRec } from '@/components/why-this-rec';
import type { ApiMovieCastMember, TMDBNameRef } from '@/lib/api/types';
import type { CastMember, Genre } from '@/src/types/media';

function adaptCast(cast: ApiMovieCastMember[] | undefined): CastMember[] {
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

function ratingFromAdult(adult: boolean): string {
  return adult ? 'R' : 'NR';
}

export default async function MediaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tmdbId = Number(id);
  if (!Number.isFinite(tmdbId) || tmdbId <= 0) notFound();

  let movie;
  try {
    movie = await getMovie(tmdbId, { idType: 'tmdb', revalidate: 3600 });
  } catch (e) {
    // Surface a friendly inline error instead of crashing the route.
    return <CatalogUnavailable error={e instanceof ApiError ? e.message : 'Unknown error'} />;
  }
  if (!movie) notFound();

  // Similar titles via TMDB passthrough — best-effort, never fatal.
  let similar: Array<{
    id: number;
    title: string;
    year?: number;
    poster_path?: string | null;
    vote_average?: number;
  }> = [];
  try {
    const res = await getMovieTmdbRecommendations(tmdbId);
    similar = (res.results ?? [])
      .slice(0, 12)
      .filter((r) => r.poster_path)
      .map((r) => ({
        id: r.id,
        title: r.title ?? r.name ?? 'Untitled',
        year: r.release_date
          ? new Date(r.release_date).getFullYear()
          : r.first_air_date
            ? new Date(r.first_air_date).getFullYear()
            : undefined,
        poster_path: r.poster_path,
        vote_average: r.vote_average,
      }));
  } catch {
    // Silent — non-blocking.
  }

  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : undefined;
  const title = movie.title ?? movie.original_title ?? 'Untitled';

  return (
    <article className="pb-16">
      {/* HERO + POSTER */}
      <div className="relative">
        {movie.backdrop_path && (
          <BackdropHero backdropPath={movie.backdrop_path} alt={`${title} backdrop`} priority />
        )}

        <div className="px-4 md:px-8 -mt-20 md:-mt-32 relative">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:gap-8">
            <div className="w-40 md:w-56 shrink-0 hairline rounded-xl overflow-hidden shadow-glow">
              <AspectRatio ratio={2 / 3}>
                {movie.poster_path ? (
                  <Image
                    src={tmdb(movie.poster_path, 'w500')}
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
                {year && (
                  <>
                    <span className="tabular-nums">{year}</span>
                    <span aria-hidden className="text-muted-foreground/40">•</span>
                  </>
                )}
                {movie.runtime > 0 && (
                  <>
                    <span className="tabular-nums">{formatRuntime(movie.runtime)}</span>
                    <span aria-hidden className="text-muted-foreground/40">•</span>
                  </>
                )}
                <RatingPill value={ratingFromAdult(movie.adult)} />
                {movie.vote_average > 0 && (
                  <>
                    <span aria-hidden className="text-muted-foreground/40">•</span>
                    <span className="inline-flex items-center gap-1">
                      <Star className="size-3.5 fill-accent text-accent" strokeWidth={0} />
                      <span className="tabular-nums text-foreground">
                        {movie.vote_average.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground"> / 10</span>
                    </span>
                  </>
                )}
              </div>

              {movie.genres && movie.genres.length > 0 && (
                <div className="mt-4">
                  <GenreBadgeRow genres={adaptGenres(movie.genres)} />
                </div>
              )}

              <div className="mt-6 space-y-2">
                <MediaActions
                  title={title}
                  tmdbId={tmdbId}
                  mediaType="movie"
                />
                <WhyThisRec reason={sampleReason} inline />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SYNOPSIS */}
      {movie.overview && (
        <section className="px-4 md:px-8 mt-12 max-w-prose">
          <h2 className="sr-only">Synopsis</h2>
          <p className="text-base md:text-lg leading-relaxed text-muted-foreground">
            {movie.overview}
          </p>
        </section>
      )}

      {/* CAST */}
      {movie.credits?.cast && movie.credits.cast.length > 0 && (
        <section className="px-4 md:px-8 mt-12">
          <CastRow cast={adaptCast(movie.credits.cast)} />
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
        <h1 className="mt-4 text-xl font-semibold tracking-tight">Couldn&apos;t load this title</h1>
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
