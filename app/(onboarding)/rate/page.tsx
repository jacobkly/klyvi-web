'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, ThumbsUp, Meh, ThumbsDown, EyeOff, Sparkles, ArrowRight, type LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { onboardingTitles } from '@/lib/placeholder';

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

export default function RatePage() {
  const router = useRouter();
  const titles = onboardingTitles;
  const total = titles.length;

  const [i, setI] = React.useState(0);
  const [results, setResults] = React.useState<Record<number, Verdict>>({});
  const [direction, setDirection] = React.useState<1 | -1>(1);
  const [confirmSkip, setConfirmSkip] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const current = titles[i];

  function record(verdict: Verdict) {
    setResults((prev) => ({ ...prev, [current.id]: verdict }));
    setDirection(1);
    if (i + 1 >= total) {
      setDone(true);
    } else {
      setI(i + 1);
    }
  }

  // Swipe support — basic touch swipe left/right to record liked/meh
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

      {/* Top bar */}
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
        <div
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="mt-4 w-full max-w-[280px] md:max-w-sm"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: direction * 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -direction * 16, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="hairline rounded-2xl overflow-hidden shadow-glow"
            >
              <AspectRatio ratio={2 / 3}>
                <Image
                  src={tmdb(current.poster_path, 'w500')}
                  alt={`${current.title} poster`}
                  fill
                  sizes="(max-width: 768px) 80vw, 400px"
                  priority
                  className="object-cover"
                />
              </AspectRatio>
            </motion.div>
          </AnimatePresence>
          <div className="mt-4 text-center">
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
              {current.title}
            </h2>
            <div className="text-sm text-muted-foreground tabular-nums">
              {current.year}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
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

      {/* Skip confirm dialog */}
      <Dialog open={confirmSkip} onOpenChange={setConfirmSkip}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skip onboarding?</DialogTitle>
            <DialogDescription>
              You can rate things any time from the catalog. Your feed gets sharper as you do.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmSkip(false)}>
              Keep going
            </Button>
            <Button variant="destructive" onClick={() => router.push('/')}>
              Skip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
