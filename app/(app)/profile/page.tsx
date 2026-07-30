import Link from "next/link";
import { Settings as SettingsIcon } from "lucide-react";

import { PosterCard } from "@/components/klyvi/poster-card";
import { ReasonChips } from "@/components/klyvi/reason-chips";
import { SectionHeader } from "@/components/klyvi/section-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { MOCK_LIBRARY } from "@/lib/mock-library";
import { STATUS_LABELS, type TrackingStatus } from "@/lib/types";

export const metadata = { title: "Profile · Klyvi" };

/**
 * Profile is who you are and what you have watched. Settings is what you
 * change. They were one page, which made the avatar menu's two entries lead
 * to the same place; splitting them gives each a real job.
 */
export default function ProfilePage() {
  const entries = MOCK_LIBRARY;
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
            <AvatarFallback className="text-lg">K</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Your profile
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Your taste, in one place.
            </p>
          </div>
        </div>
        <Link
          href="/settings"
          className={buttonVariants({ variant: "outline", size: "sm" }) + " gap-2"}
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
        <ReasonChips
          reasons={[
            { kind: "keyword", id: 1, name: "slow-burn" },
            { kind: "keyword", id: 2, name: "psychological thriller" },
            { kind: "genre", id: 3, name: "Drama" },
            { kind: "keyword", id: 4, name: "nonlinear timeline" },
            { kind: "genre", id: 5, name: "Mystery" },
          ]}
          max={6}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          Built from what you rate. It sharpens as you track.
        </p>
      </section>

      <section className="mt-10">
        <SectionHeader
          title="Breakdown"
          action={{ label: "See full stats", href: "/library/stats" }}
          className="mb-4"
        />
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
      </section>

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
    </main>
  );
}
