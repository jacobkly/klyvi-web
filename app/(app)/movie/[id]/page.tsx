import { cache } from "react";

import { DetailError, DetailNotFound } from "@/components/media/detail-states";
import { DetailLayout } from "@/components/media/detail-layout";
import {
  getMovie,
  getMovieCollection,
  getMovieRecommendations,
} from "@/lib/api/catalog";
import { formatDate, formatRuntime } from "@/lib/mock-media";

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

  const { movie: m, failed } = await load(tmdbId);
  if (failed) return <DetailError />;
  if (!m) return <DetailNotFound />;

  // Collection and recommendations are enrichment, not the page: a failure of
  // either still renders the film. Fetched together to share the wait.
  const [collection, recommendations] = await Promise.all([
    getMovieCollection(tmdbId).catch(() => []),
    getMovieRecommendations(tmdbId).catch(() => []),
  ]);
  const related = collection.filter((c) => c.tmdbId !== tmdbId);
  const moreLikeThis = recommendations.filter((c) => c.tmdbId !== tmdbId);

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
      related={
        related.length > 0
          ? { heading: "In the same collection", items: related }
          : undefined
      }
      moreLikeThis={moreLikeThis}
    />
  );
}
