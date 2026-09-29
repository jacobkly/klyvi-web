import { DetailShelves } from "@/components/media/detail-shelves";
import type { MediaSummary, SimilarTitle } from "@/lib/types";

/**
 * The movie page's collection and "more like this" shelves. The page starts
 * both requests alongside the film and hands the promises here, so this
 * streams in behind the hero instead of holding it back.
 */
export async function MovieShelves({
  tmdbId,
  collection,
  similar,
}: {
  tmdbId: number;
  collection: Promise<MediaSummary[]>;
  similar: Promise<SimilarTitle[]>;
}) {
  const [inCollection, like] = await Promise.all([collection, similar]);
  const related = inCollection.filter((c) => c.tmdbId !== tmdbId);

  return (
    <DetailShelves
      related={
        related.length > 0
          ? { heading: "In the same collection", items: related }
          : undefined
      }
      moreLikeThis={like}
    />
  );
}
