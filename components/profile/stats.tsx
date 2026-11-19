"use client";

import * as React from "react";
import { BarChart3 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  XAxis,
} from "recharts";

import { EmptyState } from "@/components/klyvi/empty-state";
import { SectionHeader } from "@/components/klyvi/section-header";
import { useProfile } from "@/components/profile/profile-shell";
import {
  statsProgress,
  statsRemainingText,
} from "@/components/profile/stats-threshold";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  bandRange,
  countryName,
  decadeBuckets,
  formatHours,
  formatLabel,
} from "@/lib/stats-format";
import { STATUS_LABELS, type TrackingStatus, type UserStats } from "@/lib/types";
import { cn } from "@/lib/utils";

type Measure = "titles" | "hours";

const MEASURE_LABEL: Record<Measure, string> = {
  titles: "Titles",
  hours: "Hours",
};

/** The pill toggle chart headers carry, AniList-style. */
function MeasureToggle({
  value,
  onChange,
}: {
  value: Measure;
  onChange: (m: Measure) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Measure"
      className="flex gap-1 rounded-full bg-muted/60 p-1"
    >
      {(Object.keys(MEASURE_LABEL) as Measure[]).map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={value === m}
          onClick={() => onChange(m)}
          className={cn(
            "tap-target rounded-full px-3 py-1 text-xs outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30",
            value === m
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {MEASURE_LABEL[m]}
        </button>
      ))}
    </div>
  );
}

const chartConfig = {
  titles: { label: "Titles", color: "var(--chart-2)" },
  hours: { label: "Hours", color: "var(--chart-1)" },
} satisfies ChartConfig;

function DistributionRow({
  label,
  pct,
  color,
}: {
  label: string;
  pct: number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-sm text-muted-foreground">
        {label}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: color ?? "var(--chart-3)",
          }}
          aria-hidden="true"
        />
      </div>
      <span
        data-numeric
        className="w-10 shrink-0 text-right font-mono text-xs text-muted-foreground"
      >
        {pct}%
      </span>
    </div>
  );
}

/** The band string is "1-10".."91-100"; show its ceiling on the axis. */
function bandCeiling(band: string): string {
  const parts = band.split("-");
  return parts[1] ?? band;
}

