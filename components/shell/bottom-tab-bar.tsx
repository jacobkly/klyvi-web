"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useSession } from "@/components/auth/auth-provider";
import { PRIMARY_NAV, SIGNED_OUT_TABS, isActive } from "@/lib/nav";
import { cn } from "@/lib/utils";

const TAB =
  "flex h-14 w-full flex-col items-center justify-center gap-1 rounded-full outline-none transition-[color,background-color,scale] duration-(--dur-fast) focus-visible:ring-3 focus-visible:ring-ring/30 active:scale-95 motion-reduce:active:scale-100";

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
 * where the top bar takes over. Four tabs signed in. Signed out it is Home,
 * Explore and Sign in, and Home leads back to the marketing page, which has
 * no bar, so a visitor can always get home. Search and the account live in
 * the phone's top bar (mobile-top-bar). The bar steps aside while a text
 * field has focus, so the keyboard gets the room.
 */
function BottomTabBar() {
  const pathname = usePathname();
  const { user, loading } = useSession();
  const typing = useTyping();
  const nav = !loading && !user ? SIGNED_OUT_TABS : PRIMARY_NAV;

  return (
    <nav
      aria-label="Primary"
      data-typing={typing || undefined}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,calc(env(safe-area-inset-bottom)-0.5rem))] data-typing:hidden md:hidden"
    >
      <ul className="pointer-events-auto mx-auto flex max-w-md rounded-full border border-border bg-card p-1">
        {nav.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  TAB,
                  active
                    ? "bg-primary/15 text-violet-text"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon
                  aria-hidden="true"
                  className="size-5"
                  strokeWidth={active ? 2.25 : 2}
                />
                <span className="max-w-full truncate px-1 text-[11px] font-medium leading-none">
                  {item.label}
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
