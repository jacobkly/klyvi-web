"use client";

import Link from "next/link";
import * as React from "react";
import { Settings as SettingsIcon } from "lucide-react";

import { PosterCard } from "@/components/klyvi/poster-card";
import { ReasonChips } from "@/components/klyvi/reason-chips";
import { SectionHeader } from "@/components/klyvi/section-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getFeed } from "@/lib/api/reco";
import { listTracking } from "@/lib/api/tracking";
import { getMe } from "@/lib/api/users";
import {
  STATUS_LABELS,
  type LibraryEntry,
  type Reason,
  type Scored,
  type TrackingStatus,
  type UserProfile,
} from "@/lib/types";

type State =
  | { kind: "loading" }
  | { kind: "error" }
  | {
      kind: "ready";
      me: UserProfile | null;
      entries: LibraryEntry[];
      taste: Reason[];
    };

/** Top reasons across the feed, the same snapshot home shows. */
function aggregateReasons(picks: Scored[]): Reason[] {
  const seen = new Map<string, { reason: Reason; count: number }>();
  for (const p of picks) {
    for (const r of p.reasons) {
      if (!r.name) continue;
      const key = `${r.kind}:${r.id}`;
      const cur = seen.get(key);
      if (cur) cur.count++;
      else seen.set(key, { reason: r, count: 1 });
    }
  }
  return [...seen.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((x) => x.reason);
}

/**
 * Profile is who you are and what you have watched; Settings is what you
 * change. Identity from /v1/users/me, numbers from the tracking list, taste
 * chips from the feed's aggregated reasons.
 */
export function ProfileClient() {
  const [state, setState] = React.useState<State>({ kind: "loading" });

  const load = React.useCallback(() => {
    setState({ kind: "loading" });
    Promise.allSettled([getMe(), listTracking(), getFeed()]).then(
      ([me, tracking, feed]) => {
        if (tracking.status === "rejected" && me.status === "rejected") {
          setState({ kind: "error" });
          return;
        }
        setState({
          kind: "ready",
          me: me.status === "fulfilled" ? me.value : null,
          entries: tracking.status === "fulfilled" ? tracking.value : [],
          taste:
            feed.status === "fulfilled" ? aggregateReasons(feed.value) : [],
        });
      }
    );
  }, []);

  React.useEffect(load, [load]);

  if (state.kind === "loading") {
    return (
      <main className="mx-auto w-full max-w-[1100px] px-4 py-8 md:px-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-full" />
          <div>
            <Skeleton className="h-7 w-44 rounded-lg" />
            <Skeleton className="mt-2 h-4 w-32 rounded-lg" />
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      </main>
    );
  }

  if (state.kind === "error") {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-24 text-center md:px-6">
        <p className="text-[15px] font-semibold text-foreground">
          Could not load your profile.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Something went wrong on Klyvi&apos;s end.
        </p>
        <Button className="mt-5" onClick={load}>
          Try again
        </Button>
      </main>
    );
  }

  const { me, entries, taste } = state;
  const rated = entries.filter((e) => e.score != null);
  const mean = rated.length
    ? Math.round(rated.reduce((n, e) => n + (e.score ?? 0), 0) / rated.length)
    : null;

  const stats: { label: string; value: string }[] = [
    { label: "Tracked", value: String(entries.length) },
    { label: "Rated", value: String(rated.length) },
    { label: "Mean score", value: mean != null ? String(mean) : "–" },
    {
      label: "Completed",
      value: String(entries.filter((e) => e.status === "completed").length),
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

  const highlights = [...entries]
    .filter((e) => e.score != null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 8);

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-8 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            {me?.avatarUrl ? <AvatarImage src={me.avatarUrl} alt="" /> : null}
            <AvatarFallback className="text-lg">
              {(me?.username?.charAt(0) ?? "K").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {me?.username ?? "Your profile"}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {me?.bio ?? "Your taste, in one place."}
            </p>
          </div>
        </div>
        <Link
          href="/settings"
          className={
            buttonVariants({ variant: "outline", size: "sm" }) + " gap-2"
          }
        >
          <SettingsIcon aria-hidden="true" data-icon="inline-start" />
          Settings
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-lg bg-card p-4 ring-1 ring-foreground/10"
          >
            <p data-numeric className="font-mono text-2xl text-violet-text">
              {s.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <section className="mt-10">
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
        <SectionHeader
          title="Breakdown"
          action={{ label: "See full stats", href: "/library/stats" }}
          className="mb-4"
        />
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing tracked yet. The breakdown appears with your first entry.
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

      {highlights.length > 0 ? (
        <section className="mt-10">
          <SectionHeader
            title="Highest rated"
            action={{ label: "View library", href: "/library" }}
            className="mb-4"
          />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {highlights.map((e) => (
              <PosterCard key={e.mediaId} media={e} variant="compact" />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
