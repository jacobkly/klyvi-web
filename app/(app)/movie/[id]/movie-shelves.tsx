import { CollectionBand } from "@/components/media/collection-band";
import { DetailShelves } from "@/components/media/detail-shelves";
import type { MediaSummary, SimilarTitle } from "@/lib/types";

/**
 * The collection band under the hero: the films of the TMDB collection in
 * release order. A film alone in its collection shows none.
 */
export async function MovieBand({
  name,
  tmdbId,
  collection,
}: {
  name: string | null;
  tmdbId: number;
  collection: Promise<MediaSummary[]>;
}) {
  const films = await collection;
  if (films.length < 2) return null;
  return <CollectionBand name={name} films={films} currentId={tmdbId} />;
}

/**
 * The movie page's franchise and "more like this" shelves. The page starts
 * every request alongside the film and hands the promises here, so this
 * streams in behind the hero instead of holding it back. The franchise
 * leaves out the films the collection band already shows.
 */
export async function MovieShelves({
  tmdbId,
  collection,
  family,
  similar,
}: {
  tmdbId: number;
  collection: Promise<MediaSummary[]>;
  family: Promise<MediaSummary[]>;
  similar: Promise<SimilarTitle[]>;
}) {
  const [inCollection, kin, like] = await Promise.all([collection, family, similar]);
  const shown = new Set(inCollection.map((c) => c.tmdbId));
  const franchise = kin.filter(
    (t) => !(t.mediaType === "movie" && (t.tmdbId === tmdbId || shown.has(t.tmdbId)))
  );

  return (
    <DetailShelves
      related={
        franchise.length > 0
          ? { heading: "From the same franchise", items: franchise, kinds: true }
          : undefined
      }
      moreLikeThis={like}
    />
  );
}
