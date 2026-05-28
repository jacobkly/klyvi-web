import Image from 'next/image';
import Link from 'next/link';
import { Play, Star } from 'lucide-react';
import { tmdb } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { MediaCard } from '@/src/types/media';

function getTitle(item: MediaCard) {
  return item.type === 'movie' ? item.title : item.name;
}

interface FeaturedCardProps {
  item: MediaCard;
  /** Use TMDB backdrop_path if you have it. For beta we synthesize using the
   * poster (TMDB CDN serves the same paths regardless of size). */
  backdropPath?: string;
}

export function FeaturedCard({ item, backdropPath }: FeaturedCardProps) {
  const title = getTitle(item);
  const linkHref = item.type === 'tv' ? `/tv/${item.id}` : `/media/${item.id}`;
  const heroPath = backdropPath ?? item.poster_path;

  return (
    <Link
      href={linkHref}
      className="group relative block overflow-hidden rounded-2xl hairline shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="relative aspect-[16/9] w-full md:aspect-[21/9]">
        <Image
          src={tmdb(heroPath, 'original')}
          alt={`${title} hero image`}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center motion-safe:transition-transform motion-safe:duration-hero motion-safe:group-hover:scale-[1.02]"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        <div className="absolute inset-0 flex items-end p-6 md:p-10">
          <div className="max-w-xl">
            <div className="flex items-center gap-2">
              <Badge variant="accent" className="bg-accent/20 text-accent border-accent/30 backdrop-blur-md">
                Featured
              </Badge>
              {typeof item.vote_average === 'number' && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="size-3 fill-accent text-accent" strokeWidth={0} />
                  <span className="tabular-nums">{item.vote_average.toFixed(1)}</span>
                </span>
              )}
            </div>
            <h2 className="mt-3 text-balance text-3xl md:text-5xl font-semibold tracking-tight">
              {title}
            </h2>
            <p className="mt-3 line-clamp-2 text-sm md:text-base text-muted-foreground max-w-prose">
              {item.overview}
            </p>
            <span className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground motion-safe:transition-transform motion-safe:group-hover:scale-[1.02]">
              <Play className="size-4 fill-current" strokeWidth={0} />
              See details
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
