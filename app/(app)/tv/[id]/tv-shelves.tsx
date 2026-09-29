import { DetailShelves } from "@/components/media/detail-shelves";
import type { SimilarTitle } from "@/lib/types";

/**
 * The series page's "more like this" shelf. Series have no collections, so
 * this is the movie page's shelves without the first one. The page starts
 * the request alongside the series and hands the promise here, so the shelf
 * streams in behind the hero.
 */
export async function TvShelves({
  similar,
}: {
  similar: Promise<SimilarTitle[]>;
}) {
  return <DetailShelves moreLikeThis={await similar} />;
}
