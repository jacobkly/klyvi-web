"use client";

import Link from "next/link";
import { Search } from "lucide-react";

import { useSession } from "@/components/auth/auth-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserMenu } from "./user-menu";

/**
 * The phone's header, below md where the desktop top bar is hidden: the
 * wordmark home, Search, and the account menu (Settings, notices, sign out).
 * Signed out, Get started takes the avatar's place, since Sign in is a tab.
 */
function MobileTopBar({ onOpenSearch }: { onOpenSearch?: () => void }) {
  const { user, loading } = useSession();
  const signedOut = !loading && !user;

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-border bg-background/95 backdrop-blur-sm md:hidden">
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
          ) : (
            <div className="flex size-11 items-center justify-center">
              <UserMenu />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export { MobileTopBar };
