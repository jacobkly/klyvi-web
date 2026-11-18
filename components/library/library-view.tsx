"use client";

import * as React from "react";
import { Library as LibraryIcon, Pencil, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/klyvi/empty-state";
import { PosterCard } from "@/components/klyvi/poster-card";
import { ScoreValue } from "@/components/klyvi/score-value";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PosterCardSkeleton } from "@/components/klyvi/skeletons";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  filterLibrary,
  sortLibrary,
  startingSort,
  type LibraryFilters,
  type LibrarySortKey,
  type SortOrder,
} from "@/lib/library-filter";
import type { PageSink } from "@/lib/api/tracking";
import { usePref } from "@/lib/local-prefs";
import {
  STATUS_LABELS,
  STATUS_VERBS,
  type LibraryEntry,
  type MediaType,
  type TrackingStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { FilterPanel } from "./filter-panel";
import { TrackingDialog, type TrackingEdit } from "./tracking-dialog";
import { ViewSwitcher, type LibraryViewMode } from "./view-switcher";

/** Section order when the library shows all statuses grouped. */
const GROUP_ORDER: TrackingStatus[] = [
  "watching",
  "rewatching",
  "paused",
  "completed",
  "dropped",
  "planning",
];

/** One empty list for every not-ready render, so memos keyed on it hold. */
const NO_ENTRIES: LibraryEntry[] = [];

type LoadState =
  | { phase: "loading" }
  | { phase: "error" }
  | { phase: "ready"; entries: LibraryEntry[] };

/**
 * The golden screen's client orchestrator. Owns the slice state, the three
 * view modes, the tracking dialog, and the optimistic edit loop. Data arrives
 * through `load` so the mock layer swaps for the API client without touching
 * this file. A big library arrives in pages: `load` resolves with the first
 * and hands the rest to its sink as they land.
 */
/** Adds a later page's rows to the ones on screen. A row already held stays
 *  as it is: the user may have changed it here since the page was read. */
function appendNew(held: LibraryEntry[], more: LibraryEntry[]): LibraryEntry[] {
  const ids = new Set(held.map((e) => e.mediaId));
  const fresh = more.filter((e) => !ids.has(e.mediaId));
  return fresh.length > 0 ? [...held, ...fresh] : held;
}

function LibraryView({
  load,
  onStatusChange,
  onSave,
  onDelete,
}: {
  load: (more?: PageSink) => Promise<LibraryEntry[]>;
  /** Persist a quick status change. Absent = optimistic-only (mock mode). */
  onStatusChange?: (e: LibraryEntry, next: TrackingStatus) => Promise<void>;
  /** Persist a dialog edit. Absent = optimistic-only (mock mode). */
  onSave?: (e: LibraryEntry, edit: TrackingEdit) => Promise<void>;
  /** Persist a removal. Throw with { status: 404 } and it stays silent. */
  onDelete?: (e: LibraryEntry) => Promise<void>;
}) {
  const [state, setState] = React.useState<LoadState>({ phase: "loading" });
  const [filters, setFilters] = React.useState<LibraryFilters>({
    status: "all",
    type: "all",
    query: "",
  });
  // Settings' default list order is the starting sort, used until a pick
  // here. Derived rather than copied into state, so the stored pref still
  // lands after hydration (the server snapshot is the default).
  const [listOrder] = usePref("listOrder");
  const [picked, setPicked] = React.useState<{
    key: LibrarySortKey;
    order: SortOrder;
  } | null>(null);
  const { key: sortKey, order: sortOrder } = picked ?? startingSort(listOrder);
  // Combine films and TV off: Films and TV tabs, and each tab is its own
  // library (counts, statuses, filters), so the Type filter steps aside.
  const [combine] = usePref("combineLists");
  const [tab, setTab] = React.useState<MediaType>("movie");
  // Remembered across visits: the density choice is a preference, not a
  // per-session toggle, so it persists (and syncs) like the theme settings.
  const [view, setView] = usePref("libraryView");
  const [editing, setEditing] = React.useState<LibraryEntry | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  /** Bumped by the error state's Try again to reload. */
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    let live = true;
    load({
      live: () => live,
      page: (more) =>
        setState((s) =>
          s.phase === "ready"
            ? { phase: "ready", entries: appendNew(s.entries, more) }
            : s
        ),
      failed: () =>
        toast("Could not load all of your library", {
          action: { label: "Try again", onClick: retry },
        }),
    })
      .then((entries) => {
        if (live) setState({ phase: "ready", entries });
      })
      .catch(() => {
        if (live) setState({ phase: "error" });
      });
    return () => {
      live = false;
    };
  }, [load, attempt]);

  function retry() {
    setState({ phase: "loading" });
    setAttempt((n) => n + 1);
  }

  const all = state.phase === "ready" ? state.entries : NO_ENTRIES;
  const entries = React.useMemo(
    () => (combine ? all : all.filter((e) => e.mediaType === tab)),
    [all, combine, tab]
  );
  const filtered = sortLibrary(
    filterLibrary(entries, combine ? filters : { ...filters, type: "all" }),
    sortKey,
    sortOrder
  );
  const split = combine ? null : { tab, onTabChange: setTab };

  const counts = React.useMemo(() => {
    const c = {
      all: entries.length,
      watching: 0,
      planning: 0,
      completed: 0,
      rewatching: 0,
      paused: 0,
      dropped: 0,
    };
    for (const e of entries) c[e.status]++;
    return c;
  }, [entries]);

  const activeFilterCount =
    (filters.status !== "all" ? 1 : 0) +
    (combine && filters.type !== "all" ? 1 : 0) +
    (filters.query.trim() ? 1 : 0);

  /** Optimistic status change with rollback toast (06-copy.md §3). */
  function changeStatus(entry: LibraryEntry, next: TrackingStatus) {
    if (state.phase !== "ready") return;
    const prev = state.entries;
    setState({
      phase: "ready",
      entries: prev.map((e) =>
        e.mediaId === entry.mediaId ? { ...e, status: next } : e
      ),
    });
    toast(`${STATUS_VERBS[next]}`);
    onStatusChange?.(entry, next).catch(() => {
      setState({ phase: "ready", entries: prev });
      toast("Could not update that. Try again");
    });
  }

  function saveEdit(entry: LibraryEntry, edit: TrackingEdit) {
    if (state.phase !== "ready") return;
    const prev = state.entries;
    setState({
      phase: "ready",
      entries: prev.map((e) =>
        e.mediaId === entry.mediaId
          ? {
              ...e,
              status: edit.status,
              score: edit.score,
              progress: edit.progress,
              notes: edit.notes,
            }
          : e
      ),
    });
    onSave?.(entry, edit).catch(() => {
      setState({ phase: "ready", entries: prev });
      toast("Could not update that. Try again");
    });
  }

  function deleteEntry(entry: LibraryEntry) {
    if (state.phase !== "ready") return;
    const prev = state.entries;
    setState({
      phase: "ready",
      entries: prev.filter((e) => e.mediaId !== entry.mediaId),
    });
    setEditing(null);
    toast("Removed from your library");
    onDelete?.(entry).catch((err: unknown) => {
      // Already gone server-side: the optimistic removal was right, stay
      // silent (06-copy.md, the 404-on-delete rule).
      if ((err as { status?: number })?.status === 404) return;
      setState({ phase: "ready", entries: prev });
      toast("Could not update that. Try again");
    });
  }

  function surprise() {
    if (filtered.length === 0) return;
    const pick = filtered[Math.floor(Math.random() * filtered.length)];
    setEditing(pick);
  }

  // ---------- states ----------

  if (state.phase === "loading") {
    return (
      <LibraryFrame counts={counts} filters={filters} onFiltersChange={setFilters}
        sortKey={sortKey} sortOrder={sortOrder}
        onSortChange={(key, order) => setPicked({ key, order })}
        view={view} onViewChange={setView} onSurprise={surprise}
        activeFilterCount={activeFilterCount} sheetOpen={sheetOpen} onSheetOpenChange={setSheetOpen}
        total={null} split={split}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <PosterCardSkeleton key={i} variant="compact" />
          ))}
        </div>
      </LibraryFrame>
    );
  }

  if (state.phase === "error") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <p className="text-[15px] font-semibold text-foreground">
          Could not load your library.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Something went wrong on Klyvi&apos;s end.
        </p>
        <Button className="mt-5" onClick={retry}>
          Try again
        </Button>
      </div>
    );
  }

  // Never tracked anything at all. Rendered INSIDE the frame rather than
  // instead of it: dropping the sidebar left a new user staring at a lone
  // paragraph on an empty page, with no sign of what the library will look
  // like once it has something in it.
  if (all.length === 0) {
    return (
      <LibraryFrame counts={counts} filters={filters} onFiltersChange={setFilters}
        sortKey={sortKey} sortOrder={sortOrder}
        onSortChange={(key, order) => setPicked({ key, order })}
        view={view} onViewChange={setView} onSurprise={surprise}
        activeFilterCount={activeFilterCount} sheetOpen={sheetOpen} onSheetOpenChange={setSheetOpen}
        total={0} split={split}
      >
        <div className="flex flex-1 items-center justify-center">
          <EmptyState
            icon={LibraryIcon}
            title="Nothing tracked yet"
            body="Log something you have watched and Klyvi starts learning what you like."
            action={{ label: "Find something to watch", href: "/find" }}
          />
        </div>
      </LibraryFrame>
    );
  }

  const hasMissingArt = entries.some((e) => e.posterPath === null);

  return (
    <>
      <LibraryFrame counts={counts} filters={filters} onFiltersChange={setFilters}
        sortKey={sortKey} sortOrder={sortOrder}
        onSortChange={(key, order) => setPicked({ key, order })}
        view={view} onViewChange={setView} onSurprise={surprise}
        activeFilterCount={activeFilterCount} sheetOpen={sheetOpen} onSheetOpenChange={setSheetOpen}
        total={all.length} split={split}
      >
        {hasMissingArt ? (
          <p className="mb-4 text-xs text-muted-foreground">
            Artwork is still loading for some titles.
          </p>
        ) : null}

        {entries.length === 0 ? (
          <EmptyState
            icon={LibraryIcon}
            title={tab === "movie" ? "No films tracked yet" : "No TV tracked yet"}
            body="Anything you track in this half of your library shows up here."
            action={{ label: "Find something to watch", href: "/find" }}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={SlidersHorizontal}
            title="No matches"
            body="Nothing in your library fits those filters."
            action={{
              label: "Clear filters",
              onClick: () =>
                setFilters({ status: "all", type: "all", query: "" }),
            }}
          />
        ) : filters.status === "all" ? (
          // Grouped by status with quiet headers, the AniList structure.
          // Grouping holds for EVERY sort, not just "last updated": the sort
          // orders entries within each group. A flat list sorted by score
          // mixes things you finished with things you have not started, which
          // is precisely the distinction the library exists to keep.
          GROUP_ORDER.filter((s) => filtered.some((e) => e.status === s)).map(
            (s) => {
              const group = filtered.filter((e) => e.status === s);
              return (
                <section key={s} className="mb-8">
                  <h2 className="mb-3 flex items-baseline gap-2 text-xs font-medium tracking-[0.12em] uppercase text-muted-foreground">
                    {STATUS_LABELS[s]}
                    <span
                      data-numeric
                      className="font-mono text-[10px] tracking-normal normal-case"
                    >
                      {group.length}
                    </span>
                  </h2>
                  <EntryCollection
                    entries={group}
                    view={view}
                    onEdit={setEditing}
                    onStatusChange={changeStatus}
                  />
                </section>
              );
            }
          )
        ) : (
          <EntryCollection
            entries={filtered}
            view={view}
            onEdit={setEditing}
            onStatusChange={changeStatus}
          />
        )}
      </LibraryFrame>

      {editing ? (
        <TrackingDialog
          entry={editing}
          open
          onOpenChange={(open) => !open && setEditing(null)}
          onSave={(edit) => saveEdit(editing, edit)}
          onDelete={() => deleteEntry(editing)}
        />
      ) : null}
    </>
  );
}

