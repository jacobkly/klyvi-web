"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useSession } from "@/components/auth/auth-provider";
import { buttonVariants } from "@/components/ui/button";
import { PRIMARY_NAV, SIGNED_OUT_NAV, isActive } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { UserMenu } from "./user-menu";

const TAB =
  "flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-full py-1.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/30";

/**
 * Mobile primary navigation: four tabs, Search, and the avatar. Fixed to the
 * bottom, the one piece of chrome that is always reachable (05-responsive.md
 * §2). Hidden at md+ where the top bar takes over. Every target meets the 44px
 * floor. Search is here because the top bar, and its search, are hidden on a
 * phone. It opens Explore with the box focused, the same place Ctrl+K goes.
 * Signed out, the tabs are Explore and Search, and the avatar's place goes to
 * Sign in and Get started.
 */
function BottomTabBar() {
  const pathname = usePathname();
  const { user, loading } = useSession();
  const signedOut = !loading && !user;
  const nav = signedOut ? SIGNED_OUT_NAV : PRIMARY_NAV;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm md:hidden"
    >
      <div
        className="mx-auto flex max-w-md items-stretch justify-around px-2"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {nav.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                TAB,
                active
                  ? "text-violet-text"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon aria-hidden="true" className="size-5" strokeWidth={2} />
              <span className="text-[10px] font-medium leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
        <Link
          href="/explore?focus=1"
          className={cn(TAB, "text-muted-foreground hover:text-foreground")}
        >
          <Search aria-hidden="true" className="size-5" strokeWidth={2} />
          <span className="text-[10px] font-medium leading-none">Search</span>
        </Link>
        {signedOut ? (
          <div className="flex flex-[2] items-center justify-end gap-1">
            <Link
              href="/signin"
              className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "sm" }), "hit-44 relative")}
            >
              Get started
            </Link>
          </div>
        ) : (
          <div className="flex min-h-11 min-w-11 flex-1 items-center justify-center">
            <UserMenu />
          </div>
        )}
      </div>
    </nav>
  );
}

export { BottomTabBar };
