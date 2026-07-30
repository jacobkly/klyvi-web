"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { PRIMARY_NAV, isActive } from "@/lib/nav";
import { cn } from "@/lib/utils";

/**
 * Mobile primary navigation. Fixed to the bottom, the one piece of chrome that
 * is always reachable (05-responsive.md §2). Hidden at md+ where the top bar
 * takes over. Every target meets the 44px floor.
 */
function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm md:hidden"
    >
      <div
        className="mx-auto flex max-w-md items-stretch justify-around px-2"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {PRIMARY_NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-full py-1.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
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
      </div>
    </nav>
  );
}

export { BottomTabBar };
