import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { getTVSeries, getTVSeason } from '@/lib/api/tv';
import { ApiError } from '@/lib/api/client';
import { SeasonDetail } from '@/components/media/season-detail';
import type { ApiMovieCastMember } from '@/lib/api/types';
import type { CastMember, Season, Series } from '@/src/types/media';

function adaptCast(cast: ApiMovieCastMember[] | undefined | null): CastMember[] {
  if (!cast) return [];
  return cast.map((c) => ({
    id: c.id,
    name: c.name,
    character: c.character,
    profile_path: c.profile_path ?? undefined,
    order: c.order,
  }));
}

export default async function SeasonDetailPage({
  params,
}: {
  params: Promise<{ id: string; season: string }>;
}) {
  const { id, season } = await params;
  const tmdbId = Number(id);
  const seasonNum = Number(season);
  if (!Number.isFinite(tmdbId) || tmdbId <= 0 || !Number.isFinite(seasonNum) || seasonNum < 0) {
    notFound();
  }

  let seriesData;
  let seasonData;
  try {
    [seriesData, seasonData] = await Promise.all([
      getTVSeries(tmdbId, { type: 'external' }),
      getTVSeason(tmdbId, seasonNum, { type: 'external' }),
    ]);
  } catch (e) {
    return <CatalogUnavailable error={e instanceof ApiError ? e.message : 'Unknown error'} />;
  }

  if (!seriesData || !seasonData) notFound();

  // Avg runtime: prefer episode runtimes, fallback to 0.
  const episodes = seasonData.episodes ?? [];
  const runtimes = episodes.map((e) => e.runtime ?? 0).filter((r) => r > 0);
  const avgRuntime = runtimes.length > 0
    ? Math.round(runtimes.reduce((a, b) => a + b, 0) / runtimes.length)
    : 0;

  const series: Series = {
    id: seriesData.tv_id,
    name: seriesData.name ?? seriesData.original_name ?? 'Untitled',
    release_year: seriesData.first_air_date ? new Date(seriesData.first_air_date).getFullYear() : 0,
    overview: seriesData.overview ?? '',
    poster_path: seriesData.poster_path ?? '',
    backdrop_path: seriesData.backdrop_path ?? '',
    rating: 'TV-MA',
    vote_average: seriesData.vote_average,
    vote_count: seriesData.vote_count,
    genres: (seriesData.genres ?? []).map((g) => ({ id: g.id, name: g.name })),
    keywords: (seriesData.keywords ?? []).map((k) => ({ id: k.id, name: k.name })),
    cast: adaptCast(seriesData.credits?.cast),
    seasons: (seriesData.seasons ?? []).map((s) => ({
      id: s.id ?? 0,
      season_number: s.season_number,
      name: s.name ?? `Season ${s.season_number}`,
      episode_count: s.episode_count ?? 0,
      air_date: s.air_date ?? undefined,
      poster_path: s.poster_path ?? '',
    })),
  };

  const adapted: Season = {
    id: tmdbId * 1000 + seasonNum, // stable synthetic id for keys
    season_number: seasonData.season_number,
    name: seasonData.name ?? `Season ${seasonData.season_number}`,
    overview: seasonData.overview ?? '',
    poster_path: seasonData.poster_path ?? seriesData.poster_path ?? '',
    backdrop_path: seriesData.backdrop_path ?? undefined,
    air_date: seasonData.air_date ?? undefined,
    episode_count: episodes.length,
    avg_runtime: avgRuntime,
    series_id: seriesData.tv_id,
    series_name: series.name,
    cast: adaptCast(seriesData.credits?.cast),
    episodes: episodes.map((ep) => ({
      id: ep.id,
      episode_number: ep.episode_number,
      name: ep.name ?? `Episode ${ep.episode_number}`,
      overview: ep.overview ?? '',
      air_date: ep.air_date ?? undefined,
      runtime: ep.runtime ?? 0,
      still_path: ep.still_path ?? undefined,
      vote_average: ep.vote_average,
    })),
  };

  return <SeasonDetail series={series} season={adapted} />;
}

function CatalogUnavailable({ error }: { error: string }) {
  return (
    <div className="px-4 md:px-8 py-16">
      <div className="mx-auto max-w-md rounded-xl hairline bg-card/40 p-6 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-card hairline">
          <AlertTriangle className="size-5 text-destructive" strokeWidth={1.5} />
        </div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">Couldn&apos;t load this season</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Make sure the Klyvi API is running locally and reachable at the configured URL.
        </p>
        <div className="mt-6">
          <Link href="/" className="text-sm font-medium text-accent hover:text-foreground">
            Back to home →
          </Link>
        </div>
      </div>
    </div>
  );
}
