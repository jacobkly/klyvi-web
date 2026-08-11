"use client";

import { LayoutGrid, List, Grip } from "lucide-react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type LibraryViewMode = "grid" | "list" | "compact";

/**
 * The three-mode view switcher. Icon-only targets carry aria-labels. The
 * chosen mode is a remembered preference (the caller persists it), so it
 * survives navigation and reloads rather than resetting to grid.
 */
function ViewSwitcher({
  value,
  onChange,
}: {
  value: LibraryViewMode;
  onChange: (mode: LibraryViewMode) => void;
}) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(next: unknown[]) => {
        const mode = next.at(-1);
        if (mode) onChange(mode as LibraryViewMode);
      }}
      spacing={0}
      variant="outline"
      aria-label="View"
    >
      <ToggleGroupItem value="grid" aria-label="Grid">
        <LayoutGrid aria-hidden="true" className="size-4" strokeWidth={2} />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="List">
        <List aria-hidden="true" className="size-4" strokeWidth={2} />
      </ToggleGroupItem>
      <ToggleGroupItem value="compact" aria-label="Compact">
        <Grip aria-hidden="true" className="size-4" strokeWidth={2} />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

export { ViewSwitcher };
