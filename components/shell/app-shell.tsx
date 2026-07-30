"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomTabBar } from "./bottom-tab-bar";
import { TopBar } from "./top-bar";

/**
 * Wraps every authenticated screen: top bar at md+, bottom tab bar below,
 * tooltip provider, toaster. Content gets bottom padding on mobile so the
 * fixed tab bar never covers it.
 *
 * Search routes to /explore rather than opening a separate palette. One
 * search surface, not two: the palette duplicated Explore's job while being
 * strictly worse at it (no filters, no browsing, no result grid).
 */
function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();

  const openSearch = React.useCallback(() => {
    router.push("/explore?focus=1");
  }, [router]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSearch]);

  return (
    <TooltipProvider delay={300}>
      <div className="flex min-h-full flex-col">
        <TopBar onOpenSearch={openSearch} />
        <div className="flex-1 pb-20 md:pb-0">{children}</div>
        <BottomTabBar />
      </div>
      <Toaster position="bottom-center" />
    </TooltipProvider>
  );
}

export { AppShell };
