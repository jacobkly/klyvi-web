"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

import { useSession } from "@/components/auth/auth-provider";
import { MediaRail } from "@/components/klyvi/media-rail";
import { PosterCard } from "@/components/klyvi/poster-card";
import { ReasonChips } from "@/components/klyvi/reason-chips";
import { SectionHeader } from "@/components/klyvi/section-header";
import { RatingDialog } from "@/components/media/rating-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listInteractions } from "@/lib/api/interactions";
import { getFeed } from "@/lib/api/reco";
import { listTrackingPaged, updateTracking } from "@/lib/api/tracking";
import {
  comingUp,
  greetingName,
  HERO_POOL,
  heroStart,
  reasonRails,
  tasteKeywords,
} from "@/lib/home";
import { queueSignal } from "@/lib/interactions-batch";
import { recentActivity } from "@/lib/library-filter";
import { usePref } from "@/lib/local-prefs";
import { mediaHref } from "@/lib/media-href";
import { MOCK_LIBRARY } from "@/lib/mock-library";
import { mockFeed } from "@/lib/mock-reco";
import { dismissPick, ratePick, savePick } from "@/lib/pick-actions";
import type { LibraryEntry, Scored } from "@/lib/types";

import { HomeHero, type HeroAction } from "./home-hero";
import { ActivityList, ComingUpCard, ContinueCard } from "./home-sections";

const NUDGE_KEY = "klyvi:nudge-dismissed";
/** Counts visits, so the hero leads with a different top pick each time. */
const HERO_TURN_KEY = "klyvi:hero-turn";
const TIER_THRESHOLD = 20;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 18) return "Afternoon";
  return "Evening";
}

/** This visit's hero turn, and the next visit's saved. Storage can throw. */
function takeHeroTurn(): number {
  try {
    const turn = Number(window.localStorage.getItem(HERO_TURN_KEY)) || 0;
    window.localStorage.setItem(HERO_TURN_KEY, String(turn + 1));
    return turn;
  } catch {
    return 0;
  }
}

/** One section's data: undefined while it loads, null when it failed. */
type Loaded<T> = T | null | undefined;

const subscribeNever = () => () => {};

/** False on the server and during hydration, true after. */
function useHydrated(): boolean {
  return React.useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );
}

function RailSkeleton({ title }: { title: string }) {
  return (
    <MediaRail title={title}>
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={i} className="aspect-[2/3] w-full rounded-art" />
      ))}
    </MediaRail>
  );
}

/**
 * Home: tonight's pick over its backdrop, then rows of posters (picks, what
 * you're watching, what's coming), then what you did lately. Each section
 * paints as its own request lands, with its own skeleton until then, so the
 * feed (the slowest call) never holds back the library rows, and one failure
 * never blanks the other (the partial state, phase1 §states).
 */
