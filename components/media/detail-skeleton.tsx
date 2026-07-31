import { Skeleton } from "@/components/ui/skeleton";

/**
 * Pending state for the server-fetched detail pages (movie, series,
 * season): the backdrop area, poster + control column, and title block, so
 * navigation reads as the page arriving rather than the app stalling.
 */
export function DetailSkeleton() {
  return (
    <main className="mx-auto w-full max-w-[1400px]">
      <div className="px-4 pt-16 md:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
          <div className="w-36 shrink-0 sm:w-44 lg:w-52">
            <Skeleton className="aspect-[2/3] w-full rounded-art" />
            <Skeleton className="mt-3 h-11 w-full rounded-full" />
          </div>
          <div className="min-w-0 flex-1 sm:pt-10 lg:pt-16">
            <Skeleton className="h-9 w-2/3 rounded-lg" />
            <Skeleton className="mt-3 h-4 w-40 rounded-lg" />
            <Skeleton className="mt-6 h-4 w-full max-w-[60ch] rounded-lg" />
            <Skeleton className="mt-2 h-4 w-full max-w-[52ch] rounded-lg" />
            <Skeleton className="mt-2 h-4 w-2/3 max-w-[40ch] rounded-lg" />
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-10 pb-16 lg:flex-row">
          <div className="w-full shrink-0 lg:w-52">
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
          <div className="min-w-0 flex-1">
            <Skeleton className="h-5 w-24 rounded-lg" />
            <div className="mt-4 flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-28 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
