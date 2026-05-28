import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, tmdb } from '@/lib/utils';
import type { CastMember } from '@/src/types/media';

interface CastRowProps {
  cast: CastMember[];
  heading?: string;
  className?: string;
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function CastRow({ cast, heading = 'Cast', className }: CastRowProps) {
  if (!cast.length) return null;
  return (
    <section className={cn('space-y-4', className)} aria-labelledby="cast-heading">
      <h2 id="cast-heading" className="text-2xl font-semibold tracking-tight">
        {heading}
      </h2>
      <ul className="flex gap-4 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory md:grid md:grid-cols-6 md:gap-4 md:overflow-visible">
        {cast.slice(0, 8).map((person) => (
          <li
            key={person.id}
            className="flex shrink-0 snap-start flex-col items-center text-center w-24 md:w-auto"
          >
            <Avatar className="size-16 md:size-20 hairline">
              {person.profile_path ? (
                <AvatarImage src={tmdb(person.profile_path, 'w300')} alt={person.name} />
              ) : null}
              <AvatarFallback className="text-sm">{initials(person.name)}</AvatarFallback>
            </Avatar>
            <div className="mt-2 min-w-0 w-full">
              <div className="text-sm font-medium leading-tight line-clamp-2">{person.name}</div>
              <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                {person.character}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
