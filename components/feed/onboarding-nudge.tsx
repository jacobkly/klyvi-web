'use client';

import * as React from 'react';
import Link from 'next/link';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import { listInteractions } from '@/lib/api/interactions';
import { useAccessToken, useSupabaseUser } from '@/lib/hooks/use-supabase-user';
import { Button } from '@/components/ui/button';

const DISMISS_KEY = 'klyvi-nudge-dismissed';

/**
 * Banner above the home feed nudging cold-start users into onboarding.
 *
 * Visible iff: signed in AND interaction history is empty AND user hasn't
 * dismissed before. One dismissal is permanent (localStorage).
 */
export function OnboardingNudge() {
  const { user, unavailable } = useSupabaseUser();
  const token = useAccessToken();
  const [show, setShow] = React.useState(false);
  const [dismissed, setDismissed] = React.useState<boolean | null>(null);

  // Hydrate dismissal state from localStorage.
  React.useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
    } catch {
      setDismissed(false);
    }
  }, []);

  // Probe interactions once. If empty AND not dismissed, show.
  React.useEffect(() => {
    if (unavailable || !user || !token || dismissed === null) return;
    if (dismissed) return;
    let cancelled = false;
    listInteractions(token, { sinceDays: 365 })
      .then((rows) => {
        if (cancelled) return;
        if (rows.length === 0) setShow(true);
      })
      .catch(() => {
        // Silent — don't block the feed for a banner.
      });
    return () => {
      cancelled = true;
    };
  }, [user, token, unavailable, dismissed]);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {}
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="px-4 md:px-8 pt-6">
      <div className="relative overflow-hidden rounded-xl hairline bg-gradient-to-r from-primary/15 via-accent/10 to-celebration/10 px-4 py-3 md:px-5 md:py-4">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-card hairline">
            <Sparkles className="size-4 text-accent" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm md:text-base font-medium">
              Get personalized recs in 90 seconds
            </div>
            <p className="mt-0.5 text-xs md:text-sm text-muted-foreground">
              Rate ten films you&apos;ve seen — your feed gets sharper immediately.
            </p>
          </div>
          <Button asChild size="sm" className="shrink-0">
            <Link href="/rate">
              Start
              <ArrowRight className="size-4" strokeWidth={1.5} />
            </Link>
          </Button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors duration-instant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-[0.96]"
          >
            <X className="size-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
