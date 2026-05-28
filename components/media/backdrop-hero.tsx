import Image from 'next/image';
import { cn } from '@/lib/utils';
import { tmdb } from '@/lib/utils';

interface BackdropHeroProps {
  backdropPath: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export function BackdropHero({ backdropPath, alt, className, priority }: BackdropHeroProps) {
  return (
    <div
      className={cn(
        'relative w-full h-[280px] md:h-[480px] overflow-hidden',
        className
      )}
    >
      <Image
        src={tmdb(backdropPath, 'original')}
        alt={alt}
        fill
        priority={priority}
        sizes="100vw"
        className="object-cover object-center"
      />
      {/* Bottom fade */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/10"
      />
      {/* Side vignette */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-transparent"
      />
    </div>
  );
}
