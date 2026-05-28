'use client';

import * as React from 'react';
import Link from 'next/link';
import { Sparkles, AlertTriangle } from 'lucide-react';
import { useAccessToken, useSupabaseUser } from '@/lib/hooks/use-supabase-user';
import { getRecoFeed } from '@/lib/api/reco';
import { ApiError } from '@/lib/api/client';
import { AmbientBlobs } from '@/components/motion/ambient-blobs';
import { FeaturedCard } from '@/components/feed/featured-card';
import { FeedRow } from '@/components/media/feed-row';
import { PosterCard } from '@/components/media/poster-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import type { Scored } from '@/lib/api/types';
import type { MediaCard } from '@/src/types/media';

function scoredToCard(s: Scored): MediaCard | null {
  // Backend inlines display fields. Filter out the rare cache-miss case.
  if (!s.Title || !s.PosterPath) return null;
  return {
    id: s.TMDBID || s.MediaID,
    title: s.Title,
    release_year: s.ReleaseYear,
    poster_path: s.PosterPath,
    vote_average: s.VoteAverage,
    overview: '',
    type: s.MediaType === 'movie' ? 'movie' : 'tv',
  } as MediaCard;
}

function FeedSkeleton() {
  return (
    <div className="space-y-12 mt-8">
      <Skeleton className="aspect-[21/9] w-full rounded-2xl" />
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] w-40 shrink-0 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function HomeFeed() {
  const { user, loading: authLoading, unavailable } = useSupabaseUser();
  const token = useAccessToken();
  const signedIn = !!user && !unavailable;

  const [items, setItems] = React.useState<MediaCard[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (authLoading) return;
    if (!signedIn || !token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getRecoFeed(token)
      .then((raw) => {
        const cards = raw
          .map((s) => scoredToCard(s))
          .filter((c): c is MediaCard => c !== null);
        if (!cancelled) setItems(cards);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : 'Failed to load feed.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, signedIn, token]);

  // Signed-out marketing-style hero.
  if (!authLoading && !signedIn) {
    return <SignedOutHero unavailable={unavailable} />;
  }

  if (loading || authLoading) {
    return (
      <div className="relative pb-16">
        <AmbientBlobs />
        <section className="px-4 md:px-8 pt-10 md:pt-16">
          <div className="inline-flex items-center gap-2 rounded-full hairline bg-card/50 px-3 py-1 text-xs uppercase tracking-wider text-accent">
            <Sparkles className="size-3" strokeWidth={1.5} />
            Recommended for you
          </div>
          <Skeleton className="h-12 w-80 mt-4" />
          <Skeleton className="h-4 w-96 mt-3" />
          <FeedSkeleton />
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 md:px-8 pt-10 md:pt-16">
        <div className="mx-auto max-w-md rounded-xl hairline bg-card/40 p-6 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-card hairline">
            <AlertTriangle className="size-5 text-destructive" strokeWidth={1.5} />
          </div>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">Couldn&apos;t load your feed</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Make sure the Klyvi API is running at the configured URL.
          </p>
        </div>
      </div>
    );
  }

  // Empty (cold-start with no items returned).
  if (items.length === 0) {
    return (
      <div className="px-4 md:px-8 pt-10 md:pt-16">
        <h1 className="text-balance text-4xl md:text-5xl font-semibold tracking-tight">
          Your feed is warming up.
        </h1>
        <p className="mt-3 max-w-prose text-muted-foreground">
          Rate a few things and we&apos;ll start tailoring picks to your taste.
        </p>
        <Button asChild className="mt-6">
          <Link href="/rate">Start onboarding →</Link>
        </Button>
      </div>
    );
  }

  const featured = items[0];
  const rest = items.slice(1);

  // Split the rest into two rows (heuristic — backend doesn't expose themes yet).
  const rowA = rest.slice(0, 8);
  const rowB = rest.slice(8, 16);
  const tail = rest.slice(16);

  return (
    <div className="relative pb-16">
      <AmbientBlobs />

      <section className="px-4 md:px-8 pt-10 md:pt-16">
        <div className="inline-flex items-center gap-2 rounded-full hairline bg-card/50 px-3 py-1 text-xs uppercase tracking-wider text-accent">
          <Sparkles className="size-3" strokeWidth={1.5} />
          Updated just now
        </div>
        <h1 className="mt-4 text-balance text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight">
          Recommended for you
        </h1>
        <p className="mt-3 max-w-prose text-muted-foreground">
          A feed that gets sharper every time you rate, log, or dismiss. Tap anything to see why it&apos;s here.
        </p>
      </section>

      <section className="px-4 md:px-8 mt-8">
        <FeaturedCard item={featured} />
      </section>

      {rowA.length > 0 && (
        <section className="px-4 md:px-8 mt-12">
          <FeedRow heading="Top picks for you">
            {rowA.map((item, i) => (
              <li
                key={`a-${item.id}`}
                className="motion-safe:animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <PosterCard
                  id={item.id}
                  title={item.type === 'movie' ? item.title : item.name}
                  year={item.release_year}
                  posterPath={item.poster_path}
                  voteAverage={item.vote_average}
                  size="md"
                />
              </li>
            ))}
          </FeedRow>
        </section>
      )}

      {rowB.length > 0 && (
        <section className="px-4 md:px-8 mt-12">
          <FeedRow heading="More you might like" subheading="Lower-confidence picks worth a look.">
            {rowB.map((item, i) => (
              <li
                key={`b-${item.id}`}
                className="motion-safe:animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <PosterCard
                  id={item.id}
                  title={item.type === 'movie' ? item.title : item.name}
                  year={item.release_year}
                  posterPath={item.poster_path}
                  voteAverage={item.vote_average}
                  size="md"
                />
              </li>
            ))}
          </FeedRow>
        </section>
      )}

      {tail.length > 0 && (
        <section className="px-4 md:px-8 mt-12">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">More for you</h2>
          <ul className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tail.map((item) => (
              <li key={`t-${item.id}`}>
                <PosterCard
                  id={item.id}
                  title={item.type === 'movie' ? item.title : item.name}
                  year={item.release_year}
                  posterPath={item.poster_path}
                  voteAverage={item.vote_average}
                  size="md"
                  fill
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function SignedOutHero({ unavailable }: { unavailable: boolean }) {
  return (
    <div className="relative pb-16">
      <AmbientBlobs />
      <section className="px-4 md:px-8 pt-16 md:pt-24">
        <div className="inline-flex items-center gap-2 rounded-full hairline bg-card/50 px-3 py-1 text-xs uppercase tracking-wider text-accent">
          <Sparkles className="size-3" strokeWidth={1.5} />
          Beta
        </div>
        <h1 className="mt-6 text-balance text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight max-w-3xl">
          Find what to watch next, without the decision fatigue.
        </h1>
        <p className="mt-4 max-w-prose text-muted-foreground text-balance">
          Klyvi learns your taste from a single rating and gets sharper the more you log.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {!unavailable ? (
            <>
              <Button asChild size="lg">
                <Link href="/signin">Sign in to get started</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/media/496243">Try the demo</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="outline" size="lg">
                <Link href="/media/496243">Browse a sample title</Link>
              </Button>
              <span className="text-xs text-muted-foreground self-center">
                Sign-in not configured — add Supabase env vars to enable accounts.
              </span>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
