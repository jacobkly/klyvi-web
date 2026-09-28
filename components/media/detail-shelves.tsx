import { PosterCard } from "@/components/klyvi/poster-card";
import { SectionHeader } from "@/components/klyvi/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import type { MediaSummary } from "@/lib/types";

const GRID =
  "grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6";

/**
 * The poster shelves at the foot of a detail page: the rest of its
 * collection, then similar titles. Either one hides when it has nothing to
 * show, so a standalone film simply ends after the crew.
 */
export function DetailShelves({
  related,
  moreLikeThis,
}: {
  related?: { heading: string; items: MediaSummary[] };
  moreLikeThis?: MediaSummary[];
}) {
  const hasRelated = related != null && related.items.length > 0;
  const hasMore = moreLikeThis != null && moreLikeThis.length > 0;
  if (!hasRelated && !hasMore) return null;

  return (
    <>
      {hasRelated ? (
        <section className="mb-10">
          <SectionHeader title={related.heading} className="mb-4" />
          <div className={GRID}>
            {related.items.map((m) => (
              <PosterCard
                key={`${m.mediaType}-${m.tmdbId}-${m.seasonNumber ?? 0}`}
                media={m}
                variant="below"
              />
            ))}
          </div>
        </section>
      ) : null}

      {hasMore ? (
        <section>
          <SectionHeader title="More like this" className="mb-4" />
          <div className={GRID}>
            {moreLikeThis.slice(0, 12).map((m) => (
              <PosterCard
                key={`${m.mediaType}-${m.tmdbId}`}
                media={m}
                variant="below"
              />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

/** Holds one shelf's worth of space while the shelves stream in, so the page
 *  does not jump when they land below the fold. */
export function DetailShelvesSkeleton() {
  return (
    <section aria-hidden="true">
      <Skeleton className="mb-4 h-5 w-32 rounded-lg" />
      <div className={GRID}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="aspect-[2/3] w-full rounded-art" />
            <Skeleton className="mt-1.5 h-3 w-3/4 rounded-lg" />
          </div>
        ))}
      </div>
    </section>
  );
}
