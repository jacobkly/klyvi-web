'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { BookmarkPlus, Check, Eye, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAccessToken, useSupabaseUser } from '@/lib/hooks/use-supabase-user';
import { recordInteraction } from '@/lib/api/interactions';
import { addTracking } from '@/lib/api/tracking';
import { ApiError } from '@/lib/api/client';

interface MediaActionsProps {
  title: string;
  tmdbId: number;
  mediaType: 'movie' | 'season';
  seasonNumber?: number;
}

export function MediaActions({ title, tmdbId, mediaType, seasonNumber }: MediaActionsProps) {
  const router = useRouter();
  const { user, unavailable } = useSupabaseUser();
  const token = useAccessToken();
  const signedIn = !!user && !unavailable;

  const [logged, setLogged] = React.useState(false);
  const [watchlisted, setWatchlisted] = React.useState(false);
  const [busy, setBusy] = React.useState<'log' | 'watchlist' | null>(null);

  function requireAuth(): boolean {
    if (signedIn && token) return true;
    if (unavailable) {
      toast.error('Sign-in is not configured yet.', {
        description: 'Add Supabase env vars to enable accounts.',
      });
      return false;
    }
    router.push(`/signin?next=${encodeURIComponent(window.location.pathname)}`);
    return false;
  }

  async function onLog() {
    if (!requireAuth()) return;
    setBusy('log');
    try {
      await recordInteraction(token!, {
        tmdb_id: tmdbId,
        media_type: mediaType,
        season_number: mediaType === 'season' ? seasonNumber ?? null : null,
        kind: 'logged',
        source: 'detail',
      });
      setLogged(true);
      toast.success('Added to your log.', { description: title });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Failed to log.';
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  }

  async function onWatchlist() {
    if (!requireAuth()) return;
    setBusy('watchlist');
    try {
      await addTracking(token!, {
        tmdb_id: tmdbId,
        media_type: mediaType,
        season_number: mediaType === 'season' ? seasonNumber ?? null : null,
        status: 'planning',
      });
      // Also record a 'saved' interaction so the recommender notices.
      void recordInteraction(token!, {
        tmdb_id: tmdbId,
        media_type: mediaType,
        season_number: mediaType === 'season' ? seasonNumber ?? null : null,
        kind: 'saved',
        source: 'detail',
      }).catch(() => {});
      setWatchlisted(true);
      toast('Saved to watchlist', { description: title });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Failed to save.';
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  }

  if (unavailable) {
    return (
      <div className="rounded-lg hairline bg-card/40 px-3 py-2 text-xs text-muted-foreground">
        Sign-in not configured — actions are disabled. Add Supabase env vars to enable.
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button
          asChild
          size="lg"
          className="relative isolate"
        >
          <a
            href={`/signin?next=${typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname) : '/'}`}
          >
            <LogIn className="size-4" strokeWidth={1.5} />
            Sign in to log
          </a>
        </Button>
        <span className="text-xs text-muted-foreground">
          Track what you watch and unlock personalized recs.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <div className="relative isolate">
        {!logged && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 rounded-lg bg-primary/40 blur-2xl"
          />
        )}
        <Button
          onClick={onLog}
          variant={logged ? 'secondary' : 'default'}
          size="lg"
          aria-pressed={logged}
          disabled={busy === 'log'}
        >
          {logged ? (
            <>
              <Check className="size-4" strokeWidth={2} />
              Logged
            </>
          ) : (
            <>
              <Eye className="size-4" strokeWidth={1.5} />
              {busy === 'log' ? 'Logging…' : 'Log'}
            </>
          )}
        </Button>
      </div>
      <Button
        onClick={onWatchlist}
        variant="outline"
        size="lg"
        aria-pressed={watchlisted}
        disabled={busy === 'watchlist'}
      >
        <BookmarkPlus className="size-4" strokeWidth={1.5} />
        {watchlisted ? 'In Watchlist' : busy === 'watchlist' ? 'Saving…' : 'Add to Watchlist'}
      </Button>
    </div>
  );
}
