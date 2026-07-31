"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/klyvi/site-footer";
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
      {/* min-h-dvh, not min-h-full: `min-height: 100%` needs a parent with a
          DEFINITE height, and body only carries a min-height, so it resolved
          to auto and the shell just wrapped its content. That left the footer
          floating mid-screen on short pages. Viewport units cannot collapse. */}
      <div className="flex min-h-dvh flex-col">
        <TopBar onOpenSearch={openSearch} />
        {/* Footer inside the padded wrapper so it clears the mobile tab bar.
            flex-1 on the content region pushes the footer to the bottom of the
            viewport when a page is short, and lets it sit directly under the
            content when the page is tall enough to scroll. */}
        <div className="flex flex-1 flex-col pb-20 md:pb-0">
          {/* A flex column, not a plain block: a page that wants to centre
              itself vertically can then be a flex-1 child. Percentage
              heights are no use here, because this wrapper's own height
              comes from flex-grow rather than a height property, so a child
              asking for `min-height: 100%` resolves it to zero. */}
          <div className="flex flex-1 flex-col">{children}</div>
          <SiteFooter wide />
        </div>
        <BottomTabBar />
      </div>
      <Toaster position="bottom-center" />
    </TooltipProvider>
  );
}

export { AppShell };
