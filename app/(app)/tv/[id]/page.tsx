import { cache } from "react";

import { DetailError, DetailNotFound } from "@/components/media/detail-states";
import { DetailLayout } from "@/components/media/detail-layout";
import { PosterCard } from "@/components/klyvi/poster-card";
import { SectionHeader } from "@/components/klyvi/section-header";
import { getTvSeries } from "@/lib/api/catalog";
import { formatDate } from "@/lib/mock-media";
import type { MediaSummary } from "@/lib/types";

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
  return { title: tv ? `${tv.title} · Klyvi` : "Klyvi" };
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
  if (!Number.isFinite(tmdbId) || tmdbId <= 0) return <DetailNotFound />;

  const { tv: t, failed } = await load(tmdbId);
  if (failed) return <DetailError />;
  if (!t) return <DetailNotFound />;

  const seasons: MediaSummary[] = t.seasons.map((s) => ({
    mediaId: 0,
    mediaType: "season",
    tmdbId: t.tmdbId,
    title: t.title,
    posterPath: s.posterPath,
    year: s.year,
    seasonNumber: s.seasonNumber,
  }));

  return (
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
      backdropPath={t.backdropPath}
      posterPath={t.posterPath}
      title={t.title}
      year={t.year}
      directorLine={t.creator ? `Created by ${t.creator}` : null}
      tagline={t.tagline}
      overview={t.overview}
      genres={t.genres}
      metadata={[
        { label: "Seasons", value: t.seasons.length },
        {
          label: "Episodes",
          value: t.seasons.reduce((n, s) => n + s.episodeCount, 0) || null,
        },
        { label: "First aired", value: formatDate(t.firstAirDate) },
        { label: "Last aired", value: formatDate(t.lastAirDate) },
        { label: "Status", value: t.status },
        { label: "Language", value: t.language },
        {
          label: "Average score",
          value: t.voteAverage != null ? Math.round(t.voteAverage * 10) : null,
        },
      ]}
      keywords={t.keywords}
      cast={t.cast}
      extra={
        seasons.length > 0 ? (
          <section className="mb-10">
            <SectionHeader title="Seasons" className="mb-4" />
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {seasons.map((s) => (
                <PosterCard key={s.seasonNumber} media={s} variant="below" />
              ))}
            </div>
          </section>
        ) : undefined
      }
    />
  );
}
