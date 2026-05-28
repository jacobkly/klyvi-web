import { notFound } from 'next/navigation';
import { severance, severance_s2 } from '@/lib/placeholder';
import { SeasonDetail } from '@/components/media/season-detail';

export const dynamic = 'force-static';

export default async function SeasonDetailPage({
  params,
}: {
  params: Promise<{ id: string; season: string }>;
}) {
  await params;
  // Placeholder: always show Severance Season 2 for beta.
  const series = severance;
  const season = severance_s2;
  if (!series || !season) notFound();

  return <SeasonDetail series={series} season={season} />;
}