/** The page chrome shared by every state: title, controls, sidebar, sheet. */
function LibraryFrame({
  children, counts, filters, onFiltersChange, sortKey, sortOrder, onSortChange,
  view, onViewChange, onSurprise, activeFilterCount, sheetOpen, onSheetOpenChange, total,
  split,
}: {
  children: React.ReactNode;
  counts: Record<TrackingStatus | "all", number>;
  filters: LibraryFilters;
  onFiltersChange: (f: LibraryFilters) => void;
  sortKey: LibrarySortKey;
  sortOrder: SortOrder;
  onSortChange: (k: LibrarySortKey, o: SortOrder) => void;
  view: LibraryViewMode;
  onViewChange: (v: LibraryViewMode) => void;
  onSurprise: () => void;
  activeFilterCount: number;
  sheetOpen: boolean;
  onSheetOpenChange: (open: boolean) => void;
  total: number | null;
  /** Films and TV tabs, when Settings keeps them apart. */
  split: { tab: MediaType; onTabChange: (tab: MediaType) => void } | null;
}) {
  const panel = (
    <FilterPanel
      filters={filters}
      onFiltersChange={onFiltersChange}
      sortKey={sortKey}
      sortOrder={sortOrder}
      onSortChange={onSortChange}
      counts={counts}
      onSurprise={onSurprise}
      showType={split == null}
    />
  );

  return (
    // flex-1 so the content column has real height to centre an empty state
    // against. A percentage would resolve to zero here: the shell wrapper
    // gets its own height from flex-grow, not a height property.
    <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 py-8 md:px-6">
      {/* Wraps rather than overflowing: at 320px the Filters button and the
          view switcher together are wider than the title's remaining room. */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your library</h1>
          {total != null ? (
            <p data-numeric className="mt-1 font-mono text-xs text-muted-foreground">
              {total.toLocaleString("en-US")} tracked
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile only: at lg+ the persistent sidebar is right there, so the
              button is pure redundancy. Hidden on the WRAPPER, not the button:
              utility classes passed through Base UI's `render` prop lose to the
              component's own display rule, so `lg:hidden` on the Button itself
              silently does nothing. */}
          <div className="lg:hidden">
          <Sheet open={sheetOpen} onOpenChange={onSheetOpenChange}>
            <SheetTrigger
              render={
                <Button variant="outline" size="touch" className="gap-2">
                  <SlidersHorizontal aria-hidden="true" data-icon="inline-start" />
                  {activeFilterCount > 0
                    ? `Filters (${activeFilterCount})`
                    : "Filters"}
                </Button>
              }
            />
            <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto p-5">
              <SheetHeader className="p-0 pb-4">
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              {panel}
            </SheetContent>
          </Sheet>
          </div>
          <ViewSwitcher value={view} onChange={onViewChange} />
        </div>
      </div>

      {split ? (
        <Tabs
          value={split.tab}
          onValueChange={(v) => split.onTabChange(v as MediaType)}
          className="mb-6"
        >
          <TabsList variant="line" aria-label="Films or TV">
            <TabsTrigger value="movie">Films</TabsTrigger>
            <TabsTrigger value="season">TV</TabsTrigger>
          </TabsList>
        </Tabs>
      ) : null}

      <div className="flex flex-1 gap-8">
        {/* Desktop: persistent sidebar, the long-dwell pattern. */}
        <aside className="hidden w-60 shrink-0 lg:block">{panel}</aside>
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </main>
  );
}

/** Renders the entry set in the active view mode. */
function EntryCollection({
  entries,
  view,
  onEdit,
}: {
  entries: LibraryEntry[];
  view: LibraryViewMode;
  onEdit: (e: LibraryEntry) => void;
  /** Wired for a quick status control that no view renders yet. Edits go
   *  through the dialog (onEdit) today. */
  onStatusChange: (e: LibraryEntry, s: TrackingStatus) => void;
}) {
  if (view === "list") {
    return (
      <div className="flex flex-col">
        {entries.map((e) => (
          <div
            key={e.mediaId}
            className="flex items-center gap-3 border-b border-border py-2 last:border-b-0"
          >
            <div className="w-8 shrink-0">
              <PosterCard media={e} variant="compact" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {e.title}
                {e.mediaType === "season" ? ` · Season ${e.seasonNumber}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                {STATUS_LABELS[e.status]}
              </p>
            </div>
            {e.progress != null ? (
              <span data-numeric className="font-mono text-xs text-muted-foreground">
                {e.progressTotal != null
                  ? `${e.progress} / ${e.progressTotal}`
                  : e.progress}
              </span>
            ) : null}
            <span
              data-numeric
              className={cn(
                "w-8 text-right font-mono text-sm",
                e.score != null ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {e.score != null ? <ScoreValue score={e.score} /> : "–"}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Edit ${e.title}`}
              className="hit-44 relative shrink-0"
              onClick={() => onEdit(e)}
            >
              <Pencil aria-hidden="true" className="size-3.5" strokeWidth={2} />
            </Button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-3",
        view === "compact"
          ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8"
          : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
      )}
    >
      {entries.map((e) => (
        <div key={e.mediaId} className="group/cell relative">
          <PosterCard
            media={e}
            variant={view === "compact" ? "compact" : "overlay"}
            status={e.status}
            score={e.score}
            progress={
              // Episode progress is a TV-season concept; a movie has no
              // episodes, so it never carries a progress counter.
              e.mediaType === "season" && e.progress != null
                ? { watched: e.progress, total: e.progressTotal }
                : undefined
            }
          />
          {/* Quick edit: hover-revealed on desktop, always present on touch. */}
          <Button
            variant="secondary"
            size="icon-sm"
            aria-label={`Edit ${e.title}`}
            onClick={() => onEdit(e)}
            className={cn(
              "hit-44 absolute top-1.5 right-1.5 bg-black/60 text-white backdrop-blur-sm",
              "opacity-100 transition-opacity md:opacity-0 md:group-hover/cell:opacity-100 md:focus-visible:opacity-100"
            )}
          >
            <Pencil aria-hidden="true" className="size-3.5" strokeWidth={2} />
          </Button>
        </div>
      ))}
    </div>
  );
}

export { LibraryView };
