"use client";

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import type { ReactNode } from "react";

import { useSession } from "@/components/auth/auth-provider";
import { SiteFooter } from "@/components/klyvi/site-footer";
import { UnreadProvider } from "@/components/notifications/unread-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MobileSearch } from "@/components/search/mobile-search";
import { isDetailPath, useGoBack } from "@/lib/go-back";
import { cn } from "@/lib/utils";
import { BottomTabBar } from "./bottom-tab-bar";
import { DetailBack } from "./detail-back";
import { LeftRail } from "./left-rail";
import { MobileTopBar } from "./mobile-top-bar";
import { TopBar } from "./top-bar";

/**
 * Wraps every authenticated screen: at md+ a left rail signed in (a top bar
 * signed out), and a bottom tab bar below md,
 * tooltip provider, toaster. Content gets bottom padding on mobile so the
 * fixed tab bar never covers it.
 *
 * On desktop, search routes to /explore rather than opening a palette,
 * since Explore has the filters and the grid. On phones the top bar's search
 * opens a full-screen sheet (MobileSearch) that hands off to Explore for
 * the full results.
 */
function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const goBack = useGoBack();
  const onDetail = isDetailPath(pathname);
  const { user, loading } = useSession();
  // Until the session resolves, assume signed in, as the top bar does.
  const signedOut = !loading && !user;

  const openSearch = React.useCallback(() => {
    router.push("/explore?focus=1");
  }, [router]);
  // Phones get a full-screen search sheet. The desktop bar and Ctrl+K go
  // to Explore.
  const [phoneSearch, setPhoneSearch] = React.useState(false);
  const openPhoneSearch = React.useCallback(() => setPhoneSearch(true), []);

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
      <UnreadProvider>
        {/* min-h-dvh, not min-h-full: `min-height: 100%` needs a parent with a
            DEFINITE height, and body only carries a min-height, so it resolved
            to auto and the shell just wrapped its content. That left the footer
            floating mid-screen on short pages. Viewport units cannot collapse. */}
        <div className="flex min-h-dvh flex-col">
          {/* The first Tab stop: past the nav to the page. Hidden until it
              has focus. The click handler moves focus as well as scroll,
              since a fragment link alone leaves focus behind in some
              browsers. */}
          <a
            href="#content"
            onClick={(e) => {
              const target = document.getElementById("content");
              if (!target) return;
              e.preventDefault();
              target.focus();
              target.scrollIntoView?.();
            }}
            className="sr-only rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50"
          >
            Skip to content
          </a>
          {signedOut ? (
            <TopBar onOpenSearch={openSearch} />
          ) : (
            <LeftRail onOpenSearch={openSearch} />
          )}
          <MobileTopBar
            onOpenSearch={openPhoneSearch}
            onBack={onDetail ? goBack : undefined}
            pageHasSearch={pathname === "/explore"}
          />
          <MobileSearch open={phoneSearch} onOpenChange={setPhoneSearch} />
          {/* Footer inside the padded wrapper so it clears the mobile tab bar.
              flex-1 on the content region pushes the footer to the bottom of the
              viewport when a page is short, and lets it sit directly under the
              content when the page is tall enough to scroll. */}
          <div className={cn(
              "relative flex flex-1 flex-col pb-(--tab-bar-space) md:pb-0",
              !signedOut && "md:pl-20"
            )}>
            {onDetail ? <DetailBack onBack={goBack} railed={!signedOut} /> : null}
            {/* A flex column, not a plain block: a page that wants to centre
                itself vertically can then be a flex-1 child. Percentage
                heights are no use here, because this wrapper's own height
                comes from flex-grow rather than a height property, so a child
                asking for `min-height: 100%` resolves it to zero. */}
            <div
              id="content"
              tabIndex={-1}
              className="flex flex-1 flex-col outline-none"
            >
              {children}
            </div>
            <SiteFooter wide />
          </div>
          <BottomTabBar />
        </div>
      </UnreadProvider>
      {/* Bottom-right on desktop, out of the content's way. Sonner goes full
          width under 600px, and both offsets clear the tab bar. */}
      <Toaster
        position="bottom-right"
        offset={{ bottom: "var(--toast-bottom)", right: 24 }}
        mobileOffset={{ bottom: "var(--toast-bottom)" }}
      />
    </TooltipProvider>
  );
}

export { AppShell };
