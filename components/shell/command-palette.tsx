"use client";

import * as React from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

/**
 * Global search (cmd+K). Stub for the shell build: the four result groups
 * exist with no data source behind them yet. Search wiring lands with the
 * explore screen. Copy from 06-copy.md.
 */
function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Search films, TV, and people"
    >
      <CommandInput placeholder="Search films, TV, and people" />
      <CommandList>
        <CommandEmpty>Nothing found</CommandEmpty>
        <CommandGroup heading="Films" />
        <CommandGroup heading="TV" />
        <CommandGroup heading="People" />
        <CommandGroup heading="In your library" />
        <CommandItem className="hidden" value="-" />
      </CommandList>
    </CommandDialog>
  );
}

/** Binds cmd+K / ctrl+K to toggle the palette. */
function useCommandPalette() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return { open, setOpen };
}

export { CommandPalette, useCommandPalette };
