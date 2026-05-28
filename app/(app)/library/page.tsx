import { Suspense } from 'react';
import { Bookmark } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { LibraryGrid } from '@/components/media/library-grid';

export const metadata = { title: 'Library' };

function LibrarySkeleton() {
  return (
    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-[2/3] rounded-xl w-full" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      ))}
    </div>
  );
}

export default function LibraryPage() {
  return (
    <div className="px-4 md:px-8 pt-10 md:pt-14 pb-16">
      <div className="inline-flex items-center gap-2 rounded-full hairline bg-card/50 px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground">
        <Bookmark className="size-3" strokeWidth={1.5} />
        Library
      </div>
      <h1 className="mt-4 text-balance text-3xl md:text-4xl font-semibold tracking-tight">
        Your library
      </h1>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">
        Everything you&apos;ve saved, started, finished, or set aside — in one place.
      </p>

      <Suspense fallback={<LibrarySkeleton />}>
        <LibraryGrid />
      </Suspense>
    </div>
  );
}
