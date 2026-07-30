import { DetailLayout } from "@/components/media/detail-layout";
import {
  MOCK_MOVIE,
  formatDate,
  formatRuntime,
} from "@/lib/mock-media";

export async function generateMetadata() {
  return { title: `${MOCK_MOVIE.title} · Klyvi` };
}

/** Movie detail. Serves the mock payload for any id until the API client lands. */
export default async function MoviePage() {
  const m = MOCK_MOVIE;

  return (
    <DetailLayout
      media={{
        mediaId: -1,
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
    />
  );
}
