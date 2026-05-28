import { Skeleton } from '@/components/ui/skeleton';

export default function SeasonLoading() {
  return (
    <div className="px-4 md:px-8 pt-6 pb-16">
      <Skeleton className="h-4 w-40" />
      <div className="mt-6 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 md:gap-10 items-start">
        <Skeleton className="w-40 md:w-full aspect-[2/3] mx-auto md:mx-0 rounded-xl" />
        <div className="space-y-3 min-w-0">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-3/4 max-w-md" />
          <Skeleton className="h-4 w-72" />
          <div className="pt-4">
            <Skeleton className="h-2 w-full max-w-md" />
            <Skeleton className="h-4 w-24 mt-2" />
          </div>
          <Skeleton className="h-4 w-full max-w-prose" />
          <Skeleton className="h-4 w-3/4 max-w-prose" />
        </div>
      </div>
      <div className="mt-12 space-y-3">
        <Skeleton className="h-6 w-32" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
