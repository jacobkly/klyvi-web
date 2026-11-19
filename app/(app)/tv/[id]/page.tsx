import { cache, Suspense } from "react";
import { notFound } from "next/navigation";

import { DetailError } from "@/components/media/detail-states";
import { DetailLayout } from "@/components/media/detail-layout";
import { DetailShelvesSkeleton } from "@/components/media/detail-shelves";
import { WhereToWatch } from "@/components/media/where-to-watch";
import { SeriesActions } from "@/components/media/series-actions";
import {
  SeasonGrid,
  SeriesTrackingProvider,
} from "@/components/media/series-tracking";
import { getFamily, getSimilar, getTvSeries } from "@/lib/api/catalog";
import { byLine, tvFacts, tvStrip } from "@/lib/media-facts";
import type { MediaSummary } from "@/lib/types";
import { titleMetadata } from "@/lib/title-metadata";

import { TvShelves } from "./tv-shelves";

const load = cache(async (id: number) => {
  try {
    return { tv: await getTvSeries(id), failed: false };
  } catch {
    return { tv: null, failed: true };
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { tv } = await load(Number(id));
  if (!tv) return { title: "Klyvi" };
  return titleMetadata({ ...tv, path: `/tv/${tv.tmdbId}` });
}

/**
 * TV series overview: season selector and top cast, never an episode wall
 * (phase2 §8). The season is the trackable unit, so each season card links
 * to its own page where the status control and progress live.
 */
export default async function TvPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tmdbId = Number(id);
  if (!Number.isFinite(tmdbId) || tmdbId <= 0) notFound();

  // The shelves need only the TMDB id, so their requests start with the
  // series. A failure hides a shelf and never the page.
  const family = getFamily("tv", tmdbId).catch(() => []);
  const similar = getSimilar("tv", tmdbId).catch(() => []);

  const { tv: t, failed } = await load(tmdbId);
  if (failed) return <DetailError />;
  // notFound() answers 404 and renders ./not-found.tsx.
  if (!t) notFound();

  const seasons: (MediaSummary & { episodeCount: number })[] = t.seasons.map(
    (s) => ({
      mediaId: 0,
      mediaType: "season",
      tmdbId: t.tmdbId,
      title: t.title,
      posterPath: s.posterPath,
      year: s.year,
      seasonNumber: s.seasonNumber,
      episodeCount: s.episodeCount,
    })
  );

  return (
    <SeriesTrackingProvider tmdbId={t.tmdbId}>
      <DetailLayout
        media={{
          mediaId: 0,
          mediaType: "movie",
          tmdbId: t.tmdbId,
          title: t.title,
          posterPath: t.posterPath,
          year: t.year,
        }}
        trackable={false}
        actions={
          <SeriesActions
            tmdbId={t.tmdbId}
            seasonNumbers={t.seasons.map((s) => s.seasonNumber)}
          />
        }
        backdropPath={t.backdropPath}
        posterPath={t.posterPath}
        title={t.title}
        year={t.year}
        releaseDate={t.firstAirDate}
        certification={t.certification}
        trailerKey={t.trailerKey}
        directorLine={t.creator ? byLine("Created by", [t.creator]) : null}
        tagline={t.tagline}
        overview={t.overview}
        genres={t.genres}
        metadata={tvFacts(t)}
        strip={tvStrip(t)}
        keywords={t.keywords}
        cast={t.cast}
        crew={t.crew}
        shelves={
          <Suspense fallback={<DetailShelvesSkeleton />}>
            <TvShelves family={family} similar={similar} />
          </Suspense>
        }
        watch={<WhereToWatch kind="tv" tmdbId={tmdbId} title={t.title} />}
        extra={<SeasonGrid seasons={seasons} />}
      />
    </SeriesTrackingProvider>
  );
}
