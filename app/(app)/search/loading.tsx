import { Skeleton } from '@/components/ui/skeleton';

export default function SearchLoading() {
  return (
    <div className="px-4 md:px-8 pt-10 md:pt-14 pb-16">
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-10 w-80 mt-4" />
      <Skeleton className="h-4 w-72 mt-3" />
      <div className="mt-8 max-w-3xl">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
