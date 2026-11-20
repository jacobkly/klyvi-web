"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";

import { useSession } from "@/components/auth/auth-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { PRIMARY_NAV, SIGNED_OUT_NAV, isActive } from "@/lib/nav";
import { modifierLabel, useIsMac } from "@/lib/platform";
import { cn } from "@/lib/utils";
import { UserMenu } from "./user-menu";

/**
 * Desktop navigation. Sticky at md+, hidden on mobile where the bottom tab bar
 * takes over. The `transparent` variant overlays a BackdropHero without a
 * border or fill, per the media-detail spec.
 */
function TopBar({
  variant = "solid",
  onOpenSearch,
}: {
  variant?: "solid" | "transparent";
  onOpenSearch?: () => void;
}) {
  const pathname = usePathname();
  const isMac = useIsMac();
  const { user, loading } = useSession();
  // Until the session resolves, assume signed in: most visitors to an app
  // page are, and a visitor sees the right bar a moment later.
  const signedOut = !loading && !user;
  const nav = signedOut ? SIGNED_OUT_NAV : PRIMARY_NAV;

  return (
    <header
      className={cn(
        "top-0 z-40 hidden h-14 md:block",
        variant === "solid"
          ? "glass sticky border-b"
          : "absolute inset-x-0 bg-gradient-to-b from-black/60 to-transparent"
      )}
    >
      <div className="mx-auto flex h-full max-w-[1400px] items-center gap-6 px-6">
        <Link
          href={signedOut ? "/" : "/home"}
          className="rounded-full text-[15px] font-semibold tracking-tight text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          Klyvi
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-1">
          {nav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30",
                  active
                    ? "text-violet-text"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenSearch}
            aria-label="Search"
            className="gap-2 text-muted-foreground"
          >
            <Search aria-hidden="true" className="size-4" strokeWidth={2} />
            <span className="hidden lg:inline">Search</span>
            {/* Held back until the platform is known: rendering ⌘ to a
                Windows user is worse than rendering nothing for a frame. */}
            {isMac != null ? (
              <kbd className="hidden rounded-sm border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] lg:inline">
                {modifierLabel(isMac)}
                {isMac ? "" : " "}K
              </kbd>
            ) : null}
          </Button>
          {signedOut ? (
            <>
              <Link
                href="/signin"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                Sign in
              </Link>
              <Link href="/signup" className={buttonVariants({ size: "sm" })}>
                Get started
              </Link>
            </>
          ) : (
            <UserMenu />
          )}
        </div>
      </div>
    </header>
  );
}

export { TopBar };
