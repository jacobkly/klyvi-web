import Link from 'next/link';
import { cn } from '@/lib/utils';

interface FeedRowProps {
  heading: string;
  subheading?: string;
  viewAllHref?: string;
  children: React.ReactNode;
  className?: string;
}

export function FeedRow({ heading, subheading, viewAllHref, children, className }: FeedRowProps) {
  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">{heading}</h2>
          {subheading && (
            <p className="mt-1 text-sm text-muted-foreground">{subheading}</p>
          )}
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-instant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-1"
          >
            View all →
          </Link>
        )}
      </div>
      <ul className="flex gap-3 md:gap-4 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory">
        {children}
      </ul>
    </section>
  );
}
