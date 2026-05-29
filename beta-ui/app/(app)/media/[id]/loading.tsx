import { Skeleton } from '@/components/ui/skeleton';

export default function MediaDetailLoading() {
  return (
    <div className="pb-16">
      <Skeleton className="h-[280px] md:h-[480px] w-full rounded-none" />
      <div className="px-4 md:px-8 -mt-20 md:-mt-32 relative flex flex-col gap-6 md:flex-row md:items-end md:gap-8">
        <Skeleton className="w-40 md:w-56 aspect-[2/3] rounded-xl" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-10 w-3/4 max-w-md" />
          <Skeleton className="h-4 w-72" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="flex gap-3 pt-4">
            <Skeleton className="h-12 w-24" />
            <Skeleton className="h-12 w-40" />
          </div>
        </div>
      </div>
      <div className="px-4 md:px-8 mt-12 space-y-2 max-w-prose">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="px-4 md:px-8 mt-12 space-y-4">
        <Skeleton className="h-6 w-24" />
        <div className="flex gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 w-24">
              <Skeleton className="size-16 rounded-full" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
