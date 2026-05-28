'use client';

import * as React from 'react';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { cn, tmdb, formatRuntime } from '@/lib/utils';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Checkbox } from '@/components/ui/checkbox';
import type { Episode } from '@/src/types/media';

interface EpisodeRowProps {
  episode: Episode;
  watched: boolean;
  onToggle: () => void;
}

export function EpisodeRow({ episode, watched, onToggle }: EpisodeRowProps) {
  const [rating, setRating] = React.useState<number>(episode.vote_average ? Math.round(episode.vote_average / 2) : 0);
  const [open, setOpen] = React.useState(false);
  const id = `ep-${episode.id}`;

  return (
    <li
      className={cn(
        'group relative grid grid-cols-[auto_120px_1fr_auto] md:grid-cols-[auto_180px_1fr_auto] items-center gap-3 md:gap-4 rounded-xl px-3 py-3 hairline transition-colors duration-instant',
        watched ? 'bg-card/60' : 'bg-card/30 hover:bg-card/50'
      )}
    >
      <div className="text-sm md:text-base font-medium tabular-nums text-muted-foreground w-8 text-center">
        {String(episode.episode_number).padStart(2, '0')}
      </div>

      <div className="overflow-hidden rounded-lg hairline">
        <AspectRatio ratio={16 / 9}>
          {episode.still_path ? (
            <Image
              src={tmdb(episode.still_path, 'w300')}
              alt={`${episode.name} still`}
              fill
              sizes="(max-width: 768px) 30vw, 180px"
              className={cn('object-cover transition-opacity duration-base', watched ? 'opacity-60' : 'opacity-100')}
            />
          ) : (
            <div className="size-full bg-muted/50 grid place-items-center text-xs text-muted-foreground">
              No image
            </div>
          )}
        </AspectRatio>
      </div>

      <div className="min-w-0">
        <label htmlFor={id} className="block min-w-0 cursor-pointer">
          <div className="line-clamp-1 text-sm md:text-base font-medium">{episode.name}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground tabular-nums">
            {episode.air_date && (
              <time dateTime={episode.air_date}>
                {new Date(episode.air_date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </time>
            )}
            <span aria-hidden className="text-muted-foreground/40">•</span>
            <span>{formatRuntime(episode.runtime)}</span>
          </div>
          {episode.overview && (
            <p className="mt-1 line-clamp-1 text-xs md:text-sm text-muted-foreground/80">
              {episode.overview}
            </p>
          )}
        </label>

        {/* Per-episode rating */}
        <div className="mt-2 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`Rate ${n} star${n === 1 ? '' : 's'}`}
              onClick={(e) => {
                e.preventDefault();
                setRating(rating === n ? 0 : n);
                toast(rating === n ? 'Rating cleared' : `Rated ${n} star${n === 1 ? '' : 's'}`, {
                  description: episode.name,
                });
              }}
              onMouseEnter={() => setOpen(true)}
              onMouseLeave={() => setOpen(false)}
              className={cn(
                'p-0.5 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-95',
                n <= rating ? 'text-accent' : 'text-muted-foreground/40 hover:text-muted-foreground'
              )}
            >
              <Star className={cn('size-3.5', n <= rating && 'fill-accent')} strokeWidth={n <= rating ? 0 : 1.5} />
            </button>
          ))}
          {rating > 0 && (
            <span className={cn('ml-1 text-xs tabular-nums text-muted-foreground transition-opacity', open ? 'opacity-100' : 'opacity-70')}>
              {rating}/5
            </span>
          )}
        </div>
      </div>

      <div className="pl-1">
        <Checkbox
          id={id}
          checked={watched}
          onCheckedChange={onToggle}
          aria-label={watched ? `Mark ${episode.name} unwatched` : `Mark ${episode.name} watched`}
          className="size-6"
        />
      </div>
    </li>
  );
}
