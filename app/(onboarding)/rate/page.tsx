'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart,
  ThumbsUp,
  Meh,
  ThumbsDown,
  EyeOff,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn, tmdb } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AmbientBlobs } from '@/components/motion/ambient-blobs';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { pickOnboardingPool, type OnboardingPoolItem } from '@/lib/api/onboarding-pool';
import { recordInteraction } from '@/lib/api/interactions';
import { getMovie } from '@/lib/api/movies';
import { ApiError } from '@/lib/api/client';
import { useAccessToken, useSupabaseUser } from '@/lib/hooks/use-supabase-user';

interface OnboardingCard extends OnboardingPoolItem {
  posterPath: string;
}

type Verdict = 'loved' | 'liked' | 'meh' | 'disliked' | 'skipped';

const ACTIONS: {
  verdict: Verdict;
  label: string;
  icon: LucideIcon;
  classes: string;
}[] = [
  { verdict: 'loved', label: 'Loved it', icon: Heart, classes: 'bg-celebration text-celebration-foreground hover:brightness-110' },
  { verdict: 'liked', label: 'Liked it', icon: ThumbsUp, classes: 'bg-primary text-primary-foreground hover:bg-accent' },
  { verdict: 'meh', label: 'Meh', icon: Meh, classes: 'bg-muted text-foreground hover:bg-muted/80' },
  { verdict: 'disliked', label: 'Disliked', icon: ThumbsDown, classes: 'border border-white/[0.12] bg-transparent text-foreground hover:bg-muted/40' },
  { verdict: 'skipped', label: "Haven't seen", icon: EyeOff, classes: 'text-muted-foreground hover:text-foreground' },
];

/** Maps a swipe verdict to the 0..100 rating the API expects. */
function verdictRating(v: Verdict): number | null {
  switch (v) {
    case 'loved':
      return 95;
    case 'liked':
      return 80;
    case 'meh':
      return 50;
    case 'disliked':
      return 20;
    case 'skipped':
      return null;
  }
}

