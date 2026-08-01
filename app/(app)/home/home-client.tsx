"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowRight, Sparkles, X } from "lucide-react";

import { useSession } from "@/components/auth/auth-provider";
import { PosterCard } from "@/components/klyvi/poster-card";
import { ReasonChips } from "@/components/klyvi/reason-chips";
import { SectionHeader } from "@/components/klyvi/section-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listInteractions } from "@/lib/api/interactions";
import { getFeed } from "@/lib/api/reco";
import { listTracking } from "@/lib/api/tracking";
import { mockFeed } from "@/lib/mock-reco";
import { MOCK_LIBRARY } from "@/lib/mock-library";
import {
  STATUS_VERBS,
  type LibraryEntry,
  type Reason,
  type Scored,
} from "@/lib/types";

const NUDGE_KEY = "klyvi:nudge-dismissed";
const TIER_THRESHOLD = 20;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 18) return "Afternoon";
  return "Evening";
}

/** Top reasons across the whole feed, by frequency: the taste snapshot. */
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
    .slice(0, 5)
    .map((x) => x.reason);
}

type HomeData = {
  picks: Scored[] | null;
  entries: LibraryEntry[] | null;
  ratedCount: number | null;
};

type State =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; data: HomeData };

/**
 * The dashboard (archetype D). Find-next strip owns the top; continue
 * watching second; activity and taste snapshot quieter. Sections load
 * together but fail independently: a dead feed does not blank the library
 * column (the partial state, phase1 §states).
 */
