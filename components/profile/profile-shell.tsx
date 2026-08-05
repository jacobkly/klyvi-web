"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Settings as SettingsIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getMovie } from "@/lib/api/catalog";
import { getFeed } from "@/lib/api/reco";
import { listTracking } from "@/lib/api/tracking";
import { getMe, getMyStats } from "@/lib/api/users";
import type {
  LibraryEntry,
  Reason,
  Scored,
  UserProfile,
  UserStats,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export type ProfileData = {
  me: UserProfile | null;
  entries: LibraryEntry[];
  taste: Reason[];
  /** Server-aggregated stats, or null when the fetch failed. */
  stats: UserStats | null;
};

const ProfileContext = React.createContext<ProfileData | null>(null);

/** Ready profile data. Null while the shell is still loading or failed. */
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

type State =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; data: ProfileData };

const TABS = [
  { href: "/profile", label: "Overview" },
  { href: "/profile/stats", label: "Stats" },
];

/**
 * The profile chrome shared by both tabs: full-bleed banner built from the
 * user's highest-rated backdrop (the posters are the light source, so the
 * banner is artwork, not decoration), overlapping avatar, identity line,
 * and the tab row. Data loads once here and feeds both tabs via context.
 */
export function ProfileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = React.useState<State>({ kind: "loading" });
  const [backdrop, setBackdrop] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setState({ kind: "loading" });
    Promise.allSettled([
      getMe(),
      listTracking(),
      getFeed(),
      getMyStats(),
    ]).then(([me, tracking, feed, stats]) => {
      if (me.status === "rejected" && tracking.status === "rejected") {
        setState({ kind: "error" });
        return;
      }
      setState({
        kind: "ready",
        data: {
          me: me.status === "fulfilled" ? me.value : null,
          entries: tracking.status === "fulfilled" ? tracking.value : [],
          taste:
            feed.status === "fulfilled" ? aggregateReasons(feed.value) : [],
          stats: stats.status === "fulfilled" ? stats.value : null,
        },
      });
    });
  }, []);

  React.useEffect(load, [load]);

  // The banner backdrop arrives late and quietly: highest-rated film's
  // backdrop via the catalog, fallback stays the plain surface.
  React.useEffect(() => {
    if (state.kind !== "ready") return;
    const best = [...state.data.entries]
      .filter((e) => e.mediaType === "movie" && e.score != null)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
    if (!best) return;
    let cancelled = false;
    getMovie(best.tmdbId)
      .then((detail) => {
        if (!cancelled && detail?.backdropPath)
          setBackdrop(detail.backdropPath);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [state]);

  if (state.kind === "loading") {
    return (
      <main className="flex-1">
        <div className="h-40 w-full bg-card sm:h-52" />
        <div className="mx-auto w-full max-w-[1100px] px-4 md:px-6">
          <div className="-mt-8 flex items-end gap-4">
            <Skeleton className="size-24 rounded-full ring-4 ring-background" />
            <div className="pb-2">
              <Skeleton className="h-7 w-44 rounded-lg" />
              <Skeleton className="mt-2 h-4 w-32 rounded-lg" />
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (state.kind === "error") {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-24 text-center md:px-6">
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

  const { me } = state.data;
  const avatarSrc = me?.avatarUrl ?? null;
  const birthdayLine = me?.birthday ? formatBirthday(me.birthday) : null;
  // A set banner_url wins; otherwise the top-rated film's backdrop stands
  // in. bannerUrl is a full URL, backdrop is a TMDB path.
  const bannerSrc = me?.bannerUrl
    ? me.bannerUrl
    : backdrop
      ? `https://image.tmdb.org/t/p/w1280${backdrop}`
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

        <ProfileContext.Provider value={state.data}>
          {children}
        </ProfileContext.Provider>
      </div>
    </main>
  );
}
