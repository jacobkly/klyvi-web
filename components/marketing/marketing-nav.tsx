import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The signed-out nav: a glass pill floating clear of the edges, the same
 * shape as the phone's tab bar, so the beams and posters pass under it. It
 * stays visible on mobile, because the marketing page has no bottom tab bar
 * to hand off to.
 */
export function MarketingNav() {
  return (
    <header className="pointer-events-none sticky top-0 z-40 px-3 pt-3 sm:px-6">
      <div className="pointer-events-auto glass mx-auto flex h-14 max-w-5xl items-center justify-between rounded-full border pr-2 pl-5">
        <Link
          href="/"
          className="rounded-full text-[15px] font-semibold tracking-tight text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          Klyvi
        </Link>
        <div className="flex items-center gap-2">
          {/* #109: browsing comes before signing up. */}
          <Link
            href="/explore"
            className="tap-target inline-flex items-center rounded-full px-3 py-1.5 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            Explore
          </Link>
          <Link
            href="/signin"
            className="tap-target inline-flex items-center rounded-full px-3 py-1.5 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            Sign in
          </Link>
          {/* Phones have the hero's full-width Get started instead. */}
          <Link href="/signup" className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex")}>
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