export function HomeClient({ simulate }: { simulate?: string }) {
  const mock = simulate != null;
  const { profile } = useSession();
  const [nudgeDismissed, setNudgeDismissed] = React.useState(true);
  const [state, setState] = React.useState<State>({ kind: "loading" });

  React.useEffect(() => {
    setNudgeDismissed(window.localStorage.getItem(NUDGE_KEY) === "1");
  }, []);

  const load = React.useCallback(() => {
    if (mock) {
      setState({
        kind: "ready",
        data: {
          picks: mockFeed(2, 3),
          entries: MOCK_LIBRARY,
          ratedCount: 12,
        },
      });
      return;
    }
    setState({ kind: "loading" });
    Promise.allSettled([getFeed(), listTracking(), listInteractions()]).then(
      ([feed, tracking, interactions]) => {
        const data: HomeData = {
          picks: feed.status === "fulfilled" ? feed.value : null,
          entries: tracking.status === "fulfilled" ? tracking.value : null,
          ratedCount:
            interactions.status === "fulfilled"
              ? interactions.value.filter((i) => i.kind === "rated").length
              : null,
        };
        if (!data.picks && !data.entries) setState({ kind: "error" });
        else setState({ kind: "ready", data });
      }
    );
  }, [mock]);

  React.useEffect(load, [load]);

  function dismissNudge() {
    setNudgeDismissed(true);
    // Permanent by design: one dismissal, no nagging (onboarding spec §3C).
    window.localStorage.setItem(NUDGE_KEY, "1");
  }

  // ---------- loading ----------
  if (state.kind === "loading") {
    return (
      <main className="mx-auto w-full max-w-[1400px] px-4 py-8 md:px-6">
        <Skeleton className="h-8 w-40 rounded-lg" />
        <div className="mt-8 flex flex-col gap-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
        <div className="mt-10 flex gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              className="aspect-[2/3] w-28 shrink-0 rounded-art sm:w-32"
            />
          ))}
        </div>
      </main>
    );
  }

  // ---------- error (both pillars down) ----------
  if (state.kind === "error") {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-24 text-center md:px-6">
        <p className="text-[15px] font-semibold text-foreground">
          Could not load your home.
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

  const { picks, entries, ratedCount } = state.data;
  const topPicks = (picks ?? []).slice(0, 2);
  const tasteReasons = aggregateReasons(picks ?? []);
  const inProgress = (entries ?? []).filter(
    (e) => e.status === "watching" || e.status === "rewatching"
  );
  const recent = [...(entries ?? [])]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);
  const showNudge =
    !nudgeDismissed && ratedCount != null && ratedCount < TIER_THRESHOLD;

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-8 md:px-6">
      {/* The name is appended only once it is known, so the greeting never
          flashes a placeholder or a trailing comma. */}
      <h1 className="text-2xl font-semibold tracking-tight">
        {profile?.username ? `${greeting()}, ${profile.username}` : greeting()}
      </h1>

      {/* Action sits inline with the dismiss rather than stacked under the
          copy: a nudge that costs three lines of the fold is working against
          the screen it interrupts. */}
      {showNudge ? (
        <div className="mt-4 flex flex-col gap-3 rounded-lg bg-card px-4 py-3 ring-1 ring-foreground/10 sm:flex-row sm:items-center sm:gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              Klyvi does not know your taste yet
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Rate 20 films, about 90 seconds, and recommendations get a lot
              better.
            </p>
          </div>
          <div className="flex shrink-0 items-center justify-between gap-1 sm:justify-end">
            <Link
              href="/onboarding/rate"
              className={buttonVariants({ size: "sm" })}
            >
              Start rating
            </Link>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Dismiss"
              className="hit-44 relative shrink-0"
              onClick={dismissNudge}
            >
              <X aria-hidden="true" className="size-4" strokeWidth={2} />
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-10 lg:flex-row">
        {/* Main column */}
        <div className="min-w-0 flex-1">
          <section>
            <SectionHeader
              title="Your top picks"
              action={{ label: "Find something to watch", href: "/find" }}
              className="mb-4"
            />
            {picks == null ? (
              <p className="text-sm text-muted-foreground">
                Could not load your picks right now.
              </p>
            ) : topPicks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing to pick from yet. Rate a few films and this fills in.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {topPicks.map((p) => (
                  <Link
                    key={p.mediaId}
                    href={`/movie/${p.tmdbId}`}
                    className="group flex items-center gap-4 rounded-lg bg-card p-3 ring-1 ring-foreground/10 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/30"
                  >
                    <div className="relative aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-art bg-muted ring-1 ring-foreground/10">
                      {p.posterPath ? (
                        // Plain <img>: PosterCard is a link and links cannot
                        // nest.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`https://image.tmdb.org/t/p/w154${p.posterPath}`}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {p.title}{" "}
                        <span
                          data-numeric
                          className="font-mono text-xs font-normal text-muted-foreground"
                        >
                          {p.year}
                        </span>
                      </p>
                      <ReasonChips
                        reasons={p.reasons}
                        max={2}
                        className="mt-1.5"
                      />
                    </div>
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                      strokeWidth={2}
                    />
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="mt-10">
            <SectionHeader
              title="Continue watching"
              action={{ label: "View all", href: "/library" }}
              className="mb-4"
            />
            {entries == null ? (
              <p className="text-sm text-muted-foreground">
                Could not load your library right now.
              </p>
            ) : inProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing in progress. Anything you start turns up here.
              </p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {inProgress.map((e) => (
                  <div key={e.mediaId} className="w-28 shrink-0 sm:w-32">
                    <PosterCard
                      media={e}
                      variant="below"
                      status={e.status}
                      progress={
                        e.progress != null
                          ? { watched: e.progress, total: e.progressTotal }
                          : undefined
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mt-10">
            <SectionHeader title="Recent activity" className="mb-4" />
            {entries == null ? (
              <p className="text-sm text-muted-foreground">
                Could not load your activity right now.
              </p>
            ) : recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Your activity shows up here once you start tracking.
              </p>
            ) : (
              <ul className="flex flex-col">
                {recent.map((e) => (
                  <li
                    key={e.mediaId}
                    className="flex items-baseline justify-between gap-4 border-b border-border py-2 text-sm last:border-b-0"
                  >
                    <span className="min-w-0 truncate text-muted-foreground">
                      {STATUS_VERBS[e.status]}{" "}
                      <span className="text-foreground">
                        {e.title}
                        {e.mediaType === "season"
                          ? ` Season ${e.seasonNumber}`
                          : ""}
                      </span>
                    </span>
                    {e.score != null ? (
                      <span
                        data-numeric
                        className="shrink-0 font-mono text-xs text-muted-foreground"
                      >
                        {e.score}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Sidebar: quieter, demotes below main on mobile. */}
        <aside className="w-full shrink-0 lg:w-80">
          <section className="rounded-lg bg-card p-5 ring-1 ring-foreground/10">
            <h2 className="text-xs font-medium tracking-[0.12em] uppercase text-muted-foreground">
              Your taste right now
            </h2>
            {tasteReasons.length > 0 ? (
              <>
                <ReasonChips reasons={tasteReasons} max={5} className="mt-3" />
                <p className="mt-3 text-xs text-muted-foreground">
                  Built from what you rate. It sharpens as you track.
                </p>
              </>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                Klyvi cannot describe your taste yet. Rate a few films and the
                picture forms here.
              </p>
            )}
          </section>

          <section className="mt-4 rounded-lg bg-card p-5 ring-1 ring-foreground/10">
            <h2 className="text-xs font-medium tracking-[0.12em] uppercase text-muted-foreground">
              Your library
            </h2>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {(
                [
                  ["Watching", "watching"],
                  ["Planning", "planning"],
                  ["Completed", "completed"],
                  ["Paused", "paused"],
                ] as const
              ).map(([label, key]) => (
                <div
                  key={key}
                  className="flex items-baseline justify-between rounded-md bg-muted/50 px-3 py-2"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd data-numeric className="font-mono text-foreground">
                    {(entries ?? []).filter((e) => e.status === key).length}
                  </dd>
                </div>
              ))}
            </dl>
            <Link
              href="/profile/stats"
              className="tap-target mt-3 inline-flex items-center gap-1 text-xs font-medium text-violet-text hover:underline"
            >
              <Sparkles
                aria-hidden="true"
                className="size-3.5"
                strokeWidth={2}
              />
              See your stats
            </Link>
          </section>
        </aside>
      </div>
    </main>
  );
}
