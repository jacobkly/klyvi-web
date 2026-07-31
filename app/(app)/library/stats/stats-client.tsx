"use client";

import * as React from "react";
import { BarChart3 } from "lucide-react";

import { EmptyState } from "@/components/klyvi/empty-state";
import { SectionHeader } from "@/components/klyvi/section-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listTracking } from "@/lib/api/tracking";
import {
  STATUS_LABELS,
  type LibraryEntry,
  type TrackingStatus,
} from "@/lib/types";

type State =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; entries: LibraryEntry[] };

/**
 * Stats overview, the lean first cut: KPI strip plus CSS-rendered
 * distributions with direct value labels and no y-axis, per the chart chrome
 * spec. The recharts `chart` component installs when per-genre and per-year
 * data lands; these two distributions are computable honestly from the
 * tracking list alone, so nothing here is invented.
 */
export function StatsClient() {
  const [state, setState] = React.useState<State>({ kind: "loading" });

  const load = React.useCallback(() => {
    setState({ kind: "loading" });
    listTracking()
      .then((entries) => setState({ kind: "ready", entries }))
      .catch(() => setState({ kind: "error" }));
  }, []);

  React.useEffect(load, [load]);

  if (state.kind === "loading") {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Your stats</h1>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <Skeleton className="mt-12 h-36 w-full rounded-lg" />
      </main>
    );
  }

  if (state.kind === "error") {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Your stats</h1>
        <div className="py-20 text-center">
          <p className="text-[15px] font-semibold text-foreground">
            Could not load your stats.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Something went wrong on Klyvi&apos;s end.
          </p>
          <Button className="mt-5" onClick={load}>
            Try again
          </Button>
        </div>
      </main>
    );
  }

  const entries = state.entries;
  const rated = entries.filter((e) => e.score != null);

  if (rated.length < 10) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Your stats</h1>
        <EmptyState
          icon={BarChart3}
          title="Your stats need more data"
          body="Rate about 10 titles and this page starts filling in. The more you track, the more it can tell you."
          action={{ label: "Find something to watch", href: "/find" }}
          className="py-20"
        />
      </main>
    );
  }

  const mean =
    rated.reduce((n, e) => n + (e.score ?? 0), 0) / Math.max(1, rated.length);

  const kpis: { label: string; value: string }[] = [
    { label: "Titles tracked", value: String(entries.length) },
    { label: "Titles rated", value: String(rated.length) },
    { label: "Mean score", value: mean.toFixed(0) },
    {
      label: "Completed",
      value: String(entries.filter((e) => e.status === "completed").length),
    },
    {
      label: "In progress",
      value: String(
        entries.filter(
          (e) => e.status === "watching" || e.status === "rewatching"
        ).length
      ),
    },
    {
      label: "Films / TV",
      value: `${entries.filter((e) => e.mediaType === "movie").length} / ${entries.filter((e) => e.mediaType === "season").length}`,
    },
  ];

  // Score distribution in bands of 10.
  const bands = Array.from({ length: 10 }, (_, i) => {
    const lo = i * 10;
    const count = rated.filter(
      (e) => (e.score ?? 0) >= lo && (e.score ?? 0) < lo + 10
    ).length;
    return { label: String(lo + 10), count };
  });
  const maxBand = Math.max(1, ...bands.map((b) => b.count));

  const statuses: TrackingStatus[] = [
    "watching",
    "planning",
    "completed",
    "rewatching",
    "paused",
    "dropped",
  ];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Your stats</h1>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-lg bg-card p-4 ring-1 ring-foreground/10"
          >
            <p data-numeric className="font-mono text-2xl text-violet-text">
              {k.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      <section className="mt-12">
        <SectionHeader title="Score distribution" className="mb-5" />
        <div className="flex h-36 items-end gap-1.5 rounded-lg bg-card p-4 ring-1 ring-foreground/10">
          {bands.map((b) => (
            <div key={b.label} className="flex flex-1 flex-col items-center gap-1">
              <span data-numeric className="font-mono text-[10px] text-muted-foreground">
                {b.count > 0 ? b.count : ""}
              </span>
              <div
                className="w-full rounded-t-sm bg-chart-3"
                style={{
                  height: `${Math.max(3, (b.count / maxBand) * 84)}px`,
                }}
                aria-hidden="true"
              />
              <span data-numeric className="font-mono text-[10px] text-muted-foreground">
                {b.label}
              </span>
            </div>
          ))}
        </div>
        <p className="sr-only">
          Score distribution: {bands.map((b) => `${b.count} titles scored up to ${b.label}`).join(", ")}.
        </p>
      </section>

      <section className="mt-12">
        <SectionHeader title="Status" className="mb-5" />
        <div className="flex flex-col gap-2">
          {statuses.map((s) => {
            const count = entries.filter((e) => e.status === s).length;
            const pct = Math.round((count / entries.length) * 100);
            return (
              <div key={s} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm text-muted-foreground">
                  {STATUS_LABELS[s]}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: `var(--status-${s === "rewatching" ? "watching" : s})`,
                    }}
                    aria-hidden="true"
                  />
                </div>
                <span data-numeric className="w-10 shrink-0 text-right font-mono text-xs text-muted-foreground">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <p className="mt-12 text-xs text-muted-foreground">
        Genre and year breakdowns arrive once the catalog exposes them per
        entry, so nothing here has to be made up.
      </p>
    </main>
  );
}