export function HomeClient({ simulate }: { simulate?: string }) {
  const mock = simulate != null;
  const router = useRouter();
  const { profile, user } = useSession();
  const hydrated = useHydrated();
  const [activityFeed] = usePref("activityFeed");
  // Dismissed on an earlier visit (read after hydration; the server render
  // assumes dismissed so the nudge never flashes), or just now.
  const dismissedBefore = React.useSyncExternalStore(
    subscribeNever,
    () => window.localStorage.getItem(NUDGE_KEY) === "1",
    () => true
  );
  const [dismissedNow, setDismissedNow] = React.useState(false);
  const nudgeDismissed = dismissedBefore || dismissedNow;
  const [picks, setPicks] = React.useState<Loaded<Scored[]>>(() =>
    mock ? mockFeed(2, 7) : undefined
  );
  const [heroIndex, setHeroIndex] = React.useState(0);
  const [rating, setRating] = React.useState<Scored | null>(null);
  const [entries, setEntries] = React.useState<Loaded<LibraryEntry[]>>(() =>
    mock ? MOCK_LIBRARY : undefined
  );
  const [ratedCount, setRatedCount] = React.useState<Loaded<number>>(() =>
    mock ? 12 : undefined
  );
  /** Bumped by the error state's Try again to refetch every section. */
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    if (mock) return;
    let live = true;
    getFeed().then(
      (v) => {
        if (!live) return;
        setPicks(v);
        setHeroIndex(heroStart(takeHeroTurn(), v.length));
      },
      () => {
        if (live) setPicks(null);
      }
    );
    // The first page paints the sections. Later pages fill in the rest, and
    // if one fails the library shows its error rather than a partial list.
    listTrackingPaged({
      live: () => live,
      page: (more) =>
        setEntries((prev) => (Array.isArray(prev) ? [...prev, ...more] : prev)),
      failed: () => setEntries(null),
    }).then(
      (v) => {
        if (live) setEntries(v);
      },
      () => {
        if (live) setEntries(null);
      }
    );
    listInteractions({ kind: "rated" }).then(
      (v) => {
        if (live) setRatedCount(v.filter((i) => i.kind === "rated").length);
      },
      () => {
        if (live) setRatedCount(null);
      }
    );
    return () => {
      live = false;
    };
  }, [mock, attempt]);

  const pool = (picks ?? []).slice(0, HERO_POOL);
  const heroAt = Math.min(heroIndex, Math.max(0, pool.length - 1));
  const hero = pool[heroAt] ?? null;

  // The hero pick on screen is an impression; batched and deduped in the
  // signal queue, so a revisit or re-render cannot double-count.
  React.useEffect(() => {
    if (mock || !hero) return;
    queueSignal({
      tmdbId: hero.tmdbId,
      mediaType: hero.mediaType,
      kind: "impression",
      source: "feed",
    });
  }, [mock, hero]);

  function retry() {
    setPicks(undefined);
    setEntries(undefined);
    setRatedCount(undefined);
    setAttempt((n) => n + 1);
  }

  function dismissNudge() {
    setDismissedNow(true);
    // Permanent by design: one dismissal, no nagging (onboarding spec §3C).
    window.localStorage.setItem(NUDGE_KEY, "1");
  }

  /** A show is recommended whole but tracked season by season, so a toast
   *  about one points at its page, where the seasons are. */
  const seasons = (p: Scored) => ({
    label: "Track seasons",
    onClick: () => router.push(mediaHref(p)),
  });

  /** The acted-on pick leaves, and the next of the top few slides in. */
  function removePick(p: Scored) {
    setPicks((prev) =>
      Array.isArray(prev) ? prev.filter((x) => x.mediaId !== p.mediaId) : prev
    );
  }

  function actOnHero(kind: HeroAction) {
    if (!hero) return;
    if (kind === "seen") {
      // The moment they say they've seen it is the moment to ask how it was.
      setRating(hero);
      return;
    }
    if (kind === "save") savePick(hero, { mock, seasons });
    else {
      const p = hero;
      const at = (picks ?? []).indexOf(p);
      // Undo puts it back where it was, which is where the hero is.
      dismissPick(p, {
        mock,
        onUndo: () =>
          setPicks((prev) =>
            Array.isArray(prev) && !prev.some((x) => x.mediaId === p.mediaId)
              ? [...prev.slice(0, at), p, ...prev.slice(at)]
              : prev
          ),
      });
    }
    removePick(hero);
  }

  function submitRating(score: number | null) {
    const cur = rating;
    setRating(null);
    if (!cur) return;
    ratePick(cur, score, { mock, seasons });
    if (!mock && score != null) setRatedCount((n) => (n != null ? n + 1 : n));
    removePick(cur);
  }

  function openPick(p: Scored) {
    if (mock) return;
    queueSignal({
      tmdbId: p.tmdbId,
      mediaType: p.mediaType,
      kind: "clicked",
      source: "feed",
    });
  }

  /** +1 episode. Shown at once, put back if the write fails. The last
   *  episode finishes the season. */
  function stepEpisode(e: LibraryEntry) {
    const next = (e.progress ?? 0) + 1;
    const finished = e.progressTotal != null && next >= e.progressTotal;
    const patch = (row: LibraryEntry) => (x: LibraryEntry) =>
      x.mediaId === row.mediaId ? row : x;
    const stepped: LibraryEntry = {
      ...e,
      progress: next,
      ...(finished ? { status: "completed" as const } : {}),
    };
    setEntries((prev) => (Array.isArray(prev) ? prev.map(patch(stepped)) : prev));
    if (finished) toast(`Season ${e.seasonNumber} finished`);
    if (mock) return;
    updateTracking(e.mediaId, {
      episodeProgress: next,
      ...(finished ? { status: "completed" as const } : {}),
    }).catch(() => {
      setEntries((prev) => (Array.isArray(prev) ? prev.map(patch(e)) : prev));
      toast("Could not update that. Try again");
    });
  }

  // ---------- error (both pillars down) ----------
  if (picks === null && entries === null) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-24 text-center md:px-6">
        <p className="text-[15px] font-semibold text-foreground">
          Could not load your home.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Something went wrong on Klyvi&apos;s end.
        </p>
        <Button className="mt-5" onClick={retry}>
          Try again
        </Button>
      </main>
    );
  }

  const name = greetingName(profile, user?.user_metadata);
  const heroIds = new Set(pool.map((p) => p.mediaId));
  const topPicks = (picks ?? []).filter((p) => !heroIds.has(p.mediaId));
  const rails = reasonRails(picks ?? []);
  const taste = tasteKeywords(picks ?? []);
  const inProgress = (entries ?? []).filter(
    (e) => e.status === "watching" || e.status === "rewatching"
  );
  const upcoming = comingUp(entries ?? []);
  const recent = recentActivity(entries ?? [], activityFeed, 6);
  const showNudge =
    !nudgeDismissed && ratedCount != null && ratedCount < TIER_THRESHOLD;

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-8 md:px-6">
      {/* The name is appended only once it is known, so the greeting never
          flashes a placeholder or a trailing comma. The greeting reads the
          local clock, so it waits for hydration: the server's hour is not
          the viewer's. */}
      {hydrated ? (
        <h1 className="text-2xl font-semibold tracking-tight">
          {name ? `${greeting()}, ${name}` : greeting()}
        </h1>
      ) : (
        <Skeleton className="h-8 w-40 rounded-lg" />
      )}

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

      <div className="mt-6">
        {picks === undefined ? (
          <Skeleton
            role="status"
            aria-label="Loading your picks"
            className="h-80 w-full rounded-lg sm:h-[22rem]"
          />
        ) : picks === null ? (
          <p className="rounded-lg bg-card px-4 py-6 text-sm text-muted-foreground ring-1 ring-foreground/10">
            Could not load your picks right now.
          </p>
        ) : hero ? (
          <HomeHero
            picks={pool}
            index={heroAt}
            onSelect={setHeroIndex}
            onAct={actOnHero}
            onOpen={openPick}
          />
        ) : (
          <div className="rounded-lg bg-card px-4 py-6 ring-1 ring-foreground/10">
            <p className="text-sm text-muted-foreground">
              Nothing to pick from yet. Rate a few films or shows and this fills in.
            </p>
            <Link
              href="/onboarding/rate"
              className={buttonVariants({ size: "sm", className: "mt-3" })}
            >
              Start rating
            </Link>
          </div>
        )}
      </div>

      <div className="mt-10 flex flex-col gap-10">
        {picks === undefined ? (
          <RailSkeleton title="Top picks for you" />
        ) : topPicks.length > 0 ? (
          <MediaRail
            title="Top picks for you"
            action={{ label: "Find something to watch", href: "/find" }}
          >
            {topPicks.map((p, i) => (
              <PosterCard key={p.mediaId} media={p} variant="below" eager={i < 7} />
            ))}
          </MediaRail>
        ) : null}

        {rails.map((r) => (
          <MediaRail key={r.key} title={r.title}>
            {r.picks.map((p) => (
              <PosterCard key={p.mediaId} media={p} variant="below" />
            ))}
          </MediaRail>
        ))}

        {entries === undefined ? (
          <RailSkeleton title="Continue watching" />
        ) : entries === null ? (
          <section>
            <SectionHeader title="Continue watching" className="mb-4" />
            <p className="text-sm text-muted-foreground">
              Could not load your library right now.
            </p>
          </section>
        ) : (
          <>
            {inProgress.length > 0 ? (
              <MediaRail
                title="Continue watching"
                action={{ label: "View all", href: "/library?status=watching" }}
              >
                {inProgress.map((e) => (
                  <ContinueCard key={e.mediaId} entry={e} onStep={stepEpisode} />
                ))}
              </MediaRail>
            ) : null}

            {upcoming.length > 0 ? (
              <MediaRail title="Coming up">
                {upcoming.map(({ entry, label }) => (
                  <ComingUpCard key={entry.mediaId} entry={entry} label={label} />
                ))}
              </MediaRail>
            ) : null}

            <div className="flex flex-col gap-10 lg:flex-row">
              <section className="min-w-0 flex-1">
                <SectionHeader
                  title="Recent activity"
                  action={{ label: "Your stats", href: "/profile/stats" }}
                  className="mb-2"
                />
                {recent.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Your activity shows up here once you start tracking.
                  </p>
                ) : (
                  <ActivityList entries={recent} />
                )}
              </section>

              {taste.length > 0 ? (
                <section
                  aria-label="Your taste"
                  className="w-full shrink-0 self-start rounded-lg bg-card p-5 ring-1 ring-foreground/10 lg:w-80"
                >
                  <h2 className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
                    Your taste
                  </h2>
                  <ReasonChips
                    reasons={taste}
                    max={6}
                    label="Themes in your picks"
                    className="mt-3"
                  />
                  <p className="mt-3 text-xs text-muted-foreground">
                    Themes that keep turning up in your picks. They sharpen as
                    you rate.
                  </p>
                </section>
              ) : null}
            </div>
          </>
        )}
      </div>

      {rating ? (
        <RatingDialog
          title={rating.title}
          year={rating.year}
          posterPath={rating.posterPath}
          open
          onOpenChange={(o) => !o && setRating(null)}
          onSubmit={submitRating}
        />
      ) : null}
    </main>
  );
}
