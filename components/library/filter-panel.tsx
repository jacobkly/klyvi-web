"use client";

import { Shuffle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  LibraryFilters,
  LibrarySortKey,
  SortOrder,
} from "@/lib/library-filter";
import { STATUS_LABELS, type TrackingStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_ORDER: (TrackingStatus | "all")[] = [
  "all",
  "watching",
  "planning",
  "completed",
  "rewatching",
  "paused",
  "dropped",
];

const SORT_OPTIONS: { key: LibrarySortKey; label: string }[] = [
  { key: "title", label: "Title" },
  { key: "score", label: "Score" },
  { key: "added", label: "Date added" },
  { key: "year", label: "Release year" },
  { key: "progress", label: "Progress" },
  { key: "updated", label: "Last updated" },
];

/**
 * The library slice controls, per the AniList filter-sidebar reference: a
 * filter field, the status list with the active row filled, type and sort
 * selects, and the violet shuffle. Rendered in the desktop sidebar and inside
 * the mobile bottom sheet, which is why it knows nothing about where it lives.
 */
function FilterPanel({
  filters,
  onFiltersChange,
  sortKey,
  sortOrder,
  onSortChange,
  counts,
  onSurprise,
}: {
  filters: LibraryFilters;
  onFiltersChange: (f: LibraryFilters) => void;
  sortKey: LibrarySortKey;
  sortOrder: SortOrder;
  onSortChange: (key: LibrarySortKey, order: SortOrder) => void;
  counts: Record<TrackingStatus | "all", number>;
  onSurprise: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <Input
        value={filters.query}
        onChange={(e) =>
          onFiltersChange({ ...filters, query: e.target.value })
        }
        placeholder="Filter your library"
        aria-label="Filter your library"
      />

      <div className="flex flex-col gap-0.5" role="group" aria-label="Status">
        {STATUS_ORDER.map((s) => {
          const active = filters.status === s;
          const label = s === "all" ? "All" : STATUS_LABELS[s];
          return (
            <button
              key={s}
              type="button"
              onClick={() => onFiltersChange({ ...filters, status: s })}
              aria-pressed={active}
              className={cn(
                "flex min-h-9 items-center justify-between rounded-lg px-3 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30",
                active
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              {label}
              <span data-numeric className="font-mono text-xs text-muted-foreground">
                {counts[s]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lf-type">Type</Label>
        <Select
          value={filters.type}
          onValueChange={(v) =>
            onFiltersChange({
              ...filters,
              type: v as LibraryFilters["type"],
            })
          }
          items={{ all: "All", movie: "Films", season: "TV" }}
        >
          <SelectTrigger id="lf-type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="movie">Films</SelectItem>
            <SelectItem value="season">TV</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lf-sort">Sort by</Label>
        <div className="flex gap-2">
          <Select
            value={sortKey}
            onValueChange={(v) => onSortChange(v as LibrarySortKey, sortOrder)}
            items={Object.fromEntries(SORT_OPTIONS.map((o) => [o.key, o.label]))}
          >
            <SelectTrigger id="lf-sort" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.key} value={o.key}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            aria-label={sortOrder === "asc" ? "Ascending" : "Descending"}
            onClick={() =>
              onSortChange(sortKey, sortOrder === "asc" ? "desc" : "asc")
            }
            className="shrink-0 font-mono"
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>
      </div>

      <Button onClick={onSurprise} className="gap-2">
        <Shuffle aria-hidden="true" data-icon="inline-start" />
        Surprise me
      </Button>
    </div>
  );
}

export { FilterPanel };
