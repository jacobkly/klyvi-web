import { cn } from '@/lib/utils';

interface RatingPillProps {
  value: string;
  className?: string;
}

export function RatingPill({ value, className }: RatingPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border border-white/[0.12] bg-card/60 px-1.5 py-0.5 text-xs font-medium uppercase tracking-wider text-muted-foreground',
        className
      )}
    >
      {value}
    </span>
  );
}
