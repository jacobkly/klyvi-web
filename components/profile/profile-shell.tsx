"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Settings as SettingsIcon } from "lucide-react";

import { useSession } from "@/components/auth/auth-provider";
import { AccountLinks } from "@/components/profile/account-links";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getFeed } from "@/lib/api/reco";
import { listTracking } from "@/lib/api/tracking";
import { getMyStats } from "@/lib/api/users";
import type { LibraryEntry, Reason, Scored, UserStats } from "@/lib/types";
import { cn } from "@/lib/utils";
import { tmdbImage } from "@/lib/tmdb-image";

/** One section's data: undefined while it loads, null when it failed. */
export type Loaded<T> = T | null | undefined;

export type ProfileData = {
  entries: LibraryEntry[];
  /** Top reasons from the feed, which is the slowest call. */
  taste: Loaded<Reason[]>;
  /** Server-aggregated stats. */
  stats: Loaded<UserStats>;
};

const ProfileContext = React.createContext<ProfileData | null>(null);

/** Profile data once the library is in. Null before that, or if it failed. */
export function useProfile(): ProfileData | null {
  return React.useContext(ProfileContext);
}

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

function formatBirthday(iso: string): string | null {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return new Date(t).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const TABS = [
  { href: "/profile", label: "Overview" },
  { href: "/profile/stats", label: "Stats" },
];

/**
 * The profile chrome shared by both tabs: full-bleed banner built from the
 * user's highest-rated backdrop (the posters are the light source, so the
 * banner is artwork, not decoration), overlapping avatar, identity line,
 * and the tab row.
 *
 * The identity is the session's profile, never a second fetch. The library,
 * the feed, and the stats load separately: the tabs wait only for the
 * library, and the feed and stats fill their own sections as they land.
 */
export function ProfileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile: me, loading: sessionLoading } = useSession();
  const [entries, setEntries] = React.useState<Loaded<LibraryEntry[]>>();
  const [taste, setTaste] = React.useState<Loaded<Reason[]>>();
  const [stats, setStats] = React.useState<Loaded<UserStats>>();
  /** Bumped by the error state's Try again to refetch everything. */
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    let live = true;
    listTracking().then(
      (v) => {
        if (live) setEntries(v);
      },
      () => {
        if (live) setEntries(null);
      }
    );
    getFeed().then(
      (v) => {
        if (live) setTaste(aggregateReasons(v));
      },
      () => {
        if (live) setTaste(null);
      }
    );
    getMyStats().then(
      (v) => {
        if (live) setStats(v);
      },
      () => {
        if (live) setStats(null);
      }
    );
    return () => {
      live = false;
    };
  }, [attempt]);

  function retry() {
    setEntries(undefined);
    setTaste(undefined);
    setStats(undefined);
    setAttempt((n) => n + 1);
  }

  const data = React.useMemo<ProfileData | null>(
    () => (entries ? { entries, taste, stats } : null),
    [entries, taste, stats]
  );

  // The session's profile usually lands first. If it has not by the time
  // the library has, it failed, and the fallback name stands in rather than
  // a skeleton that never resolves.
  const identityReady =
    me != null || (!sessionLoading && entries !== undefined);
  const avatarSrc = me?.avatarUrl ?? null;
  const birthdayLine = me?.birthday ? formatBirthday(me.birthday) : null;
  // A set banner_url wins; otherwise the highest-rated backdrop stands in.
  // bannerUrl is a full URL, the backdrop is a TMDB path. Chosen only once
  // the identity is known, so a set banner never swaps in over artwork.
  const best = (entries ?? [])
    .filter((e) => e.score != null && e.backdropPath)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
  const bannerSrc = identityReady
    ? (me?.bannerUrl ?? tmdbImage(best?.backdropPath))
    : null;

  return (
    <main className="flex-1">
      {/* Banner: real artwork, dimmed so the identity line holds contrast. */}
      <div className="relative h-40 w-full overflow-hidden bg-card sm:h-52">
        {bannerSrc ? (
          <>
            <Image
              src={bannerSrc}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/20 to-background" />
          </>
        ) : null}
      </div>

      <div className="mx-auto w-full max-w-[1100px] px-4 md:px-6">
        <div className="-mt-8 flex flex-wrap items-end justify-between gap-4">
          {identityReady ? (
            <div className="flex items-end gap-4">
              <Avatar className="size-24 ring-4 ring-background">
                {avatarSrc ? <AvatarImage src={avatarSrc} alt="" /> : null}
                <AvatarFallback className="text-2xl">
                  {(me?.username?.charAt(0) ?? "K").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {me?.username ?? "Your profile"}
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {me?.bio ?? "Your taste, in one place."}
                  {birthdayLine ? (
                    <span className="text-muted-foreground/80">
                      {me?.bio ? " · " : ""}
                      Born {birthdayLine}
                    </span>
                  ) : null}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-end gap-4">
              <Skeleton className="size-24 rounded-full ring-4 ring-background" />
              <div className="pb-2">
                <Skeleton className="h-7 w-44 rounded-lg" />
                <Skeleton className="mt-2 h-4 w-32 rounded-lg" />
              </div>
            </div>
          )}
          <Link
            href="/settings"
            className={
              buttonVariants({ variant: "outline", size: "sm" }) +
              " hidden gap-2 md:inline-flex"
            }
          >
            <SettingsIcon aria-hidden="true" data-icon="inline-start" />
            Settings
          </Link>
        </div>

        <AccountLinks />

        <nav aria-label="Profile" className="mt-6 flex gap-2">
          {TABS.map((t) => {
            const isActive = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "tap-target inline-flex items-center rounded-full px-4 py-1.5 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30",
                  isActive
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        {entries === undefined ? (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : data === null ? (
          <div className="py-16 text-center">
            <p className="text-[15px] font-semibold text-foreground">
              Could not load your profile.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Something went wrong on Klyvi&apos;s end.
            </p>
            <Button className="mt-5" onClick={retry}>
              Try again
            </Button>
          </div>
        ) : (
          <ProfileContext.Provider value={data}>
            {children}
          </ProfileContext.Provider>
        )}
      </div>
    </main>
  );
}
