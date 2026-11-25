"use client";

import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { regionFromLanguages, regionName } from "@/lib/watch-region";

/**
 * Orders the countries for the list: the current one, then the browser's
 * own (when it differs), then the rest A to Z.
 */
export function orderRegions(regions: string[], current: string, home: string | null): string[] {
  const rest = regions
    .filter((r) => r !== current && r !== home)
    .sort((a, b) => regionName(a).localeCompare(regionName(b)));
  const top = [current, ...(home && home !== current && regions.includes(home) ? [home] : [])];
  return [...top, ...rest];
}

/**
 * How well a country matches what was typed: 0 when a word of its name starts
 * with it (or it is the code), 1 when the name only contains it, null for no
 * match. "ger" puts Germany before Algeria.
 */
function rank(code: string, q: string): number | null {
  const name = regionName(code).toLowerCase();
  if (code.toLowerCase() === q || name.split(/[\s(-]+/).some((w) => w.startsWith(q))) return 0;
  return name.includes(q) ? 1 : null;
}

function filterRegions(ordered: string[], query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return ordered;
  const ranked = ordered
    .map((r) => ({ r, k: rank(r, q) }))
    .filter((x): x is { r: string; k: number } => x.k !== null);
  // A stable sort, so each tier keeps the list's own order.
  return ranked.sort((x, y) => x.k - y.k).map((x) => x.r);
}

/**
 * The country picker for "Where to watch": a short searchable list instead of
 * a menu that runs the height of the screen. Type to filter, arrows to move,
 * Enter to pick.
 */
export function RegionPicker({
  regions,
  value,
  onChange,
}: {
  regions: string[];
  value: string;
  onChange: (region: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const listId = React.useId();
  const listRef = React.useRef<HTMLUListElement>(null);

  const home = React.useMemo(
    () => (typeof navigator === "undefined" ? null : regionFromLanguages(navigator.languages ?? [])),
    []
  );
  const shown = React.useMemo(
    () => filterRegions(orderRegions(regions, value, home), query),
    [regions, value, home, query]
  );

  const pick = (r: string) => {
    onChange(r);
    setOpen(false);
  };

  React.useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView?.({ block: "nearest" });
  }, [active]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setQuery("");
          setActive(0);
        }
      }}
    >
      <PopoverTrigger
        aria-label={`Country, ${regionName(value)}`}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "hit-44 relative max-w-48 shrink-0 gap-1.5 rounded-lg"
        )}
      >
        <span className="truncate">{regionName(value)}</span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 gap-2 rounded-lg p-2">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            role="combobox"
            autoFocus
            aria-label="Search countries"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={shown[active] ? `${listId}-${shown[active]}` : undefined}
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, shown.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter" && shown[active]) {
                e.preventDefault();
                pick(shown[active]);
              }
            }}
            placeholder="Search countries"
            className="h-11 w-full rounded-lg border border-input bg-input/30 pr-3 pl-9 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 md:h-9 md:text-sm"
          />
        </div>
        {shown.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">No country by that name.</p>
        ) : (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label="Countries"
            className="max-h-80 overflow-y-auto overscroll-contain"
          >
            {shown.map((r, i) => (
              <li
                key={r}
                id={`${listId}-${r}`}
                data-index={i}
                role="option"
                aria-selected={r === value}
                onPointerMove={() => setActive(i)}
                onClick={() => pick(r)}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-2 text-sm md:min-h-9",
                  i === active && "bg-muted"
                )}
              >
                <span className="flex-1 truncate">{regionName(r)}</span>
                {r === value ? <Check aria-hidden="true" className="size-4 text-violet-text" /> : null}
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
