import { Skeleton } from '@/components/ui/skeleton';

export default function AppLoading() {
  return (
    <div className="px-4 md:px-8 py-8 space-y-8">
      <Skeleton className="h-10 w-64" />
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] w-40 shrink-0 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
