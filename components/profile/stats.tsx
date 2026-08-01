"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  XAxis,
} from "recharts";

import { SectionHeader } from "@/components/klyvi/section-header";
import { useProfile } from "@/components/profile/profile-shell";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  MOCK_COUNTRY_DIST,
  MOCK_FORMAT_DIST,
  MOCK_GENRES,
  MOCK_KPIS,
  MOCK_RELEASE_YEARS,
  MOCK_SCORE_DIST,
  MOCK_WATCH_YEARS,
  SAMPLE_NOTE,
} from "@/lib/mock-stats";
import { STATUS_LABELS, type TrackingStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type Measure = "titles" | "hours";

const MEASURE_LABEL: Record<Measure, string> = {
  titles: "Titles",
  hours: "Hours",
};

/** The pill toggle every chart header carries, AniList-style. */
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

/**
 * The full AniList-shape stats tab, rendered from sample data until the
 * backend can compute any of it. Real data appears in exactly one place:
 * the status distribution, which the tracking list already knows.
 */
export function ProfileStats() {
  const data = useProfile();
  const [scoreMeasure, setScoreMeasure] = React.useState<Measure>("titles");
  const [releaseMeasure, setReleaseMeasure] =
    React.useState<Measure>("titles");
  const [watchMeasure, setWatchMeasure] = React.useState<Measure>("titles");
  if (!data) return null;
  const { entries } = data;

  const kpis: { label: string; value: string }[] = [
    { label: "Total films", value: String(MOCK_KPIS.totalFilms) },
    { label: "Total seasons", value: String(MOCK_KPIS.totalSeasons) },
    { label: "Episodes watched", value: String(MOCK_KPIS.episodesWatched) },
    { label: "Days watched", value: MOCK_KPIS.daysWatched.toFixed(1) },
    { label: "Days planned", value: MOCK_KPIS.daysPlanned.toFixed(1) },
    { label: "Mean score", value: MOCK_KPIS.meanScore.toFixed(1) },
    {
      label: "Standard deviation",
      value: MOCK_KPIS.standardDeviation.toFixed(1),
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
      <p className="text-xs text-muted-foreground">{SAMPLE_NOTE}</p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
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

      <section className="mt-12">
        <div className="mb-5 flex items-center justify-between gap-4">
          <SectionHeader title="Score distribution" />
          <MeasureToggle value={scoreMeasure} onChange={setScoreMeasure} />
        </div>
        <ChartContainer
          config={chartConfig}
          className="h-56 w-full rounded-lg bg-card p-4 ring-1 ring-foreground/10"
        >
          <BarChart data={MOCK_SCORE_DIST} margin={{ top: 20 }}>
            <XAxis
              dataKey="band"
              tickLine={false}
              axisLine={false}
              tickMargin={6}
            />
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
        <p className="sr-only">
          Score distribution by band of ten:{" "}
          {MOCK_SCORE_DIST.map(
            (b) => `${b.titles} titles up to ${b.band}`
          ).join(", ")}
          .
        </p>
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-center justify-between gap-4">
          <SectionHeader title="Release year" />
          <MeasureToggle value={releaseMeasure} onChange={setReleaseMeasure} />
        </div>
        <ChartContainer
          config={chartConfig}
          className="h-56 w-full rounded-lg bg-card p-4 ring-1 ring-foreground/10"
        >
          <LineChart data={MOCK_RELEASE_YEARS} margin={{ top: 16, left: 12, right: 12 }}>
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
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-center justify-between gap-4">
          <SectionHeader title="Watch year" />
          <MeasureToggle value={watchMeasure} onChange={setWatchMeasure} />
        </div>
        <ChartContainer
          config={chartConfig}
          className="h-56 w-full rounded-lg bg-card p-4 ring-1 ring-foreground/10"
        >
          <LineChart data={MOCK_WATCH_YEARS} margin={{ top: 16, left: 12, right: 12 }}>
            <CartesianGrid vertical={false} strokeOpacity={0.15} />
            <XAxis
              dataKey="year"
              tickLine={false}
              axisLine={false}
              tickMargin={6}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Line
              dataKey={watchMeasure}
              type="monotone"
              stroke={`var(--color-${watchMeasure})`}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ChartContainer>
      </section>

      <section className="mt-12">
        <SectionHeader title="Genres" className="mb-5" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_GENRES.map((g, i) => (
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
                <div>
                  <p data-numeric className="font-mono text-sm text-foreground">
                    {g.count}
                  </p>
                  <p className="text-xs text-muted-foreground">Count</p>
                </div>
                <div>
                  <p data-numeric className="font-mono text-sm text-foreground">
                    {g.meanScore.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">Mean score</p>
                </div>
                <div>
                  <p data-numeric className="font-mono text-sm text-foreground">
                    {g.hoursWatched}h
                  </p>
                  <p className="text-xs text-muted-foreground">Watched</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-12 grid gap-8 md:grid-cols-3">
        <section>
          <SectionHeader title="Format" className="mb-4" />
          <div className="flex flex-col gap-2">
            {MOCK_FORMAT_DIST.map((f) => (
              <DistributionRow key={f.label} label={f.label} pct={f.pct} />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader title="Status" className="mb-4" />
          <div className="flex flex-col gap-2">
            {statuses.map((s) => {
              const count = entries.filter((e) => e.status === s).length;
              const pct = entries.length
                ? Math.round((count / entries.length) * 100)
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
          <p className="mt-2 text-xs text-muted-foreground">
            Live from your library.
          </p>
        </section>

        <section>
          <SectionHeader title="Country" className="mb-4" />
          <div className="flex flex-col gap-2">
            {MOCK_COUNTRY_DIST.map((c) => (
              <DistributionRow key={c.label} label={c.label} pct={c.pct} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
