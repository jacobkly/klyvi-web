import { cache, Suspense } from "react";
import { notFound } from "next/navigation";

import { DetailError } from "@/components/media/detail-states";
import { DetailLayout } from "@/components/media/detail-layout";
import { DetailShelvesSkeleton } from "@/components/media/detail-shelves";
import { WhereToWatch } from "@/components/media/where-to-watch";
import {
  getFamily,
  getMovie,
  getMovieCollection,
  getSimilar,
} from "@/lib/api/catalog";
import { byLine, movieFacts, movieStrip } from "@/lib/media-facts";

import { MovieBand, MovieShelves } from "./movie-shelves";

/** Deduped across generateMetadata and the page render. */
const load = cache(async (id: number) => {
  try {
    return { movie: await getMovie(id), failed: false };
  } catch {
    return { movie: null, failed: true };
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { movie } = await load(Number(id));
  return { title: movie ? `${movie.title} · Klyvi` : "Klyvi" };
}

export default async function MoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tmdbId = Number(id);
  if (!Number.isFinite(tmdbId) || tmdbId <= 0) notFound();

  // Every request needs only the TMDB id, so they start together.
  // Collection, franchise and similar titles are enrichment, not the page:
  // a failure of any still renders the film, and they stream in behind the
  // hero rather than holding it back.
  const collection = getMovieCollection(tmdbId).catch(() => []);
  const family = getFamily("movies", tmdbId).catch(() => []);
  const similar = getSimilar("movies", tmdbId).catch(() => []);

  const { movie: m, failed } = await load(tmdbId);
  if (failed) return <DetailError />;
  // notFound() answers 404 and renders ./not-found.tsx.
  if (!m) notFound();

  return (
    <DetailLayout
      media={{
        mediaId: 0,
        mediaType: "movie",
        tmdbId: m.tmdbId,
        title: m.title,
        posterPath: m.posterPath,
        year: m.year,
      }}
      backdropPath={m.backdropPath}
      posterPath={m.posterPath}
      title={m.title}
      year={m.year}
      releaseDate={m.releaseDate}
      certification={m.certification}
      trailerKey={m.trailerKey}
      directorLine={byLine("Directed by", m.directors, m.writers)}
      tagline={m.tagline}
      overview={m.overview}
      genres={m.genres}
      metadata={movieFacts(m)}
      strip={movieStrip(m)}
      keywords={m.keywords}
      cast={m.cast}
      crew={m.crew}
      watch={<WhereToWatch kind="movies" tmdbId={tmdbId} title={m.title} />}
      extra={
        <Suspense fallback={null}>
          <MovieBand
            name={m.collectionName}
            tmdbId={tmdbId}
            collection={collection}
          />
        </Suspense>
      }
      shelves={
        <Suspense fallback={<DetailShelvesSkeleton />}>
          <MovieShelves
            tmdbId={tmdbId}
            collection={collection}
            family={family}
            similar={similar}
          />
        </Suspense>
      }
    />
  );
}
