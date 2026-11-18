import { Skeleton } from "@/components/ui/skeleton";

/**
 * Stands in for a PosterCard while it loads, at the same size, so nothing
 * jumps when the real card lands. `below` adds the title and year lines,
 * `compact` and `overlay` are artwork only.
 */
export function PosterCardSkeleton({
  variant,
  className,
}: {
  variant: "overlay" | "below" | "compact";
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={className}>
      <Skeleton className="aspect-[2/3] w-full rounded-art" />
      {variant === "below" ? (
        <>
          <Skeleton className="mt-1.5 h-3 w-3/4 rounded-lg" />
          <Skeleton className="mt-1 h-3 w-1/3 rounded-lg" />
        </>
      ) : null}
    </div>
  );
}