/** The page's own outline while the stats call runs (about a second). */
function StatsSkeleton() {
  return (
    <div role="status" aria-label="Loading your stats" className="py-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="mt-12">
          <div className="mb-5 flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-36 rounded-full" />
            <Skeleton className="h-8 w-32 rounded-full" />
          </div>
          <Skeleton data-skeleton="chart" className="h-56 w-full rounded-lg" />
        </div>
      ))}
      <div className="mt-12">
        <Skeleton className="mb-5 h-4 w-24 rounded-full" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
              key={i}
              data-skeleton="genre"
              className="h-[104px] rounded-lg"
            />
          ))}
        </div>
      </div>
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="mb-2 h-4 w-20 rounded-full" />
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="h-4 w-full rounded-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileStats() {
  const data = useProfile();
  const [scoreMeasure, setScoreMeasure] = React.useState<Measure>("titles");
  const [releaseMeasure, setReleaseMeasure] =
    React.useState<Measure>("titles");
  if (!data) return null;

  const stats = data.stats;
  const rated = data.entries.filter((e) => e.score != null).length;
  const progress = statsProgress(data.entries);

  if (stats === undefined) return <StatsSkeleton />;

  // No stats payload (fetch failed), or too little history to say anything
  // honest: one empty state, an invitation to rate or finish more. Overview
  // holds its genre overview back on the same threshold.
  if (!stats || !progress.unlocked) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <EmptyState
          icon={BarChart3}
          title="Your stats need more data"
          body={`${statsRemainingText(progress.remaining)} and this page fills in. The more you track, the more it can tell you.`}
          action={{ label: "Find something to watch", href: "/find" }}
        />
      </div>
    );
  }

  const scoreDist = stats.scoreDistribution.map((b) => ({
    ...b,
    hours: Math.round(b.hours * 10) / 10,
    label: bandCeiling(b.band),
    range: bandRange(b.band),
  }));
  const decades = decadeBuckets(stats.releaseYears);

  const kpis: { label: string; value: string }[] = [
    { label: "Total films", value: String(stats.kpis.totalFilms) },
    { label: "Total seasons", value: String(stats.kpis.totalSeasons) },
    { label: "Episodes watched", value: String(stats.kpis.episodesWatched) },
    { label: "Days watched", value: stats.kpis.daysWatched.toFixed(1) },
    { label: "Days planned", value: stats.kpis.daysPlanned.toFixed(1) },
    // Finished titles with no score count toward the threshold, but nothing
    // gets a score you didn't give, so with no scores there is no mean.
    {
      label: "Mean score",
      value: rated > 0 ? stats.kpis.meanScore.toFixed(1) : "–",
    },
    {
      label: "Standard deviation",
      value: rated > 0 ? stats.kpis.scoreStddev.toFixed(1) : "–",
    },
  ];

  const statuses: TrackingStatus[] = [
    "watching",
    "planning",
    "completed",
    "rewatching",
    "paused",
    "dropped",
  ];

  return (
    <div className="py-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-lg bg-card p-4 ring-1 ring-foreground/10"
          >
            <p data-numeric className="font-mono text-xl text-violet-text">
              {k.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      {rated > 0 ? (
        <StatsSection
          title="Score distribution"
          action={<MeasureToggle value={scoreMeasure} onChange={setScoreMeasure} />}
        >
          <ChartContainer
            config={chartConfig}
            className="h-56 w-full rounded-lg bg-card p-4 ring-1 ring-foreground/10"
          >
            <BarChart data={scoreDist} margin={{ top: 20 }}>
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={6} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) =>
                      `Scores ${payload?.[0]?.payload?.range ?? ""}`
                    }
                  />
                }
              />
              <Bar
                dataKey={scoreMeasure}
                fill={`var(--color-${scoreMeasure})`}
                radius={[3, 3, 0, 0]}
              >
                <LabelList
                  position="top"
                  offset={6}
                  className="fill-muted-foreground"
                  fontSize={10}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </StatsSection>
      ) : null}

      {decades.length > 0 ? (
        <StatsSection
          title="Release decade"
          action={
            <MeasureToggle value={releaseMeasure} onChange={setReleaseMeasure} />
          }
        >
          <ChartContainer
            config={chartConfig}
            className="h-56 w-full rounded-lg bg-card p-4 ring-1 ring-foreground/10"
          >
            <BarChart data={decades} margin={{ top: 20 }}>
              <CartesianGrid vertical={false} strokeOpacity={0.15} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={6} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey={releaseMeasure}
                fill={`var(--color-${releaseMeasure})`}
                radius={[3, 3, 0, 0]}
              >
                <LabelList
                  position="top"
                  offset={6}
                  className="fill-muted-foreground"
                  fontSize={10}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </StatsSection>
      ) : null}

      {/* One year of history is a single dot, not a trend. */}
      {stats.watchYears.length >= 2 ? (
        <StatsSection title="Watch year">
          <ChartContainer
            config={chartConfig}
            className="h-56 w-full rounded-lg bg-card p-4 ring-1 ring-foreground/10"
          >
            <LineChart data={stats.watchYears} margin={{ top: 16, left: 12, right: 12 }}>
              <CartesianGrid vertical={false} strokeOpacity={0.15} />
              <XAxis dataKey="year" tickLine={false} axisLine={false} tickMargin={6} />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Line
                dataKey="titles"
                type="monotone"
                stroke="var(--color-titles)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ChartContainer>
        </StatsSection>
      ) : null}

      {stats.genres.length > 0 ? (
        <section className="mt-12">
          <SectionHeader title="Genres" className="mb-5" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stats.genres.map((g, i) => (
              <div
                key={g.name}
                className="rounded-lg bg-card p-4 ring-1 ring-foreground/10"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[15px] font-semibold text-foreground">
                    {g.name}
                  </p>
                  <span
                    data-numeric
                    className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground"
                  >
                    {i + 1}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Metric value={String(g.count)} label="Count" />
                  <Metric
                    value={rated > 0 ? g.meanScore.toFixed(1) : "–"}
                    label="Mean score"
                  />
                  <Metric value={formatHours(g.hours)} label="Watched" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-12 grid gap-8 md:grid-cols-3">
        <section>
          <SectionHeader title="Format" className="mb-4" />
          <Distributions
            rows={stats.formats.map((r) => ({ ...r, label: formatLabel(r.label) }))}
          />
        </section>

        <section>
          <SectionHeader title="Status" className="mb-4" />
          <div className="flex flex-col gap-2">
            {statuses.map((s) => {
              const count = data.entries.filter((e) => e.status === s).length;
              const pct = data.entries.length
                ? Math.round((count / data.entries.length) * 100)
                : 0;
              return (
                <DistributionRow
                  key={s}
                  label={STATUS_LABELS[s]}
                  pct={pct}
                  color={`var(--status-${s === "rewatching" ? "watching" : s})`}
                />
              );
            })}
          </div>
        </section>

        <section>
          <SectionHeader title="Country" className="mb-4" />
          <Distributions
            rows={stats.countries.map((r) => ({ ...r, label: countryName(r.label) }))}
          />
        </section>
      </div>
    </div>
  );
}

/** A chart section: the title, with an optional control beside it, then
 *  the chart. */
function StatsSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={title} className="mt-12">
      <div className="mb-5 flex min-h-8 items-center justify-between gap-4">
        <SectionHeader title={title} />
        {action}
      </div>
      {children}
    </section>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p data-numeric className="font-mono text-sm text-foreground">
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Distributions({ rows }: { rows: UserStats["formats"] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Not enough data yet.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {rows.map((r) => (
        <DistributionRow key={r.label} label={r.label} pct={r.pct} />
      ))}
    </div>
  );
}
