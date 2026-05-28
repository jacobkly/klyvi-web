'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import * as React from 'react';
import { BookmarkPlus, Eye, CheckCircle2, Pause, type LucideIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PosterCard } from '@/components/media/poster-card';
import { libraryItems } from '@/lib/placeholder';
import type { MediaCard, WatchStatus } from '@/src/types/media';

function getTitle(item: MediaCard) {
  return item.type === 'movie' ? item.title : item.name;
}

interface TabDef {
  value: string;
  label: string;
  statuses: WatchStatus[];
  emptyIcon: LucideIcon;
  emptyHeadline: string;
  emptyBody: string;
}

const TABS: TabDef[] = [
  {
    value: 'watchlist',
    label: 'Watchlist',
    statuses: ['planning'],
    emptyIcon: BookmarkPlus,
    emptyHeadline: 'Nothing planned yet',
    emptyBody: 'Save things to watch by tapping the bookmark on any title.',
  },
  {
    value: 'watching',
    label: 'Watching',
    statuses: ['watching', 'rewatching'],
    emptyIcon: Eye,
    emptyHeadline: 'You\'re not watching anything',
    emptyBody: 'Start a series or movie and we\'ll keep your place here.',
  },
  {
    value: 'completed',
    label: 'Completed',
    statuses: ['completed'],
    emptyIcon: CheckCircle2,
    emptyHeadline: 'No completed titles yet',
    emptyBody: 'Mark something as watched and it\'ll land here.',
  },
  {
    value: 'dropped',
    label: 'Dropped',
    statuses: ['dropped', 'paused'],
    emptyIcon: Pause,
    emptyHeadline: 'Nothing dropped or paused',
    emptyBody: 'Titles you stop watching show up here so they\'re out of your feed.',
  },
];

function statusBadgeFor(status?: WatchStatus) {
  switch (status) {
    case 'watching':
      return { label: 'Watching', cn: 'bg-primary/20 text-primary border-primary/30' };
    case 'rewatching':
      return { label: 'Rewatching', cn: 'bg-accent/20 text-accent border-accent/30' };
    case 'completed':
      return { label: 'Completed', cn: 'bg-celebration/20 text-celebration border-celebration/30' };
    case 'paused':
      return { label: 'Paused', cn: 'bg-muted text-muted-foreground border-white/[0.06]' };
    case 'dropped':
      return { label: 'Dropped', cn: 'bg-destructive/15 text-destructive border-destructive/30' };
    case 'planning':
      return { label: 'Planning', cn: 'bg-card text-muted-foreground border-white/[0.06]' };
    default:
      return null;
  }
}

export function LibraryGrid() {
  const router = useRouter();
  const params = useSearchParams();
  const tabFromUrl = params.get('tab') ?? 'watchlist';
  const current = TABS.find((t) => t.value === tabFromUrl) ? tabFromUrl : 'watchlist';

  const totals = React.useMemo(() => {
    const out: Record<string, number> = {};
    TABS.forEach((t) => {
      out[t.value] = libraryItems.filter((i) =>
        i.status && t.statuses.includes(i.status)
      ).length;
    });
    return out;
  }, []);

  function setTab(v: string) {
    const sp = new URLSearchParams(params);
    sp.set('tab', v);
    router.replace(`/library?${sp.toString()}`, { scroll: false });
  }

  return (
    <Tabs value={current} onValueChange={setTab} className="mt-6">
      <TabsList className="w-full md:w-auto overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <TabsTrigger key={t.value} value={t.value} className="whitespace-nowrap">
            {t.label}
            <span className="ml-2 rounded-full bg-background/40 px-1.5 py-0.5 text-[10px] tabular-nums">
              {totals[t.value]}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      {TABS.map((t) => {
        const items = libraryItems.filter(
          (i) => i.status && t.statuses.includes(i.status)
        );
        const isEmpty = items.length === 0;
        const Icon = t.emptyIcon;
        return (
          <TabsContent key={t.value} value={t.value}>
            {isEmpty ? (
              <div className="mt-6 grid place-items-center rounded-2xl hairline bg-card/30 py-16 px-6 text-center">
                <div className="grid size-12 place-items-center rounded-full bg-card hairline">
                  <Icon className="size-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <h2 className="mt-4 text-lg font-semibold">{t.emptyHeadline}</h2>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t.emptyBody}</p>
                <Button asChild className="mt-6" size="sm">
                  <Link href="/">Browse recommendations</Link>
                </Button>
              </div>
            ) : (
              <ul className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {items.map((item) => {
                  const badge = statusBadgeFor(item.status);
                  return (
                    <li key={item.id}>
                      <PosterCard
                        id={item.id}
                        title={getTitle(item)}
                        year={item.release_year}
                        posterPath={item.poster_path}
                        voteAverage={item.vote_average}
                        fill
                        badgeSlot={
                          badge && (
                            <span
                              className={`inline-flex items-center rounded-full border backdrop-blur-md px-2 py-0.5 text-[10px] font-medium ${badge.cn}`}
                            >
                              {badge.label}
                            </span>
                          )
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
