import { cache, Suspense } from "react";

import { DetailError, DetailNotFound } from "@/components/media/detail-states";
import { DetailLayout } from "@/components/media/detail-layout";
import { DetailShelvesSkeleton } from "@/components/media/detail-shelves";
import {
  getMovie,
  getMovieCollection,
  getMovieRecommendations,
} from "@/lib/api/catalog";
import { formatDate, formatRuntime } from "@/lib/mock-media";

import { MovieShelves } from "./movie-shelves";

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
  if (!Number.isFinite(tmdbId) || tmdbId <= 0) return <DetailNotFound />;

  // All three requests need only the TMDB id, so they start together.
  // Collection and recommendations are enrichment, not the page: a failure
  // of either still renders the film, and they stream in behind the hero
  // rather than holding it back.
  const collection = getMovieCollection(tmdbId).catch(() => []);
  const recommendations = getMovieRecommendations(tmdbId).catch(() => []);

  const { movie: m, failed } = await load(tmdbId);
  if (failed) return <DetailError />;
  if (!m) return <DetailNotFound />;

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
      directorLine={m.director ? `Directed by ${m.director}` : null}
      tagline={m.tagline}
      overview={m.overview}
      genres={m.genres}
      metadata={[
        { label: "Runtime", value: formatRuntime(m.runtime) },
        { label: "Released", value: formatDate(m.releaseDate) },
        { label: "Status", value: m.status },
        { label: "Language", value: m.language },
        { label: "Studio", value: m.studio },
        {
          label: "Average score",
          value: m.voteAverage != null ? Math.round(m.voteAverage * 10) : null,
        },
      ]}
      keywords={m.keywords}
      cast={m.cast}
      crew={m.crew}
      shelves={
        <Suspense fallback={<DetailShelvesSkeleton />}>
          <MovieShelves
            tmdbId={tmdbId}
            collection={collection}
            recommendations={recommendations}
          />
        </Suspense>
      }
    />
  );
}
