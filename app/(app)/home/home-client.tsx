"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowRight, Sparkles, X } from "lucide-react";

import { PosterCard } from "@/components/klyvi/poster-card";
import { ReasonChips } from "@/components/klyvi/reason-chips";
import { SectionHeader } from "@/components/klyvi/section-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { mockFeed } from "@/lib/mock-reco";
import { MOCK_LIBRARY } from "@/lib/mock-library";
import { STATUS_VERBS } from "@/lib/types";

function PosterThumb({ path }: { path: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={`https://image.tmdb.org/t/p/w154${path}`}
      alt=""
      className="absolute inset-0 h-full w-full object-cover"
      loading="lazy"
    />
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 18) return "Afternoon";
  return "Evening";
}

/**
 * The dashboard (archetype D). Find-next strip owns the top and the visual
 * weight; continue watching second; activity and taste snapshot quieter. On
 * mobile the sidebar content demotes below the main column (05-responsive.md)
 * via flex order.
 */
export function HomeClient() {
  const [nudgeDismissed, setNudgeDismissed] = React.useState(false);

  const picks = mockFeed(2, 3);
  const inProgress = MOCK_LIBRARY.filter(
    (e) => e.status === "watching" || e.status === "rewatching"
  );
  const recent = [...MOCK_LIBRARY]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);
  const tasteReasons = [
    { kind: "keyword" as const, id: 1, name: "slow-burn" },
    { kind: "keyword" as const, id: 2, name: "psychological thriller" },
    { kind: "genre" as const, id: 3, name: "Drama" },
    { kind: "keyword" as const, id: 4, name: "nonlinear timeline" },
    { kind: "genre" as const, id: 5, name: "Mystery" },
  ];

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-8 md:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {greeting()}
      </h1>

      {/* Action sits inline with the dismiss rather than stacked under the
          copy: a nudge that costs three lines of the fold is working against
          the screen it interrupts. */}
      {!nudgeDismissed ? (
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
              onClick={() => setNudgeDismissed(true)}
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
            <div className="flex flex-col gap-3">
              {picks.map((p) => (
                <Link
                  key={p.mediaId}
                  href={`/movie/${p.tmdbId}`}
                  className="group flex items-center gap-4 rounded-lg bg-card p-3 ring-1 ring-foreground/10 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                  <div className="relative aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-art bg-muted ring-1 ring-foreground/10">
                    {p.posterPath ? (
                      // Plain <img>-via-next/image: PosterCard is a link and
                      // links cannot nest.
                      <PosterThumb path={p.posterPath} />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {p.title}{" "}
                      <span data-numeric className="font-mono text-xs font-normal text-muted-foreground">
                        {p.year}
                      </span>
                    </p>
                    <ReasonChips reasons={p.reasons} max={2} className="mt-1.5" />
                  </div>
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    strokeWidth={2}
                  />
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <SectionHeader
              title="Continue watching"
              action={{ label: "View all", href: "/library" }}
              className="mb-4"
            />
            {inProgress.length === 0 ? (
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
            {recent.length === 0 ? (
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
                      <span data-numeric className="shrink-0 font-mono text-xs text-muted-foreground">
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
            <ReasonChips reasons={tasteReasons} max={5} className="mt-3" />
            <p className="mt-3 text-xs text-muted-foreground">
              Built from what you rate. It sharpens as you track.
            </p>
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
                <div key={key} className="flex items-baseline justify-between rounded-md bg-muted/50 px-3 py-2">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd data-numeric className="font-mono text-foreground">
                    {MOCK_LIBRARY.filter((e) => e.status === key).length}
                  </dd>
                </div>
              ))}
            </dl>
            <Link
              href="/library/stats"
              className="tap-target mt-3 inline-flex items-center gap-1 text-xs font-medium text-violet-text hover:underline"
            >
              <Sparkles aria-hidden="true" className="size-3.5" strokeWidth={2} />
              See your stats
            </Link>
          </section>
        </aside>
      </div>
    </main>
  );
}
