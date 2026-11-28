"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * A Filters button and what it opens: on a wide screen a panel right under
 * the button, on phones and tablets a sheet. Either way the controls edit a
 * copy, and Save commits it, so a half-made choice never reflows the list
 * behind. Reset puts the copy back to the defaults, still unsaved.
 *
 * Both openers are in the page, one hidden by CSS at each width, so the
 * switch needs no script and cannot flash the wrong one on load.
 */
export function FilterPanel<T>({
  value,
  defaults,
  onSave,
  count,
  children,
  iconOnly = false,
  className,
}: {
  value: T;
  /** What Reset goes back to. */
  defaults: T;
  onSave: (next: T) => void;
  /** How many filters differ from the defaults, for the button. */
  count: (v: T) => number;
  /** The controls, bound to the copy being edited. */
  children: (draft: T, setDraft: (next: T) => void) => React.ReactNode;
  /** A round icon button on a wide screen, where space is short. */
  iconOnly?: boolean;
  className?: string;
}) {
  const [draft, setDraft] = React.useState<T>(value);
  const [open, setOpen] = React.useState<"sheet" | "panel" | null>(null);
  const active = count(value);
  const label = active > 0 ? `Filters (${active})` : "Filters";

  const openChange = (which: "sheet" | "panel") => (next: boolean) => {
    if (next) setDraft(value);
    setOpen(next ? which : null);
  };
  const save = () => {
    onSave(draft);
    setOpen(null);
  };

  const body = (
    <div className="flex flex-col gap-6">{children(draft, setDraft)}</div>
  );
  const resetButton =
    count(draft) > 0 ? (
      <Button variant="ghost" size="sm" onClick={() => setDraft(defaults)}>
        Reset
      </Button>
    ) : null;

  return (
    <div className={cn("shrink-0", className)}>
      {/* Phones and tablets: a sheet sized to its content. Hidden on the
          wrapper, since a class passed through Base UI's render prop loses
          to the component's own display rule. */}
      <div className="lg:hidden">
        <Drawer open={open === "sheet"} onOpenChange={openChange("sheet")}>
          <DrawerTrigger
            render={
              <Button variant="outline" size="touch" className="gap-2">
                <SlidersHorizontal aria-hidden="true" data-icon="inline-start" />
                {label}
              </Button>
            }
          />
          <DrawerContent initialFocus={false}>
            <div className="flex min-h-11 shrink-0 items-center justify-between px-5 pb-2">
              <DrawerTitle>Filters</DrawerTitle>
              {resetButton}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2">{body}</div>
            <div className="shrink-0 px-5 pt-4 pb-4">
              <Button size="touch" className="w-full" onClick={save}>
                Save
              </Button>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Wide screens: anchored under the button, its right edges lined up,
          so it opens where the eye already is. */}
      <div className="hidden lg:block">
        <Popover open={open === "panel"} onOpenChange={openChange("panel")}>
          <PopoverTrigger
            render={
              iconOnly ? (
                <Button
                  variant="outline"
                  size="icon-touch"
                  aria-label={label}
                  className="relative"
                >
                  <SlidersHorizontal aria-hidden="true" />
                  {active > 0 ? (
                    <span
                      aria-hidden="true"
                      data-numeric
                      className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary font-mono text-[10px] font-medium text-primary-foreground"
                    >
                      {active}
                    </span>
                  ) : null}
                </Button>
              ) : (
                <Button variant="outline" size="lg" className="gap-2">
                  <SlidersHorizontal aria-hidden="true" data-icon="inline-start" />
                  {label}
                </Button>
              )
            }
          />
          <PopoverContent align="end" sideOffset={8} className="w-80 gap-6">
            <div className="flex min-h-8 items-center justify-between">
              <PopoverTitle>Filters</PopoverTitle>
              {resetButton}
            </div>
            {body}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(null)}>
                Cancel
              </Button>
              <Button onClick={save}>Save</Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

/** One labelled group in a filter panel. */
export function FilterField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const id = React.useId();
  return (
    <div role="group" aria-labelledby={id} className="flex flex-col gap-2">
      <div>
        <p id={id} className="text-sm font-medium text-foreground">
          {label}
        </p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}
