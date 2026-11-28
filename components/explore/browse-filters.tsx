"use client";

import * as React from "react";

import { useSession } from "@/components/auth/auth-provider";
import { FilterField, FilterPanel } from "@/components/klyvi/filter-panel";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DEFAULT_PREFS,
  usePref,
  type BrowseFilters,
  type WatchedFilter,
} from "@/lib/local-prefs";

const WATCHED_OPTIONS: { value: WatchedFilter; label: string }[] = [
  { value: "show", label: "Show" },
  { value: "dim", label: "Dim" },
  { value: "hide", label: "Hide" },
];

/** A stored value from an older build or another browser, made whole. */
function normalize(raw: unknown): BrowseFilters {
  const r = (raw ?? {}) as Partial<BrowseFilters>;
  return {
    watched: r.watched === "dim" || r.watched === "hide" ? r.watched : "show",
    anime: typeof r.anime === "boolean" ? r.anime : DEFAULT_PREFS.browseFilters.anime,
  };
}

/** The browse and top lists' filters, live across the app. Signed out,
 *  watched titles always show, since there is no library to judge by. */
export function useBrowseFilters(): {
  filters: BrowseFilters;
  setFilters: (next: BrowseFilters) => void;
  /** Anime in or out, leaving the watched choice as stored. */
  setAnime: (on: boolean) => void;
  signedIn: boolean;
} {
  const [raw, setFilters] = usePref("browseFilters");
  const { user } = useSession();
  const signedIn = user != null;
  const filters = React.useMemo(() => {
    const f = normalize(raw);
    return signedIn ? f : { ...f, watched: "show" as const };
  }, [raw, signedIn]);
  const setAnime = React.useCallback(
    (on: boolean) => setFilters({ ...normalize(raw), anime: on }),
    [raw, setFilters]
  );
  return { filters, setFilters, setAnime, signedIn };
}

/** The anime switch, the same in every Filters panel. */
export function AnimeSwitch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (on: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4">
      <span>
        <span className="block text-sm font-medium text-foreground">Anime</span>
        <span className="block text-xs text-muted-foreground">
          Japanese animated films and series.
        </span>
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}

function countFilters(f: BrowseFilters): number {
  return (f.watched !== "show" ? 1 : 0) + (f.anime ? 1 : 0);
}

/** The Filters button on a browse or top list. */
export function BrowseFiltersButton({ className }: { className?: string }) {
  const { filters, setFilters, setAnime, signedIn } = useBrowseFilters();
  return (
    <FilterPanel
      value={filters}
      defaults={DEFAULT_PREFS.browseFilters}
      // Signed out the panel has no watched choice, so a save keeps the
      // stored one for when the reader signs back in.
      onSave={(next) => (signedIn ? setFilters(next) : setAnime(next.anime))}
      count={countFilters}
      className={className}
    >
      {(draft, setDraft) => (
        <>
          {signedIn ? (
            <FilterField label="Watched" hint="Titles you have seen through.">
              <ToggleGroup
                value={[draft.watched]}
                onValueChange={(v: unknown[]) => {
                  // Pressing the chosen one again empties the group. Ignore
                  // that, so one choice is always on.
                  const next = WATCHED_OPTIONS.find((o) => o.value === v.at(-1));
                  if (next) setDraft({ ...draft, watched: next.value });
                }}
                spacing={0}
                variant="outline"
                aria-label="Watched titles"
                className="w-full"
              >
                {WATCHED_OPTIONS.map((o) => (
                  <ToggleGroupItem
                    key={o.value}
                    value={o.value}
                    className="flex-1 max-lg:h-11"
                  >
                    {o.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </FilterField>
          ) : null}

          <AnimeSwitch
            checked={draft.anime}
            onCheckedChange={(on) => setDraft({ ...draft, anime: on })}
          />
        </>
      )}
    </FilterPanel>
  );
}
