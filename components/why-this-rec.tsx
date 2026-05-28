'use client';

import * as React from 'react';
import { Info, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Reason } from '@/lib/api/types';

interface WhyThisRecProps {
  /** Structured reasons from `/v1/reco/feed`. Empty/null → trigger hidden. */
  reasons: Reason[] | null | undefined;
  /** Optional title of the item — included in the headline copy. */
  title?: string;
  className?: string;
}

function useIsTouch() {
  const [touch, setTouch] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(hover: hover)');
    const update = () => setTouch(!mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);
  return touch;
}

function Content({ reasons, title }: { reasons: Reason[]; title?: string }) {
  const genres = reasons.filter((r) => r.kind === 'genre');
  const keywords = reasons.filter((r) => r.kind === 'keyword');
  const ordered = [...genres, ...keywords];

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-1.5">
        <Sparkles className="size-3 text-accent" strokeWidth={1.5} />
        <span className="text-[11px] uppercase tracking-wider text-accent font-medium">
          Why this is here
        </span>
      </div>
      <p className="text-sm leading-relaxed text-foreground">
        {title ? <>“{title}” matches your taste for:</> : <>Matches your taste for:</>}
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {ordered.map((r) => (
          <li key={`${r.kind}-${r.id}`}>
            <span
              className={cn(
                'inline-flex rounded-full px-2 py-0.5 text-xs',
                r.kind === 'genre'
                  ? 'bg-accent/15 text-accent'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {r.name ?? `${r.kind}:${r.id}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WhyThisRec({ reasons, title, className }: WhyThisRecProps) {
  const isTouch = useIsTouch();

  if (!reasons || reasons.length === 0) return null;

  const Trigger = (
    <button
      type="button"
      aria-label="Why this recommendation?"
      onClick={(e) => {
        // Don't navigate the wrapping Link.
        e.preventDefault();
        e.stopPropagation();
      }}
      className={cn(
        'inline-grid place-items-center size-8 rounded-full bg-card/80 backdrop-blur-md hairline text-muted-foreground hover:text-foreground transition-colors duration-instant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-[0.95]',
        className
      )}
    >
      <Info className="size-3.5" strokeWidth={1.5} />
    </button>
  );

  if (isTouch) {
    return (
      <Popover>
        <PopoverTrigger asChild>{Trigger}</PopoverTrigger>
        <PopoverContent align="start" className="w-80 p-0 overflow-hidden">
          <Content reasons={reasons} title={title} />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <HoverCard openDelay={300} closeDelay={150}>
      <HoverCardTrigger asChild>{Trigger}</HoverCardTrigger>
      <HoverCardContent align="start" className="w-80 p-0 overflow-hidden">
        <Content reasons={reasons} title={title} />
      </HoverCardContent>
    </HoverCard>
  );
}
