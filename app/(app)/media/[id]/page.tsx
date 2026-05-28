import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Star } from 'lucide-react';
import { parasite, sampleReason } from '@/lib/placeholder';
import { tmdb, formatRuntime } from '@/lib/utils';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { BackdropHero } from '@/components/media/backdrop-hero';
import { RatingPill } from '@/components/media/rating-pill';
import { GenreBadgeRow } from '@/components/media/genre-badge-row';
import { CastRow } from '@/components/media/cast-row';
import { FeedRow } from '@/components/media/feed-row';
import { PosterCard } from '@/components/media/poster-card';
import { MediaActions } from '@/components/media/media-actions';
import { WhyThisRec } from '@/components/why-this-rec';

export const dynamic = 'force-static';

export default async function MediaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Single placeholder for beta — every id resolves to Parasite.
  await params;
  const movie = parasite;
  if (!movie) notFound();

  return (
    <article className="pb-16">
      {/* HERO + POSTER */}
      <div className="relative">
        <BackdropHero
          backdropPath={movie.backdrop_path}
          alt={`${movie.title} backdrop`}
          priority
        />

        <div className="px-4 md:px-8 -mt-20 md:-mt-32 relative">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:gap-8">
            <div className="w-40 md:w-56 shrink-0 hairline rounded-xl overflow-hidden shadow-glow">
              <AspectRatio ratio={2 / 3}>
                <Image
                  src={tmdb(movie.poster_path, 'w500')}
                  alt={`${movie.title} poster`}
                  fill
                  sizes="(max-width: 768px) 40vw, 224px"
                  priority
                  className="object-cover"
                />
              </AspectRatio>
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-balance text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight">
                {movie.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
                <span className="tabular-nums">{movie.release_year}</span>
                <span aria-hidden className="text-muted-foreground/40">•</span>
                <span className="tabular-nums">{formatRuntime(movie.runtime)}</span>
                <span aria-hidden className="text-muted-foreground/40">•</span>
                <RatingPill value={movie.rating} />
                <span aria-hidden className="text-muted-foreground/40">•</span>
                <span className="inline-flex items-center gap-1">
                  <Star className="size-3.5 fill-accent text-accent" strokeWidth={0} />
                  <span className="tabular-nums text-foreground">{movie.vote_average.toFixed(1)}</span>
                  <span className="text-muted-foreground"> / 10</span>
                </span>
              </div>

              <div className="mt-4">
                <GenreBadgeRow genres={movie.genres} />
              </div>

              <div className="mt-6 space-y-2">
                <MediaActions title={movie.title} />
                <WhyThisRec reason={sampleReason} inline />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SYNOPSIS */}
      <section className="px-4 md:px-8 mt-12 max-w-prose">
        <h2 className="sr-only">Synopsis</h2>
        <p className="text-base md:text-lg leading-relaxed text-muted-foreground">
          {movie.overview}
        </p>
      </section>

      {/* CAST */}
      <section className="px-4 md:px-8 mt-12">
        <CastRow cast={movie.cast} />
      </section>

      {/* SIMILAR */}
      {movie.similar && movie.similar.length > 0 && (
        <section className="px-4 md:px-8 mt-12">
          <FeedRow heading="More like this">
            {movie.similar.map((m) => (
              <li key={m.id}>
                <PosterCard
                  id={m.id}
                  title={m.title}
                  year={m.release_year}
                  posterPath={m.poster_path}
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
