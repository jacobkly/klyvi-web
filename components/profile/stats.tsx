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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
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

export function ProfileStats() {
  const data = useProfile();
  const [scoreMeasure, setScoreMeasure] = React.useState<Measure>("titles");
  const [releaseMeasure, setReleaseMeasure] =
    React.useState<Measure>("titles");
  if (!data) return null;

  const stats = data.stats;
  const rated = data.entries.filter((e) => e.score != null).length;

  // No stats payload (fetch failed), or too little rated history to say
  // anything honest: one empty state, an invitation to rate more.
  if (!stats || rated < 10) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <EmptyState
          icon={BarChart3}
          title="Your stats need more data"
          body="Rate about 10 titles and this page fills in. The more you track, the more it can tell you."
          action={{ label: "Find something to watch", href: "/find" }}
        />
      </div>
    );
  }

  const scoreDist = stats.scoreDistribution.map((b) => ({
    ...b,
    label: bandCeiling(b.band),
  }));

  const kpis: { label: string; value: string }[] = [
    { label: "Total films", value: String(stats.kpis.totalFilms) },
    { label: "Total seasons", value: String(stats.kpis.totalSeasons) },
    { label: "Episodes watched", value: String(stats.kpis.episodesWatched) },
    { label: "Days watched", value: stats.kpis.daysWatched.toFixed(1) },
    { label: "Days planned", value: stats.kpis.daysPlanned.toFixed(1) },
    { label: "Mean score", value: stats.kpis.meanScore.toFixed(1) },
    { label: "Standard deviation", value: stats.kpis.scoreStddev.toFixed(1) },
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

      <StatsSection title="Score distribution">
        <MeasureToggle value={scoreMeasure} onChange={setScoreMeasure} />
        <ChartContainer
          config={chartConfig}
          className="h-56 w-full rounded-lg bg-card p-4 ring-1 ring-foreground/10"
        >
          <BarChart data={scoreDist} margin={{ top: 20 }}>
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={6} />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
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

      {stats.releaseYears.length > 0 ? (
        <StatsSection title="Release year">
          <MeasureToggle value={releaseMeasure} onChange={setReleaseMeasure} />
          <ChartContainer
            config={chartConfig}
            className="h-56 w-full rounded-lg bg-card p-4 ring-1 ring-foreground/10"
          >
            <LineChart data={stats.releaseYears} margin={{ top: 16, left: 12, right: 12 }}>
              <CartesianGrid vertical={false} strokeOpacity={0.15} />
              <XAxis
                dataKey="year"
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                interval="preserveStartEnd"
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Line
                dataKey={releaseMeasure}
                type="monotone"
                stroke={`var(--color-${releaseMeasure})`}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </StatsSection>
      ) : null}

      {stats.watchYears.length > 0 ? (
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
                  <Metric value={g.meanScore.toFixed(1)} label="Mean score" />
                  <Metric value={`${g.hours}h`} label="Watched" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-12 grid gap-8 md:grid-cols-3">
        <section>
          <SectionHeader title="Format" className="mb-4" />
          <Distributions rows={stats.formats} />
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
          <Distributions rows={stats.countries} />
        </section>
      </div>
    </div>
  );
}

function StatsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [head, ...rest] = React.Children.toArray(children);
  return (
    <section className="mt-12">
      <div className="mb-5 flex items-center justify-between gap-4">
        <SectionHeader title={title} />
        {head}
      </div>
      {rest}
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
