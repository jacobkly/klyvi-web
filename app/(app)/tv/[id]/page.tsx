import { DetailLayout } from "@/components/media/detail-layout";
import { SectionHeader } from "@/components/klyvi/section-header";
import { PosterCard } from "@/components/klyvi/poster-card";
import { MOCK_TV, formatDate, formatRuntime } from "@/lib/mock-media";
import type { MediaSummary } from "@/lib/types";

export async function generateMetadata() {
  return { title: `${MOCK_TV.title} · Klyvi` };
}

/**
 * TV series overview: season selector and top cast, never an episode wall
 * (phase2 §8). The season is the trackable unit, so each season card links to
 * its own page where the status control and progress live.
 */
export default async function TvPage() {
  const t = MOCK_TV;

  const seasons: MediaSummary[] = t.seasons.map((s) => ({
    mediaId: -1,
    mediaType: "season",
    tmdbId: t.tmdbId,
    title: t.title,
    posterPath: s.posterPath,
    year: s.year,
    seasonNumber: s.seasonNumber,
  }));

  return (
    <DetailLayout
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
          value: t.seasons.reduce((n, s) => n + s.episodeCount, 0),
        },
        { label: "Episode runtime", value: formatRuntime(t.episodeRuntime) },
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
        <section className="mb-10">
          <SectionHeader title="Seasons" className="mb-4" />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {seasons.map((s) => (
              <PosterCard
                key={s.seasonNumber}
                media={s}
                variant="below"
              />
            ))}
          </div>
        </section>
      }
    />
  );
}
