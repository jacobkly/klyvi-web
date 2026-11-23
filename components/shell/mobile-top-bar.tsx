"use client";

import Link from "next/link";
import * as React from "react";
import { Search } from "lucide-react";

import { useSession } from "@/components/auth/auth-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** How far a thumb has to move one way before the bar reacts. */
const SLACK = 8;

type BarState = "top" | "shown" | "hidden";

/**
 * "top" at the head of the page, "hidden" while scrolling down, "shown" after
 * any scroll back up. Small jitters and the bounce past either end count as
 * no movement.
 */
function useBarState(): BarState {
  const [bar, setBar] = React.useState<BarState>("top");
  React.useEffect(() => {
    const clamp = () =>
      Math.min(
        Math.max(window.scrollY, 0),
        Math.max(document.documentElement.scrollHeight - window.innerHeight, 0)
      );
    let last = clamp();
    const onScroll = () => {
      const y = clamp();
      if (y <= 4) {
        last = y;
        setBar("top");
        return;
      }
      if (Math.abs(y - last) < SLACK) return;
      setBar(y > last ? "hidden" : "shown");
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // What sticks beneath the bar reads this (--top-bar in globals.css).
  React.useEffect(() => {
    const root = document.documentElement;
    root.dataset.topBar = bar;
    return () => {
      delete root.dataset.topBar;
    };
  }, [bar]);
  return bar;
}

/**
 * The phone's header, below md where the desktop top bar is hidden: the
 * wordmark home and Search. At the head of a page it has no bar of its own,
 * so artwork runs behind it. Scrolling down it leaves, and a small scroll up
 * brings it back as glass. The account is the Profile tab. Signed out, Get
 * started sits here, since Sign in is a tab.
 */
function MobileTopBar({ onOpenSearch }: { onOpenSearch?: () => void }) {
  const { user, loading } = useSession();
  const signedOut = !loading && !user;
  const bar = useBarState();

  return (
    <header
      data-state={bar}
      className={cn(
        "sticky top-0 z-40 h-(--top-bar-height) pt-[env(safe-area-inset-top)] transition-transform duration-(--dur-base) ease-(--ease-enter) focus-within:translate-y-0 md:hidden",
        bar === "hidden" && "-translate-y-full",
        bar === "shown" && "glass border-b"
      )}
    >
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
