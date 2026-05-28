import { Sparkles } from 'lucide-react';
import {
  parasite,
  continueWatching,
  becauseYouLikedParasite,
  newToYou,
} from '@/lib/placeholder';
import { AmbientBlobs } from '@/components/motion/ambient-blobs';
import { FeaturedCard } from '@/components/feed/featured-card';
import { FeedRow } from '@/components/media/feed-row';
import { PosterCard } from '@/components/media/poster-card';
import type { MediaCard } from '@/src/types/media';

function getTitle(item: MediaCard) {
  return item.type === 'movie' ? item.title : item.name;
}

export default function HomePage() {
  return (
    <div className="relative pb-16">
      <AmbientBlobs />

      {/* HERO STRIP */}
      <section className="px-4 md:px-8 pt-10 md:pt-16">
        <div className="inline-flex items-center gap-2 rounded-full hairline bg-card/50 px-3 py-1 text-xs uppercase tracking-wider text-accent">
          <Sparkles className="size-3" strokeWidth={1.5} />
          Updated just now
        </div>
        <h1 className="mt-4 text-balance text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight">
          Recommended for you
        </h1>
        <p className="mt-3 max-w-prose text-muted-foreground">
          A feed that gets sharper every time you rate, log, or dismiss. Tap anything to see why it&apos;s here.
        </p>
      </section>

      {/* FEATURED CARD */}
      <section className="px-4 md:px-8 mt-8">
        <FeaturedCard
          item={{
            id: parasite.id,
            title: parasite.title,
            release_year: parasite.release_year,
            poster_path: parasite.poster_path,
            vote_average: parasite.vote_average,
            overview: parasite.overview,
            type: 'movie',
          }}
          backdropPath={parasite.backdrop_path}
        />
      </section>

      {/* CONTINUE WATCHING */}
      {continueWatching.length > 0 && (
        <section className="px-4 md:px-8 mt-12">
          <FeedRow heading="Continue Watching" viewAllHref="/library?tab=watching">
            {continueWatching.map((item, i) => (
              <li key={`cw-${item.id}-${i}`} className="motion-safe:animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <PosterCard
                  id={item.id}
                  title={getTitle(item)}
                  year={item.release_year}
                  posterPath={item.poster_path}
                  voteAverage={item.vote_average}
                  size="md"
                />
              </li>
            ))}
          </FeedRow>
        </section>
      )}

      {/* BECAUSE YOU LIKED PARASITE */}
      <section className="px-4 md:px-8 mt-12">
        <FeedRow
          heading="Because you liked Parasite"
          subheading="Slow-burn thrillers with sharp class dynamics."
        >
          {becauseYouLikedParasite.map((item, i) => (
            <li key={`byl-${item.id}-${i}`} className="motion-safe:animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
              <PosterCard
                id={item.id}
                title={getTitle(item)}
                year={item.release_year}
                posterPath={item.poster_path}
                voteAverage={item.vote_average}
                size="md"
              />
            </li>
          ))}
        </FeedRow>
      </section>

      {/* NEW TO YOU */}
      <section className="px-4 md:px-8 mt-12">
        <FeedRow heading="New to you" subheading="Fresh picks based on your taste profile.">
          {newToYou.map((item, i) => (
            <li key={`new-${item.id}-${i}`} className="motion-safe:animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
              <PosterCard
                id={item.id}
                title={getTitle(item)}
                year={item.release_year}
                posterPath={item.poster_path}
                voteAverage={item.vote_average}
                size="md"
              />
            </li>
          ))}
        </FeedRow>
      </section>
    </div>
  );
}
