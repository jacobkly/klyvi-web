'use client';

import * as React from 'react';
import { BookmarkPlus, Check, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface MediaActionsProps {
  title: string;
}

export function MediaActions({ title }: MediaActionsProps) {
  const [logged, setLogged] = React.useState(false);
  const [watchlisted, setWatchlisted] = React.useState(false);

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
          onClick={() => {
            setLogged(true);
            toast.success('Added to your log.', {
              description: `${title} marked as watched.`,
            });
          }}
          variant={logged ? 'secondary' : 'default'}
          size="lg"
          aria-pressed={logged}
        >
          {logged ? (
            <>
              <Check className="size-4" strokeWidth={2} />
              Logged
            </>
          ) : (
            <>
              <Eye className="size-4" strokeWidth={1.5} />
              Log
            </>
          )}
        </Button>
      </div>
      <Button
        onClick={() => {
          setWatchlisted((w) => !w);
          toast(watchlisted ? 'Removed from watchlist' : 'Saved to watchlist', {
            description: title,
          });
        }}
        variant="outline"
        size="lg"
        aria-pressed={watchlisted}
      >
        <BookmarkPlus className="size-4" strokeWidth={1.5} />
        {watchlisted ? 'In Watchlist' : 'Add to Watchlist'}
      </Button>
    </div>
  );
}
