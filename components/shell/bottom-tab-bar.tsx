"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useSession } from "@/components/auth/auth-provider";
import { useUnreadNotices } from "@/components/notifications/unread-provider";
import { PHONE_TABS, SIGNED_OUT_TABS, isActive } from "@/lib/nav";
import { cn } from "@/lib/utils";

const TAB =
  "flex h-14 w-full flex-col items-center justify-center gap-1 rounded-full outline-none transition-[color,background-color,scale] duration-(--dur-press) focus-visible:ring-3 focus-visible:ring-ring/30 active:scale-95 motion-reduce:active:scale-100";

/** Fields that bring up a phone's keyboard. */
function isTextField(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable || el instanceof HTMLTextAreaElement) return true;
  if (!(el instanceof HTMLInputElement)) return false;
  return !["button", "checkbox", "radio", "range", "submit", "reset", "file", "color"].includes(
    el.type
  );
}

/**
 * True while a text field has focus. Phones give no keyboard event, so focus
 * stands in for "the keyboard is up".
 */
function useTyping(): boolean {
  const [typing, setTyping] = React.useState(false);
  React.useEffect(() => {
    const onIn = (e: FocusEvent) => setTyping(isTextField(e.target));
    const onOut = () => setTyping(false);
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => {
      document.removeEventListener("focusin", onIn);
      document.removeEventListener("focusout", onOut);
    };
  }, []);
  return typing;
}

/**
 * Phone navigation: a pill floating above the bottom edge, hidden at md+
 * where the top bar takes over. Signed in it is Home, Explore, Find next,
 * Library and Profile, and Profile carries the unread dot. Signed out it is
 * Home, Explore and Sign in, and Home leads back to the marketing page, which
 * has no bar, so a visitor can always get home. Find next is the one violet
 * tab, as it is on the desktop rail. The bar steps aside while a
 * text field has focus, so the keyboard gets the room.
 */
function BottomTabBar() {
  const pathname = usePathname();
  const { user, profile, loading } = useSession();
  const avatarSrc = profile?.avatarUrl ?? null;
  const typing = useTyping();
  const { unread } = useUnreadNotices();
  const nav = !loading && !user ? SIGNED_OUT_TABS : PHONE_TABS;

  return (
    <nav
      aria-label="Primary"
      data-typing={typing || undefined}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,calc(env(safe-area-inset-bottom)-0.5rem))] data-typing:hidden md:hidden"
    >
      <ul className="pointer-events-auto mx-auto flex max-w-md glass rounded-full border p-1">
        {nav.map((item) => {
          const active = isActive(pathname, item.href);
          const dot = item.href === "/profile" && unread > 0;
          const find = item.href === "/find";
          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  TAB,
                  find
                    ? cn(
                        "bg-primary text-primary-foreground hover:bg-primary/90",
                        active &&
                          "ring-2 ring-violet-text ring-offset-2 ring-offset-background"
                      )
                    : active
                    ? "bg-primary/15 text-violet-text"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="relative">
                  {item.href === "/profile" && avatarSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarSrc}
                      alt=""
                      data-slot="tab-avatar"
                      className={cn(
                        "size-6 rounded-full object-cover",
                        active && "ring-2 ring-violet-text"
                      )}
                    />
                  ) : (
                    <item.icon
                      aria-hidden="true"
                      className="size-5"
                      strokeWidth={active ? 2.25 : 2}
                    />
                  )}
                  {dot ? (
                    <span
                      aria-hidden="true"
                      data-slot="unread-dot"
                      className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-violet-text ring-2 ring-background"
                    />
                  ) : null}
                </span>
                <span className="max-w-full truncate px-1 text-[11px] font-medium leading-none">
                  {item.label}
                  {dot ? <span className="sr-only">, {unread} unread</span> : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export { BottomTabBar };
