"use client";

import Link from "next/link";
import { Search } from "lucide-react";

import { useSession } from "@/components/auth/auth-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The phone's header, below md where the desktop top bar is hidden: the
 * wordmark home and Search, on no bar of its own, and it scrolls away with
 * the page. The account is the Profile tab. Signed out, Get started sits
 * here, since Sign in is a tab.
 */
function MobileTopBar({ onOpenSearch }: { onOpenSearch?: () => void }) {
  const { user, loading } = useSession();
  const signedOut = !loading && !user;

  return (
    <header className="relative z-40 h-14 pt-[env(safe-area-inset-top)] md:hidden">
      <div className="flex h-full items-center gap-2 px-4">
        <Link
          href={signedOut ? "/" : "/home"}
          className="tap-target inline-flex items-center rounded-full text-[15px] font-semibold tracking-tight text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          Klyvi
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-touch"
            onClick={onOpenSearch}
            aria-label="Search"
            className="text-muted-foreground"
          >
            <Search aria-hidden="true" className="size-5" strokeWidth={2} />
          </Button>
          {signedOut ? (
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "sm" }), "hit-44 relative")}
            >
              Get started
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export { MobileTopBar };
