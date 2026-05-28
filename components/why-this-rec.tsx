'use client';

import * as React from 'react';
import { Info, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import type { RecommendationReason } from '@/src/types/media';

interface WhyThisRecProps {
  reason: RecommendationReason;
  /** When true, render as a button-trigger (inline label). When false, an icon-only trigger (for cards). */
  inline?: boolean;
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

function ReasonContent({ reason }: { reason: RecommendationReason }) {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-1.5">
        <Sparkles className="size-3 text-accent" strokeWidth={1.5} />
        <span className="text-[11px] uppercase tracking-wider text-accent font-medium">
          Paid feature preview
        </span>
      </div>
      <p className="text-sm leading-relaxed text-foreground">
        {reason.headline}
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {reason.matchedKeywords.map((k) => (
          <li
            key={k}
            className="rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-xs"
          >
            {k}
          </li>
        ))}
      </ul>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Match strength</span>
          <span className="font-medium tabular-nums text-celebration">{reason.matchStrength}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-transform duration-hero ease-expo"
            style={{ width: `${reason.matchStrength}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function WhyThisRec({ reason, inline = false, className }: WhyThisRecProps) {
  const isTouch = useIsTouch();

  const Trigger = inline ? (
    <Button
      variant="ghost"
      size="sm"
      className={cn('text-muted-foreground hover:text-foreground -ml-2', className)}
    >
      <Info className="size-3.5" strokeWidth={1.5} />
      Why this rec?
    </Button>
  ) : (
    <button
      type="button"
      aria-label="Why this recommendation?"
      className={cn(
        'inline-grid place-items-center size-9 rounded-full bg-card/80 backdrop-blur-md hairline text-muted-foreground hover:text-foreground transition-colors duration-instant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
    >
      <Info className="size-4" strokeWidth={1.5} />
    </button>
  );

  if (isTouch) {
    return (
      <Popover>
        <PopoverTrigger asChild>{Trigger}</PopoverTrigger>
        <PopoverContent align="start" className="w-80 p-0 overflow-hidden">
          <ReasonContent reason={reason} />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <HoverCard openDelay={300} closeDelay={150}>
      <HoverCardTrigger asChild>{Trigger}</HoverCardTrigger>
      <HoverCardContent align="start" className="w-80 p-0 overflow-hidden">
        <ReasonContent reason={reason} />
      </HoverCardContent>
    </HoverCard>
  );
}
