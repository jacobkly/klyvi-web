"use client";

import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomTabBar } from "./bottom-tab-bar";
import { CommandPalette, useCommandPalette } from "./command-palette";
import { TopBar } from "./top-bar";

/**
 * Wraps every authenticated screen: top bar at md+, bottom tab bar below,
 * tooltip provider, toaster, and the cmd+K palette. Content gets bottom
 * padding on mobile so the fixed tab bar never covers it.
 */
function AppShell({ children }: { children: ReactNode }) {
  const palette = useCommandPalette();

  return (
    <TooltipProvider delay={300}>
      <div className="flex min-h-full flex-col">
        <TopBar onOpenSearch={() => palette.setOpen(true)} />
        <div className="flex-1 pb-20 md:pb-0">{children}</div>
        <BottomTabBar />
      </div>
      <CommandPalette open={palette.open} onOpenChange={palette.setOpen} />
      <Toaster position="bottom-center" />
    </TooltipProvider>
  );
}

export { AppShell };
