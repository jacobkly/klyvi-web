import { DetailLayout } from "@/components/media/detail-layout";
import { MOCK_TV, formatDate, formatRuntime } from "@/lib/mock-media";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = await params;
  return { title: `${MOCK_TV.title} Season ${n} · Klyvi` };
}

/** Season detail: the real trackable unit for TV. */
export default async function SeasonPage({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = await params;
  const t = MOCK_TV;
  const season =
    t.seasons.find((s) => s.seasonNumber === Number(n)) ?? t.seasons[0];

  return (
    <DetailLayout
      media={{
        mediaId: -1,
        mediaType: "season",
        tmdbId: t.tmdbId,
        title: t.title,
        posterPath: season.posterPath,
        year: season.year,
        seasonNumber: season.seasonNumber,
      }}
      episodeCount={season.episodeCount}
      backdropPath={t.backdropPath}
      posterPath={season.posterPath}
      title={`${t.title} · Season ${season.seasonNumber}`}
      year={season.year}
      directorLine={null}
      tagline={null}
      overview={t.overview}
      genres={t.genres}
      metadata={[
        { label: "Episodes", value: season.episodeCount },
        { label: "Episode runtime", value: formatRuntime(t.episodeRuntime) },
        { label: "First aired", value: formatDate(t.firstAirDate) },
        { label: "Language", value: t.language },
      ]}
      keywords={t.keywords}
      cast={t.cast}
    />
  );
}
