'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { cn, tmdb } from '@/lib/utils';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface PosterCardProps {
  id: number;
  title: string;
  year?: number;
  posterPath: string;
  voteAverage?: number;
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Top-right action slot (e.g. info or log button) */
  badgeSlot?: React.ReactNode;
  /** If true, the card stretches to fill its parent width. */
  fill?: boolean;
}

const SIZE_PX: Record<NonNullable<PosterCardProps['size']>, string> = {
  sm: 'w-32 md:w-36',
  md: 'w-40 md:w-44',
  lg: 'w-44 md:w-52',
};

export const PosterCard = React.forwardRef<HTMLAnchorElement, PosterCardProps>(
  ({ id, title, year, posterPath, voteAverage, href, size = 'md', className, badgeSlot, fill }, ref) => {
    const linkHref = href ?? `/media/${id}`;
    const width = fill ? 'w-full' : SIZE_PX[size];
    return (
      <Link
        ref={ref}
        href={linkHref}
        className={cn(
          'group relative block shrink-0 snap-start',
          width,
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl',
          className
        )}
      >
        <div className="relative overflow-hidden rounded-xl hairline transition-transform duration-base ease-out motion-safe:group-hover:scale-[1.02] motion-safe:group-focus-visible:scale-[1.02] motion-safe:group-hover:shadow-glow">
          <AspectRatio ratio={2 / 3}>
            <Image
              src={tmdb(posterPath, 'w500')}
              alt={`${title} poster`}
              fill
              sizes={fill ? '50vw' : '(max-width: 768px) 40vw, 220px'}
              className="object-cover"
            />
            {/* Subtle bottom gradient for text legibility if overlaid */}
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent opacity-0 motion-safe:transition-opacity motion-safe:group-hover:opacity-100" />
          </AspectRatio>
          {badgeSlot && (
            <div className="absolute right-2 top-2 z-10">
              {badgeSlot}
            </div>
          )}
          {typeof voteAverage === 'number' && voteAverage > 0 && (
            <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/70 backdrop-blur-md px-2 py-0.5 text-xs font-medium">
              <Star className="size-3 fill-accent text-accent" strokeWidth={0} />
              <span className="tabular-nums">{voteAverage.toFixed(1)}</span>
            </div>
          )}
        </div>
        <div className="mt-2 px-0.5">
          <div className="line-clamp-1 text-sm font-medium text-foreground/95">{title}</div>
          {year && (
            <div className="mt-0.5 text-xs text-muted-foreground tabular-nums">{year}</div>
          )}
        </div>
      </Link>
    );
  }
);
PosterCard.displayName = 'PosterCard';
