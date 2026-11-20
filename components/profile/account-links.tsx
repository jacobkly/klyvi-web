"use client";

import Link from "next/link";
import { Bell, ChevronRight, Heart, LogOut, Settings } from "lucide-react";

import { useSession } from "@/components/auth/auth-provider";
import { useUnreadNotices } from "@/components/notifications/unread-provider";

const ROW =
  "flex min-h-12 w-full items-center gap-3 px-4 text-left text-sm text-foreground outline-none transition-colors hover:bg-muted active:bg-muted focus-visible:bg-muted";

/**
 * The account menu as rows on the profile page, for phones. There the avatar
 * opens this page instead of a dropdown, so everything the menu held (bar
 * Stats, which is a tab right above) lives here.
 */
export function AccountLinks() {
  const { signOut } = useSession();
  const { unread } = useUnreadNotices();

  const rows = [
    { href: "/library/favorites", label: "Favorites", icon: Heart, tint: "bg-tint-rose/15 text-tint-rose" },
    { href: "/settings", label: "Settings", icon: Settings, tint: "bg-tint-sky/15 text-tint-sky" },
    { href: "/notifications", label: "Notifications", icon: Bell, tint: "bg-tint-amber/15 text-tint-amber" },
  ];

  return (
    <nav
      aria-label="Account"
      className="glass mt-6 overflow-hidden rounded-2xl border md:hidden"
    >
      <ul className="divide-y divide-border">
        {rows.map((r) => (
          <li key={r.href}>
            <Link href={r.href} className={ROW}>
              <span className={`flex size-8 items-center justify-center rounded-full ${r.tint}`}>
                <r.icon aria-hidden="true" className="size-4" />
              </span>
              <span className="flex-1">{r.label}</span>
              {r.href === "/notifications" && unread > 0 ? (
                <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-xs text-violet-text">
                  {unread} unread
                </span>
              ) : null}
              <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
        <li>
          <button
            type="button"
            className={`${ROW} text-destructive`}
            onClick={() => void signOut()}
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-destructive/15">
              <LogOut aria-hidden="true" className="size-4" />
            </span>
            <span className="flex-1">Sign out</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
