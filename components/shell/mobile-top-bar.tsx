"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { ArrowLeft, Search } from "lucide-react";

import { useSession } from "@/components/auth/auth-provider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** How far a thumb has to move one way before the bar reacts. */
const SLACK = 8;

/** Past Explore's own search field, which by here has scrolled away. */
const FIELD_GONE = 240;

/** Glass that floats over the page, with the focus ring and press it needs. */
const FLOATING =
  "pointer-events-auto glass rounded-full border text-foreground outline-none transition-[scale] duration-(--dur-press) focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] motion-reduce:active:scale-100";

/**
 * Hidden while scrolling down, back after any scroll up and at the head of
 * the page. Small jitters and the bounce past either end count as no
 * movement. Deep is past a search field at the head of the page.
 */
function useBar(): { hidden: boolean; deep: boolean } {
  const [hidden, setHidden] = React.useState(false);
  const [deep, setDeep] = React.useState(false);
  React.useEffect(() => {
    const clamp = () =>
      Math.min(
        Math.max(window.scrollY, 0),
        Math.max(document.documentElement.scrollHeight - window.innerHeight, 0)
      );
    let last = clamp();
    const onScroll = () => {
      const y = clamp();
      setDeep(y > FIELD_GONE);
      if (y <= 4) {
        last = y;
        setHidden(false);
        return;
      }
      if (Math.abs(y - last) < SLACK) return;
      setHidden(y > last);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // What sticks beneath the bar reads this (--top-bar in globals.css).
  React.useEffect(() => {
    const root = document.documentElement;
    root.dataset.topBar = hidden ? "hidden" : "shown";
    return () => {
      delete root.dataset.topBar;
    };
  }, [hidden]);
  return { hidden, deep };
}

/**
 * The phone's header, below md where the desktop top bar is hidden. There is
 * no bar, only glass floating over the page, as the tab bar does: a round
 * mark home, or Back on a page a tab opens onto, and a Search pill across
 * the rest.
 * The search page (MobileSearch) holds its close button and field in these
 * same two places, so opening it reads as the pill growing into the page.
 * On Explore the pill waits until the page's own field has scrolled away.
 * Scrolling down this leaves, and a small scroll up brings it back. The
 * account is a tab. Signed out, Get started sits here, since Sign in is a tab.
 */
function MobileTopBar({
  onOpenSearch,
  onBack,
  overArt = false,
  pageHasSearch = false,
}: {
  onOpenSearch?: () => void;
  onBack?: () => void;
  /** The page opens on artwork that reaches the top, under this bar. */
  overArt?: boolean;
  /** The page opens with a search field of its own. */
  pageHasSearch?: boolean;
}) {
  const { user, loading } = useSession();
  const signedOut = !loading && !user;
  const { hidden, deep } = useBar();

  return (
    <header
      className={cn(
        "pointer-events-none sticky top-0 z-40 flex h-(--top-bar-height) items-end gap-2 px-4 transition-transform duration-(--dur-base) ease-(--ease-enter) focus-within:translate-y-0 md:hidden",
        // Takes no room on a details page, so the art reaches the top.
        overArt && "-mb-(--top-bar-height)",
        hidden && "-translate-y-full"
      )}
    >
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className={cn(FLOATING, "flex size-11 shrink-0 items-center justify-center")}
        >
          <ArrowLeft aria-hidden="true" className="size-5" strokeWidth={2} />
        </button>
      ) : (
        <Link
          href={signedOut ? "/" : "/home"}
          aria-label="Klyvi, home"
          className={cn(FLOATING, "flex size-11 shrink-0 items-center justify-center")}
        >
          <Image src="/icon-192.png" alt="" width={32} height={32} className="size-8 rounded-full" />
        </Link>
      )}
      <button
        type="button"
        onClick={onOpenSearch}
        className={cn(
          FLOATING,
          "flex h-11 min-w-0 flex-1 items-center gap-2 px-4 text-sm",
          pageHasSearch && !deep && "invisible"
        )}
      >
        <Search aria-hidden="true" className="size-4 shrink-0" strokeWidth={2} />
        Search
      </button>
      {signedOut ? (
        <Link
          href="/signup"
          className={cn(buttonVariants({ size: "touch" }), "pointer-events-auto shrink-0")}
        >
          Get started
        </Link>
      ) : null}
    </header>
  );
}

export { MobileTopBar };
