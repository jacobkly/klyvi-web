import { DetailShelves } from "@/components/media/detail-shelves";
import type { MediaSummary, SimilarTitle } from "@/lib/types";

/**
 * The series and season pages' franchise and "more like this" shelves. The
 * franchise mixes films and series (Better Call Saul and El Camino for
 * Breaking Bad). The page starts the requests alongside the series and hands
 * the promises here, so the shelves stream in behind the hero.
 */
export async function TvShelves({
  family,
  similar,
}: {
  family: Promise<MediaSummary[]>;
  /** The season page has no "more like this" of its own. */
  similar?: Promise<SimilarTitle[]>;
}) {
  const [kin, like] = await Promise.all([family, similar ?? []]);
  return (
    <DetailShelves
      related={
        kin.length > 0
          ? { heading: "From the same franchise", items: kin, kinds: true }
          : undefined
      }
      moreLikeThis={like}
    />
  );
}
