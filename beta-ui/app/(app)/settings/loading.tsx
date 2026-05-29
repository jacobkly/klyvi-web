import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsLoading() {
  return (
    <div className="px-4 md:px-8 pt-10 md:pt-14 pb-16 max-w-3xl">
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-10 w-64 mt-4" />
      <Skeleton className="h-4 w-80 mt-3" />
      <div className="mt-10 space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl hairline bg-card/30 p-5">
            <Skeleton className="h-6 w-32" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