export default function RatePage() {
  const router = useRouter();
  const { user, loading: authLoading, unavailable } = useSupabaseUser();
  const token = useAccessToken();
  const pool = React.useMemo(() => pickOnboardingPool(10, user?.id ?? 'beta'), [user?.id]);

  const [titles, setTitles] = React.useState<OnboardingCard[]>([]);
  const [titlesLoading, setTitlesLoading] = React.useState(true);
  const [titlesError, setTitlesError] = React.useState<string | null>(null);

  // Fetch poster paths from the catalog. Lands fast against the seeded cache.
  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setTitlesLoading(true);
    setTitlesError(null);
    Promise.all(
      pool.map((p) =>
        getMovie(p.tmdb_id, { idType: 'tmdb' })
          .then((m) =>
            m && m.poster_path
              ? ({ ...p, posterPath: m.poster_path } as OnboardingCard)
              : null
          )
          .catch(() => null)
      )
    )
      .then((cards) => {
        if (cancelled) return;
        const ok = cards.filter((c): c is OnboardingCard => c !== null);
        setTitles(ok);
        if (ok.length === 0) {
          setTitlesError('Couldn\'t load the onboarding pool. Is the API running?');
        }
      })
      .finally(() => {
        if (!cancelled) setTitlesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pool, user]);

  const total = titles.length;

  const [i, setI] = React.useState(0);
  const [results, setResults] = React.useState<Record<number, Verdict>>({});
  const [direction, setDirection] = React.useState<1 | -1>(1);
  const [confirmSkip, setConfirmSkip] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const current = titles[i];

  async function record(verdict: Verdict) {
    if (!current) return;
    setResults((prev) => ({ ...prev, [current.tmdb_id]: verdict }));
    setDirection(1);

    // Fire interaction in the background (don't block UI).
    const rating = verdictRating(verdict);
    if (token && rating !== null) {
      recordInteraction(token, {
        tmdb_id: current.tmdb_id,
        media_type: 'movie',
        kind: 'rated',
        rating,
        source: 'onboarding',
      }).catch((e) => {
        const msg = e instanceof ApiError ? e.message : 'Failed to record rating';
        toast.error(msg);
      });
    }

    if (i + 1 >= total) {
      setDone(true);
    } else {
      setI(i + 1);
    }
  }

  // Touch swipe support — basic
  const touchStart = React.useRef<{ x: number; y: number } | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      record(dx > 0 ? 'liked' : 'disliked');
    }
  }

  if (authLoading) {
    return <div className="grid min-h-dvh place-items-center text-muted-foreground text-sm">Loading…</div>;
  }

  if (unavailable) {
    return (
      <div className="grid min-h-dvh place-items-center px-4">
        <div className="max-w-md w-full rounded-2xl hairline bg-card/40 p-6 flex items-start gap-3">
          <AlertTriangle className="size-5 text-destructive mt-0.5" strokeWidth={2} />
          <div>
            <div className="font-semibold">Sign-in not configured</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Onboarding records your ratings to your account. Add Supabase env vars to enable.
            </p>
            <Button asChild className="mt-4" size="sm">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    // Should be redirected by middleware, but render a safe net.
    router.replace('/signin?next=/rate');
    return null;
  }

  if (titlesLoading) {
    return (
      <div className="relative grid min-h-dvh place-items-center">
        <AmbientBlobs intensity="low" />
        <div className="text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-card hairline">
            <Sparkles className="size-5 text-accent motion-safe:animate-pulse" strokeWidth={1.5} />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Loading your onboarding pool…</p>
        </div>
      </div>
    );
  }

  if (titlesError || total === 0) {
    return (
      <div className="relative grid min-h-dvh place-items-center px-4">
        <div className="max-w-md w-full rounded-2xl hairline bg-card/40 p-6 flex items-start gap-3">
          <AlertTriangle className="size-5 text-destructive mt-0.5" strokeWidth={2} />
          <div>
            <div className="font-semibold">Couldn&apos;t load onboarding</div>
            <p className="mt-1 text-sm text-muted-foreground">{titlesError ?? 'Pool is empty.'}</p>
            <Button asChild className="mt-4" size="sm">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (done) {
    const counts = Object.values(results).reduce<Record<Verdict, number>>(
      (acc, v) => ({ ...acc, [v]: (acc[v] ?? 0) + 1 }),
      { loved: 0, liked: 0, meh: 0, disliked: 0, skipped: 0 }
    );
    return (
      <div className="relative grid min-h-dvh place-items-center px-4 py-12">
        <AmbientBlobs intensity="high" />
        <div className="text-center max-w-md">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-card hairline motion-safe:animate-fade-up">
            <Sparkles className="size-7 text-celebration" strokeWidth={1.5} />
          </div>
          <h1 className="mt-6 text-balance text-3xl md:text-5xl font-semibold tracking-tight">
            Your taste is taking shape.
          </h1>
          <p className="mt-3 text-sm md:text-base text-muted-foreground tabular-nums">
            <span className="text-celebration font-medium">{counts.loved}</span> loved ·{' '}
            <span className="text-foreground font-medium">{counts.liked}</span> liked ·{' '}
            <span className="text-foreground">{counts.meh}</span> meh ·{' '}
            <span className="text-foreground">{counts.disliked}</span> disliked
          </p>
          <Button asChild className="mt-8" size="lg">
            <Link href="/">
              See my recommendations
              <ArrowRight className="size-4" strokeWidth={1.5} />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const pct = ((i + 1) / total) * 100;

  return (
    <div className="relative grid min-h-dvh grid-rows-[auto_1fr_auto] gap-4 px-4 py-6 md:px-8">
      <AmbientBlobs intensity="low" />

      <header className="flex items-center gap-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Klyvi
        </Link>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={i + 1}
          aria-label={`Step ${i + 1} of ${total}`}
          className="flex-1 mx-2 md:mx-6 flex items-center gap-1.5"
        >
          {titles.map((_, idx) => (
            <span
              key={idx}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors duration-base',
                idx < i ? 'bg-primary' : idx === i ? 'bg-accent' : 'bg-white/10'
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setConfirmSkip(true)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-instant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-1"
        >
          Skip
        </button>
      </header>

      <div className="flex flex-col items-center justify-center">
        <div className="text-xs uppercase tracking-wider text-muted-foreground tabular-nums">
          {i + 1} of {total} · {Math.round(pct)}%
        </div>
        <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="mt-4 w-full max-w-[280px] md:max-w-sm">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.tmdb_id}
              initial={{ opacity: 0, y: direction * 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -direction * 16, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="hairline rounded-2xl overflow-hidden shadow-glow"
            >
              <AspectRatio ratio={2 / 3}>
                <Image
                  src={tmdb(current.posterPath, 'w500')}
                  alt={`${current.title} poster`}
                  fill
                  sizes="(max-width: 768px) 80vw, 400px"
                  priority
                  className="object-cover bg-muted"
                />
              </AspectRatio>
            </motion.div>
          </AnimatePresence>
          <div className="mt-4 text-center">
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight">{current.title}</h2>
            <div className="text-sm text-muted-foreground tabular-nums">{current.year}</div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
          {ACTIONS.map(({ verdict, label, icon: Icon, classes }) => (
            <button
              key={verdict}
              type="button"
              onClick={() => record(verdict)}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-instant ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-safe:active:scale-[0.97]',
                classes
              )}
            >
              <Icon className="size-4" strokeWidth={1.5} />
              {label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground md:hidden">
          Swipe right to like, left to dislike.
        </p>
      </div>

      <Dialog open={confirmSkip} onOpenChange={setConfirmSkip}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skip onboarding?</DialogTitle>
            <DialogDescription>
              You can rate things any time from the catalog. Your feed gets sharper as you do.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmSkip(false)}>Keep going</Button>
            <Button variant="destructive" onClick={() => router.push('/')}>Skip</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
