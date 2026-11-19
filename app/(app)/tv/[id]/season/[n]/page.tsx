import { cache, Suspense } from "react";
import { notFound } from "next/navigation";

import { DetailError, SeasonNotFound } from "@/components/media/detail-states";
import { DetailLayout } from "@/components/media/detail-layout";
import { DetailShelvesSkeleton } from "@/components/media/detail-shelves";
import { EpisodeList } from "@/components/media/episode-list";
import { SeasonNav } from "@/components/media/season-nav";
import { WhereToWatch } from "@/components/media/where-to-watch";
import { getFamily, getTvSeason, getTvSeries } from "@/lib/api/catalog";
import { seasonFacts } from "@/lib/media-facts";

import { TvShelves } from "../../tv-shelves";

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
  if (!Number.isFinite(tmdbId) || tmdbId <= 0) notFound();
  if (!Number.isFinite(seasonNumber) || seasonNumber < 1) {
    return <SeasonNotFound tmdbId={tmdbId} />;
  }

  // The series' franchise, started alongside the season. A failure hides
  // the shelf and never the page.
  const family = getFamily("tv", tmdbId).catch(() => []);

  const { series, season, failed } = await load(tmdbId, seasonNumber);
  if (failed) return <DetailError />;
  // An unknown series is a 404, rendered by ../../not-found.tsx.
  if (!series) notFound();
  if (!season) return <SeasonNotFound tmdbId={tmdbId} />;

  // A season poster is often missing; the series poster is the fallback so
  // the S-badge still has artwork to sit on.
  const posterPath = season.posterPath ?? series.posterPath;
  const facts = seasonFacts(series, season);
  const episodeCount =
    season.episodeCount ??
    series.seasons.find((s) => s.seasonNumber === seasonNumber)
      ?.episodeCount ??
    null;
  const next =
    series.nextEpisode?.season === seasonNumber
      ? series.nextEpisode.episode
      : null;

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
      releaseDate={season.airDate}
      directorLine={null}
      tagline={null}
      overview={season.overview ?? series.overview}
      genres={series.genres}
      metadata={facts}
      nav={
        <SeasonNav
          tmdbId={series.tmdbId}
          seriesTitle={series.title}
          seasons={series.seasons}
          current={seasonNumber}
        />
      }
      watch={
        <WhereToWatch kind="tv" tmdbId={series.tmdbId} title={series.title} />
      }
      extra={<EpisodeList episodes={season.episodes} next={next} />}
      keywords={series.keywords}
      cast={series.cast}
      shelves={
        <Suspense fallback={<DetailShelvesSkeleton />}>
          <TvShelves family={family} />
        </Suspense>
      }
    />
  );
}
