import { Skeleton } from '@/components/ui/skeleton';

export default function LibraryLoading() {
  return (
    <div className="px-4 md:px-8 pt-10 md:pt-14 pb-16">
      <Skeleton className="h-6 w-24 rounded-full" />
      <Skeleton className="h-10 w-64 mt-4" />
      <Skeleton className="h-4 w-80 mt-3" />
      <div className="mt-8 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-md" />
        ))}
      </div>
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[2/3] rounded-xl w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
