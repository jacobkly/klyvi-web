import { cache } from "react";

import {
  DetailError,
  DetailNotFound,
  SeasonNotFound,
} from "@/components/media/detail-states";
import { DetailLayout } from "@/components/media/detail-layout";
import { getTvSeason, getTvSeries } from "@/lib/api/catalog";
import { formatDate } from "@/lib/mock-media";

const load = cache(async (id: number, n: number) => {
  try {
    const [series, season] = await Promise.all([
      getTvSeries(id),
      getTvSeason(id, n),
    ]);
    return { series, season, failed: false };
  } catch {
    return { series: null, season: null, failed: true };
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; n: string }>;
}) {
  const { id, n } = await params;
  const { series } = await load(Number(id), Number(n));
  return {
    title: series ? `${series.title} Season ${n} · Klyvi` : "Klyvi",
  };
}

/** Season detail: the real trackable unit for TV. */
export default async function SeasonPage({
  params,
}: {
  params: Promise<{ id: string; n: string }>;
}) {
  const { id, n } = await params;
  const tmdbId = Number(id);
  const seasonNumber = Number(n);
  if (!Number.isFinite(tmdbId) || tmdbId <= 0) return <DetailNotFound />;
  if (!Number.isFinite(seasonNumber) || seasonNumber < 1) {
    return <SeasonNotFound tmdbId={tmdbId} />;
  }

  const { series, season, failed } = await load(tmdbId, seasonNumber);
  if (failed) return <DetailError />;
  if (!series) return <DetailNotFound />;
  if (!season) return <SeasonNotFound tmdbId={tmdbId} />;

  // A season poster is often missing; the series poster is the fallback so
  // the S-badge still has artwork to sit on.
  const posterPath = season.posterPath ?? series.posterPath;
  const episodeCount =
    season.episodeCount ??
    series.seasons.find((s) => s.seasonNumber === seasonNumber)
      ?.episodeCount ??
    null;

  return (
    <DetailLayout
      media={{
        mediaId: 0,
        mediaType: "season",
        tmdbId: series.tmdbId,
        title: series.title,
        posterPath,
        year: season.year,
        seasonNumber,
      }}
      episodeCount={episodeCount}
      backdropPath={series.backdropPath}
      posterPath={posterPath}
      title={`${series.title} · ${season.name ?? `Season ${seasonNumber}`}`}
      year={season.year}
      directorLine={null}
      tagline={null}
      overview={season.overview ?? series.overview}
      genres={series.genres}
      metadata={[
        { label: "Episodes", value: episodeCount },
        { label: "First aired", value: formatDate(series.firstAirDate) },
        { label: "Language", value: series.language },
        {
          label: "Average score",
          value:
            season.voteAverage != null
              ? Math.round(season.voteAverage * 10)
              : null,
        },
      ]}
      keywords={series.keywords}
      cast={series.cast}
    />
  );
}
