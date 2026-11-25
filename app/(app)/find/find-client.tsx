"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import {
  Clapperboard,
  Clock,
  CloudLightning,
  Flame,
  Shuffle,
  Sparkles,
  Sun,
  type LucideIcon,
} from "lucide-react";

import { useSession } from "@/components/auth/auth-provider";
import { MoodPanel, PickPanel, PickPanelSkeleton } from "@/components/find/find-panels";
import { useCardSwipe } from "@/components/find/use-card-swipe";
import { AmbientArt } from "@/components/klyvi/ambient-art";
import { EmptyState } from "@/components/klyvi/empty-state";
import { RatingDialog } from "@/components/media/rating-dialog";
import { Button } from "@/components/ui/button";
import { getFeed } from "@/lib/api/reco";
import { listInteractions } from "@/lib/api/interactions";
import { queueSignal } from "@/lib/interactions-batch";
import { markPopUp, rememberPicks, returningPicks } from "@/lib/last-picks";
import { dismissPick, ratePick, savePick } from "@/lib/pick-actions";
import { mockFeed, mockInteractionCount, type RecoTier } from "@/lib/mock-reco";
import { usePref } from "@/lib/local-prefs";
import { mediaHref } from "@/lib/media-href";
import { formatRuntime, formatSeasons } from "@/lib/mock-media";
import { useReducedMotion } from "@/lib/motion";
import { watchWindowPhrase } from "@/lib/time-of-day";
import type { FeedMedia, Scored } from "@/lib/types";

const TIER_THRESHOLD = 20; // klyvi/docs/API.md: Tier 2 at >= 20 interactions.

/**
 * Moods are honest client-side lenses over the feed, not server queries.
 * Each one reads only what the feed carries (runtime, genres, year, and the
 * keywords named in its reasons); a pick missing that data does not fit.
 * A films-only mood reads a runtime, which a whole show does not have.
 */
const MOODS: {
  id: string;
  label: string;
  /** What the lens reads, in a few words, for its tile. */
  hint: string;
  icon: LucideIcon;
  filmsOnly?: boolean;
  fits: (s: Scored) => boolean;
}[] = [
  {
    id: "any",
    label: "Anything",
    hint: "Your best matches",
    icon: Shuffle,
    fits: () => true,
  },
  {
    id: "short",
    label: "Under 2 hours",
    hint: "Fits in an evening",
    icon: Clock,
    filmsOnly: true,
    fits: (s) => s.runtime != null && s.runtime <= 120,
  },
  {
    id: "slow",
    label: "Slow burn",
    hint: "Quiet drama over action",
    icon: Flame,
    fits: (s) =>
      s.reasons.some(
        (r) =>
          r.kind === "keyword" && /slow.?burn|psychological/i.test(r.name ?? "")
      ) ||
      (s.genres.includes("Drama") && !s.genres.includes("Action")),
  },
  {
    id: "light",
    label: "Something light",
    hint: "Comedy, romance, animation",
    icon: Sun,
    fits: (s) =>
      s.genres.some((g) => ["Comedy", "Romance", "Family", "Animation"].includes(g)) &&
      !s.genres.includes("Horror"),
  },
  {
    id: "heavy",
    label: "Heavy",
    hint: "Drama, crime, war",
    icon: CloudLightning,
    fits: (s) =>
      s.genres.some((g) => ["Drama", "War", "Crime", "Thriller"].includes(g)) &&
      !s.genres.includes("Comedy"),
  },
  {
    id: "old",
    label: "Twentieth century",
    hint: "Made before 2000",
    icon: Clapperboard,
    fits: (s) => s.year != null && s.year < 2000,
  },
];

/** The feed filter. The labels match the Library's type filter. */
const MEDIA: { value: FeedMedia; label: string }[] = [
  { value: "all", label: "All" },
  { value: "movie", label: "Films" },
  { value: "tv", label: "TV" },
];

type Phase =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error" }
  | {
      kind: "ready";
      picks: Scored[];
      index: number;
      /** The rest of the feed that fits, which refills the set as picks
       *  leave it. */
      reserve: Scored[];
      /** How many picks were asked for. */
      size: number;
    };

/**
 * Find Next, built as a decision surface rather than a list: ONE pick at a
 * time, lit by its artwork, reasons prominent, the rest of the set as small
 * posters. Everything on screen, synopsis, runtime, and genres included,
 * comes from one /v1/reco/feed request.
 */
