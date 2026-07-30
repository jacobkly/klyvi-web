"use client";

import * as React from "react";
import { Library as LibraryIcon, Pencil, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/klyvi/empty-state";
import { PosterCard } from "@/components/klyvi/poster-card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  filterLibrary,
  sortLibrary,
  type LibraryFilters,
  type LibrarySortKey,
  type SortOrder,
} from "@/lib/library-filter";
import {
  STATUS_LABELS,
  STATUS_VERBS,
  type LibraryEntry,
  type TrackingStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { FilterPanel } from "./filter-panel";
import { StatusControl } from "./status-control";
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

type LoadState =
  | { phase: "loading" }
  | { phase: "error" }
  | { phase: "ready"; entries: LibraryEntry[] };

/**
 * The golden screen's client orchestrator. Owns the slice state, the three
 * view modes, the tracking dialog, and the optimistic edit loop. Data arrives
 * through `load` so the mock layer swaps for the API client without touching
 * this file.
 */
function LibraryView({
  load,
}: {
  load: () => Promise<LibraryEntry[]>;
}) {
  const [state, setState] = React.useState<LoadState>({ phase: "loading" });
  const [filters, setFilters] = React.useState<LibraryFilters>({
    status: "all",
    type: "all",
    query: "",
  });
  const [sortKey, setSortKey] = React.useState<LibrarySortKey>("updated");
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("desc");
  const [view, setView] = React.useState<LibraryViewMode>("grid");
  const [editing, setEditing] = React.useState<LibraryEntry | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const doLoad = React.useCallback(() => {
    setState({ phase: "loading" });
    load()
      .then((entries) => setState({ phase: "ready", entries }))
      .catch(() => setState({ phase: "error" }));
  }, [load]);

  React.useEffect(doLoad, [doLoad]);

  const entries = state.phase === "ready" ? state.entries : [];
  const filtered = sortLibrary(
    filterLibrary(entries, filters),
    sortKey,
    sortOrder
  );

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
    (filters.type !== "all" ? 1 : 0) +
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
    // API write lands here; on failure: setState(prev) and the failure toast.
    toast(`${STATUS_VERBS[next]}`);
  }

  function saveEdit(entry: LibraryEntry, edit: TrackingEdit) {
    if (state.phase !== "ready") return;
    setState({
      phase: "ready",
      entries: state.entries.map((e) =>
        e.mediaId === entry.mediaId
          ? { ...e, status: edit.status, score: edit.score, progress: edit.progress }
          : e
      ),
    });
  }

  function deleteEntry(entry: LibraryEntry) {
    if (state.phase !== "ready") return;
    setState({
      phase: "ready",
      entries: state.entries.filter((e) => e.mediaId !== entry.mediaId),
    });
    setEditing(null);
    toast("Removed from your library");
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
        onSortChange={(k, o) => { setSortKey(k); setSortOrder(o); }}
        view={view} onViewChange={setView} onSurprise={surprise}
        activeFilterCount={activeFilterCount} sheetOpen={sheetOpen} onSheetOpenChange={setSheetOpen}
        total={null}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-art" />
          ))}
        </div>
      </LibraryFrame>
    );
  }

  if (state.phase === "error") {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <p className="text-[15px] font-semibold text-foreground">
          Could not load your library.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Something went wrong on Klyvi&apos;s end.
        </p>
        <Button className="mt-5" onClick={doLoad}>
          Try again
        </Button>
      </div>
    );
  }

  // Never tracked anything at all.
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={LibraryIcon}
        title="Nothing tracked yet"
        body="Log something you have watched and Klyvi starts learning what you like."
        action={{ label: "Find something to watch", href: "/find" }}
        className="py-24"
      />
    );
  }

  const hasMissingArt = entries.some((e) => e.posterPath === null);

  return (
    <>
      <LibraryFrame counts={counts} filters={filters} onFiltersChange={setFilters}
        sortKey={sortKey} sortOrder={sortOrder}
        onSortChange={(k, o) => { setSortKey(k); setSortOrder(o); }}
        view={view} onViewChange={setView} onSurprise={surprise}
        activeFilterCount={activeFilterCount} sheetOpen={sheetOpen} onSheetOpenChange={setSheetOpen}
        total={entries.length}
      >
        {hasMissingArt ? (
          <p className="mb-4 text-xs text-muted-foreground">
            Artwork is still loading for some titles.
          </p>
        ) : null}

        {filtered.length === 0 ? (
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
    />
  );

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-8 md:px-6">
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

      <div className="flex gap-8">
        {/* Desktop: persistent sidebar, the long-dwell pattern. */}
        <aside className="hidden w-60 shrink-0 lg:block">{panel}</aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </main>
  );
}

/** Renders the entry set in the active view mode. */
function EntryCollection({
  entries,
  view,
  onEdit,
  onStatusChange,
}: {
  entries: LibraryEntry[];
  view: LibraryViewMode;
  onEdit: (e: LibraryEntry) => void;
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
              {e.score ?? "–"}
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
            progress={
              e.progress != null
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
