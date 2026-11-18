import { PosterCard } from "@/components/klyvi/poster-card";
import { ReasonChips } from "@/components/klyvi/reason-chips";
import { SectionHeader } from "@/components/klyvi/section-header";
import { PosterCardSkeleton } from "@/components/klyvi/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import type { MediaSummary, SimilarTitle } from "@/lib/types";

const GRID =
  "grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6";

/**
 * The poster shelves at the foot of a detail page: its franchise, then
 * similar titles. Either one hides when it has nothing to show, so a
 * standalone film simply ends after the crew. A franchise mixes films and
 * series, so `kinds` labels each card with which it is.
 *
 * Each similar title carries the keyword it shares under its card, one chip
 * and a +N like the onboarding preview's grid. Titles from TMDB's fill have
 * no reasons and show none.
 */
export function DetailShelves({
  related,
  moreLikeThis,
}: {
  related?: { heading: string; items: MediaSummary[]; kinds?: boolean };
  moreLikeThis?: SimilarTitle[];
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
                kind={
                  related.kinds
                    ? m.mediaType === "movie"
                      ? "Film"
                      : "Series"
                    : undefined
                }
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
              <div key={`${m.mediaType}-${m.tmdbId}`}>
                <PosterCard media={m} variant="below" />
                <ReasonChips reasons={m.reasons} max={1} className="mt-1.5" />
              </div>
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
          <PosterCardSkeleton key={i} variant="below" />
        ))}
      </div>
    </section>
  );
}
