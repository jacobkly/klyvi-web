"use client";

import * as React from "react";

import { ActivityHeatmap } from "@/components/profile/activity-heatmap";
import { useProfile } from "@/components/profile/profile-shell";
import { PosterCard } from "@/components/klyvi/poster-card";
import { ReasonChips } from "@/components/klyvi/reason-chips";
import { SectionHeader } from "@/components/klyvi/section-header";
import {
  STATUS_LABELS,
  type LibraryEntry,
  type TrackingStatus,
} from "@/lib/types";

/** "Completed Dune: Part Two", "Rated Parasite 94". */
function activityLine(e: LibraryEntry): string {
  if (e.score != null) return `Rated ${e.title} ${e.score}`;
  return `${STATUS_LABELS[e.status]}: ${e.title}`;
}

function relativeTime(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const days = Math.floor((Date.now() - t) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "a month ago" : `${months} months ago`;
}

export function ProfileOverview() {
  const data = useProfile();
  if (!data) return null;
  const { entries, taste, stats } = data;

  const rated = entries.filter((e) => e.score != null);
  const mean = rated.length
    ? Math.round(rated.reduce((n, e) => n + (e.score ?? 0), 0) / rated.length)
    : null;

  const kpis: { label: string; value: string }[] = [
    { label: "Tracked", value: String(entries.length) },
    { label: "Rated", value: String(rated.length) },
    { label: "Mean score", value: mean != null ? String(mean) : "–" },
    {
      label: "Completed",
      value: String(entries.filter((e) => e.status === "completed").length),
    },
    {
      label: "Days watched",
      value: stats ? stats.kpis.daysWatched.toFixed(1) : "–",
    },
    {
      label: "Days planned",
      value: stats ? stats.kpis.daysPlanned.toFixed(1) : "–",
    },
  ];

  const statuses: TrackingStatus[] = [
    "watching",
    "rewatching",
    "paused",
    "completed",
    "planning",
    "dropped",
  ];

  const highlights = [...rated]
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 8);

  const activity = [...entries]
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, 8);

  const topGenres = stats?.genres.slice(0, 5) ?? [];
  const maxGenre = Math.max(1, ...topGenres.map((g) => g.count));

  return (
    <div className="grid gap-x-10 gap-y-10 py-8 lg:grid-cols-[1fr_360px]">
      <div className="min-w-0">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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

        {stats && stats.activity.length > 0 ? (
          <section className="mt-10">
            <SectionHeader title="Activity" className="mb-4" />
            <ActivityHeatmap activity={stats.activity} />
          </section>
        ) : null}

        {topGenres.length > 0 ? (
          <section className="mt-10">
            <SectionHeader
              title="Genre overview"
              action={{ label: "Full stats", href: "/profile/stats" }}
              className="mb-4"
            />
            <div className="flex flex-col gap-2">
              {topGenres.map((g) => (
                <div key={g.name} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-sm text-muted-foreground">
                    {g.name}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-chart-3"
                      style={{ width: `${(g.count / maxGenre) * 100}%` }}
                      aria-hidden="true"
                    />
                  </div>
                  <span
                    data-numeric
                    className="w-8 shrink-0 text-right font-mono text-xs text-muted-foreground"
                  >
                    {g.count}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {highlights.length > 0 ? (
          <section className="mt-10">
            <SectionHeader
              title="Highest rated"
              action={{ label: "View library", href: "/library" }}
              className="mb-4"
            />
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {highlights.map((e) => (
                <PosterCard key={e.mediaId} media={e} variant="compact" />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <aside className="min-w-0">
        <section>
          <SectionHeader title="Your taste" className="mb-4" />
          {taste.length > 0 ? (
            <>
              <ReasonChips reasons={taste} max={6} />
              <p className="mt-3 text-xs text-muted-foreground">
                Built from what you rate. It sharpens as you track.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Klyvi cannot describe your taste yet. Rate a few films and the
              picture forms here.
            </p>
          )}
        </section>

        <section className="mt-10">
          <SectionHeader title="Breakdown" className="mb-4" />
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing tracked yet. The breakdown appears with your first
              entry.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {statuses.map((s) => {
                const count = entries.filter((e) => e.status === s).length;
                const pct = entries.length
                  ? Math.round((count / entries.length) * 100)
                  : 0;
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
                    <span
                      data-numeric
                      className="w-8 shrink-0 text-right font-mono text-xs text-muted-foreground"
                    >
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-10">
          <SectionHeader title="Recent activity" className="mb-4" />
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Track something and it shows up here.
            </p>
          ) : (
            <ol className="flex flex-col gap-2.5">
              {activity.map((e) => (
                <li
                  key={`${e.mediaId}-${e.updatedAt}`}
                  className="flex items-baseline justify-between gap-3"
                >
                  <span className="min-w-0 truncate text-sm text-foreground">
                    {activityLine(e)}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {relativeTime(e.updatedAt)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </aside>
    </div>
  );
}
