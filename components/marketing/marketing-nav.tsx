import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The signed-out nav, wearing the app bar's shell (same height, same
 * container, blur over the artwork) so outside and inside read as one
 * product. Unlike the app bar it stays visible on mobile, because the
 * marketing page has no bottom tab bar to hand off to.
 */
export function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 h-14 glass border-b">
      <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-4 md:px-6">
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
