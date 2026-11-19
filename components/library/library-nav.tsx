import Link from "next/link";

import { cn } from "@/lib/utils";

const LINKS = [
  { id: "library", href: "/library", label: "Library" },
  { id: "favorites", href: "/library/favorites", label: "Favorites" },
  { id: "stats", href: "/profile/stats", label: "Stats" },
] as const;

/** The library's own pages, one tap apart. Stats lives in the profile, so
 *  it is a link out rather than a tab of its own. */
export function LibraryNav({ active }: { active: "library" | "favorites" }) {
  return (
    <nav aria-label="Library" className="mb-4 flex gap-2">
      {LINKS.map((l) => {
        const isActive = l.id === active;
        return (
          <Link
            key={l.id}
            href={l.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "tap-target inline-flex items-center rounded-full px-4 py-1.5 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30",
              isActive
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