export function FindClient({
  simulate,
  embedded = false,
}: {
  simulate?: string;
  /** Inside the desktop pop-up: no page landmark or frame of its own, and no
   *  history entry, since Back should leave the page behind it. */
  embedded?: boolean;
}) {
  const Main = embedded ? "div" : "main";
  const { user } = useSession();
  const router = useRouter();
  const mock = simulate != null;

  // Back from a title's page: the picks as they were left.
  const [returning] = React.useState(() =>
    mock ? null : returningPicks(user?.id ?? null, embedded)
  );
  const [mood, setMood] = React.useState(returning?.mood ?? "any");
  const [media, setMedia] = usePref("findMedia");
  const filmsOnlyMood = MOODS.find((x) => x.id === mood)?.filmsOnly === true;
  const [count, setCount] = React.useState<3 | 5 | 7>(returning?.count ?? 5);
  const [phase, setPhase] = React.useState<Phase>(
    returning
      ? {
          kind: "ready",
          picks: returning.picks,
          index: returning.index,
          reserve: returning.reserve,
          size: returning.size,
        }
      : { kind: "idle" }
  );
  const [fetchedInteractions, setInteractions] = React.useState<
    number | null
  >(null);
  const [rating, setRating] = React.useState<Scored | null>(null);
  const reduceMotion = useReducedMotion();
  const topRef = React.useRef<HTMLElement>(null);
  const [dir, setDir] = React.useState<1 | -1>(1);
  // Each step replaces the last, focused button included, so focus moves to
  // the new step rather than dropping out of the pop-up or back to the top.
  const panelRef = React.useRef<HTMLDivElement>(null);
  const shownPhase = React.useRef(phase.kind);
  React.useEffect(() => {
    if (shownPhase.current === phase.kind) return;
    shownPhase.current = phase.kind;
    panelRef.current?.focus({ preventScroll: true });
    if (!embedded) window.scrollTo({ top: 0 });
  }, [embedded, phase.kind]);
  // Keep the picks for a return from a title's page, and note on a page the
  // pop-up is over that it was showing them.
  const userId = user?.id ?? null;
  React.useEffect(() => {
    if (mock) return;
    if (embedded) markPopUp(phase.kind === "ready");
    if (phase.kind !== "ready") return;
    const { picks, index, reserve, size } = phase;
    rememberPicks({ userId, mood, count, picks, index, reserve, size });
  }, [mock, embedded, userId, mood, count, phase]);

  // Counts the picks that have left the set, so each departure brings the
  // next pick into full view.
  const [departures, setDepartures] = React.useState(0);

  const mockTier: RecoTier =
    simulate === "tier0" ? 0 : simulate === "tier2" ? 2 : 1;
  const interactions = mock
    ? mockInteractionCount(mockTier)
    : fetchedInteractions;

  // Real interaction count drives the tier copy.
  React.useEffect(() => {
    if (mock || !user) return;
    listInteractions({ kind: "rated" })
      .then((list) =>
        setInteractions(list.filter((i) => i.kind === "rated").length)
      )
      .catch(() => setInteractions(null));
  }, [mock, user]);

  const remaining =
    interactions != null ? Math.max(0, TIER_THRESHOLD - interactions) : null;

  // A pick the user is actually looking at is an impression; the batcher
  // dedupes and holds them, so stepping back and forth costs nothing.
  const sawPick = React.useCallback(
    (p: Scored | undefined) => {
      if (!p || mock) return;
      queueSignal({
        tmdbId: p.tmdbId,
        mediaType: p.mediaType,
        kind: "impression",
        source: "feed",
      });
    },
    [mock]
  );

  // The picks are a step past the mood, so Back returns to the mood rather
  // than leaving Find. The entry keeps the same url, and Next's patched
  // pushState carries its own router state into it.
  React.useEffect(() => {
    if (embedded) return;
    const onPop = () => {
      if (window.history.state?.findStage !== "picks") {
        setPhase({ kind: "idle" });
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [embedded]);

  async function fetchPicks() {
    setDir(1);
    if (phase.kind === "idle" && !embedded) {
      window.history.pushState({ findStage: "picks" }, "");
    }
    setPhase({ kind: "loading" });

    if (mock) {
      setTimeout(() => {
        if (simulate === "error") setPhase({ kind: "error" });
        else if (simulate === "exhausted")
          setPhase({ kind: "ready", picks: [], index: 0, reserve: [], size: count });
        else
          setPhase({
            kind: "ready",
            picks: mockFeed(mockTier, count),
            index: 0,
            reserve: [],
            size: count,
          });
      }, 550);
      return;
    }

    try {
      const m = MOODS.find((x) => x.id === mood) ?? MOODS[0];
      // A films-only mood asks for the films feed, so every slot is a
      // candidate instead of the share a mixed feed leaves to films.
      const feed = await getFeed({ media: m.filmsOnly ? "movie" : media });
      const fits = feed.filter(m.fits);
      const picks = fits.slice(0, count);
      setPhase({
        kind: "ready",
        picks,
        index: 0,
        reserve: fits.slice(count),
        size: count,
      });
      sawPick(picks[0]);
    } catch {
      setPhase({ kind: "error" });
    }
  }

  /** Back to the moods. The page's picks are a history step, so it is Back. */
  function changeMood() {
    if (!embedded && window.history.state?.findStage === "picks") {
      window.history.back();
    } else {
      setPhase({ kind: "idle" });
    }
  }

  function chooseMedia(next: FeedMedia) {
    setMedia(next);
    // A films-only mood cannot hold under TV, so it goes back to Anything.
    if (next === "tv" && filmsOnlyMood) setMood("any");
  }

  function goTo(next: number) {
    if (phase.kind !== "ready" || next === phase.index) return;
    if (next < 0 || next >= phase.picks.length) return;
    setDir(next > phase.index ? 1 : -1);
    setPhase({ ...phase, index: next });
    sawPick(phase.picks[next]);
  }

  function step(by: 1 | -1) {
    if (phase.kind === "ready") goTo(phase.index + by);
  }

  function openedDetail(p: Scored) {
    if (mock) return;
    queueSignal({
      tmdbId: p.tmdbId,
      mediaType: p.mediaType,
      kind: "clicked",
      source: "feed",
    });
  }

  /** The current pick leaves, and the next one that fits joins the end of
   *  the set, so it stays the size asked for while the feed lasts. */
  function removeCurrent() {
    if (phase.kind !== "ready") return;
    const cur = phase.picks[phase.index];
    const [refill, ...reserve] = phase.reserve;
    const picks = phase.picks.filter((p) => p.mediaId !== cur.mediaId);
    if (refill) picks.push(refill);
    setPhase({
      ...phase,
      picks,
      reserve,
      index: Math.min(phase.index, Math.max(0, picks.length - 1)),
    });
    setDepartures((n) => n + 1);
  }

  /** Undo on a hidden pick: it goes back where it was and is shown again.
   *  A set that would grow past its size hands its last pick back to the
   *  reserve. Read from the latest phase, since the toast outlives renders. */
  function restore(p: Scored, at: number) {
    setPhase((ph) => {
      if (ph.kind !== "ready" || ph.picks.some((x) => x.mediaId === p.mediaId)) {
        return ph;
      }
      const picks = [...ph.picks];
      const index = Math.min(at, picks.length);
      picks.splice(index, 0, p);
      let reserve = ph.reserve;
      if (picks.length > ph.size) reserve = [picks.pop() as Scored, ...reserve];
      return { ...ph, picks, reserve, index };
    });
    setDepartures((n) => n + 1);
  }

  // A pick left (or came back): the next one belongs in full view, not cut
  // off under wherever the page was scrolled to reach the buttons.
  React.useEffect(() => {
    if (departures === 0) return;
    topRef.current?.scrollIntoView?.({
      block: "start",
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [departures, reduceMotion]);

  /** A show is recommended whole but tracked season by season, so a toast
   *  about one points at its page, where the seasons are. */
  const trackSeasons = (p: Scored) => ({
    label: "Track seasons",
    onClick: () => router.push(mediaHref(p)),
  });

  function act(kind: "save" | "seen" | "dismiss") {
    if (phase.kind !== "ready") return;
    const cur = phase.picks[phase.index];

    if (kind === "seen") {
      // The one moment the user is already thinking about the film is the
      // moment to ask how it was: a watched-but-unrated title is the weakest
      // signal the recommender can get.
      setRating(cur);
      return;
    }

    if (kind === "save") savePick(cur, { mock, seasons: trackSeasons });
    if (kind === "dismiss") {
      const at = phase.index;
      dismissPick(cur, { mock, onUndo: () => restore(cur, at) });
    }
    removeCurrent();
  }

  function submitRating(score: number | null) {
    const cur = rating;
    setRating(null);
    if (!cur) return;
    ratePick(cur, score, { mock, seasons: trackSeasons });
    if (!mock && score != null) setInteractions((n) => (n != null ? n + 1 : n));
    removeCurrent();
  }

  const [swiped, setSwiped] = usePref("swipedPicks");
  const { cardRef, swipe } = useCardSwipe({
    canPrev: phase.kind === "ready" && phase.index > 0,
    canNext: phase.kind === "ready" && phase.index < phase.picks.length - 1,
    onStep: (by) => {
      if (!swiped) setSwiped(true);
      step(by);
    },
  });

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase.kind !== "ready" || rating) return;
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const moodNote =
    filmsOnlyMood || media === "tv" ? "Under 2 hours picks films only." : null;

  // The page draws the pop-up's frame itself at md+. Phones have none.
  const frame = (panel: React.ReactElement) =>
    embedded ? (
      panel
    ) : (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col pb-6 has-[[data-wide]]:max-w-5xl ultrawide:has-[[data-wide]]:max-w-6xl md:justify-center md:px-6 md:py-8">
        <div className="md:glass md:overflow-hidden md:rounded-lg md:border">{panel}</div>
      </main>
    );

  // ---------- idle ----------
  if (phase.kind === "idle") {
    return frame(
      <MoodPanel
        ref={panelRef}
        moods={MOODS}
        mood={mood}
        onMood={setMood}
        media={media}
        mediaOptions={MEDIA}
        onMedia={chooseMedia}
        count={count}
        onCount={setCount}
        note={moodNote}
        onFind={() => void fetchPicks()}
      />
    );
  }

  // ---------- loading ----------
  if (phase.kind === "loading") return frame(<PickPanelSkeleton ref={panelRef} />);

  // ---------- error ----------
  if (phase.kind === "error") {
    return (
      <Main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-24 text-center md:px-6">
        <p className="text-[15px] font-semibold text-foreground">
          Could not get your recommendations.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Something went wrong on Klyvi&apos;s end.
        </p>
        <Button className="mt-5" onClick={() => void fetchPicks()}>
          Try again
        </Button>
      </Main>
    );
  }

  // ---------- exhausted / empty ----------
  if (phase.picks.length === 0) {
    return (
      <Main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-10 md:px-6">
        {mood !== "any" ? (
          <EmptyState
            icon={Sparkles}
            title="Nothing fits that mood right now"
            body="The current picks do not match this lens. Loosen it and something surfaces."
            action={{
              label: "Show anything",
              onClick: () => {
                setMood("any");
                setPhase({ kind: "idle" });
              },
            }}
          />
        ) : interactions === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Not enough to go on yet"
            body="Rate about 20 films and Klyvi can make real recommendations, shows included. It takes about 90 seconds."
            action={{ label: "Start rating", href: "/onboarding/rate" }}
          />
        ) : (
          <EmptyState
            icon={Sparkles}
            title="You have seen everything Klyvi has for you"
            body="You have been through every pick in your current taste profile. Rate a few more titles and new ones open up."
            action={{ label: "Go to your library", href: "/library" }}
          />
        )}
      </Main>
    );
  }

  // ---------- the pick ----------
  const pick = phase.picks[phase.index];
  // A show's length is its season count, where a film's is its runtime.
  const length =
    pick.mediaType === "tv"
      ? formatSeasons(pick.seasonCount)
      : formatRuntime(pick.runtime);
  // Read at render, which only ever happens on the client here: the pick
  // view appears after the user asks for a set, so there is no server pass
  // to disagree with about the hour.
  const timePhrase = watchWindowPhrase();
  const total = phase.picks.length;
  const heading =
    total === 1
      ? `Your pick for ${timePhrase}`
      : `Your ${total} picks for ${timePhrase}`;
  const shrinking = total < phase.size && phase.reserve.length === 0;
  const ratingsNote =
    remaining != null && remaining > 0 && interactions !== 0
      ? `${remaining} more ${remaining === 1 ? "rating" : "ratings"} and Klyvi switches to your full taste profile.`
      : null;
  const ratingDialog = rating ? (
    <RatingDialog
      title={rating.title}
      year={rating.year}
      posterPath={rating.posterPath}
      open
      onOpenChange={(o) => !o && setRating(null)}
      onSubmit={submitRating}
    />
  ) : null;

  return (
    <>
      {embedded ? null : <AmbientArt path={pick.backdropPath ?? pick.posterPath} />}
      {frame(
        <PickPanel
          ref={panelRef}
          headerRef={topRef}
          cardRef={cardRef}
          swipe={swipe}
          swipeHint={!swiped}
          heading={heading}
          picks={phase.picks}
          index={phase.index}
          dir={dir}
          length={length}
          shrinking={shrinking}
          ratingsNote={ratingsNote}
          onGo={goTo}
          onSave={() => act("save")}
          onMore={() => openedDetail(pick)}
          onSeen={() => act("seen")}
          onDismiss={() => act("dismiss")}
          onNewSet={() => void fetchPicks()}
          onChangeMood={changeMood}
        />
      )}
      {ratingDialog}
    </>
  );
}
