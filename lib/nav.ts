import { Compass, House, Library, LogIn, Sparkles, type LucideIcon } from "lucide-react";

/**
 * The primary navigation, shared verbatim between the desktop top bar and the
 * mobile bottom tab bar so a user moving between devices sees the same words.
 * Labels from docs/planning/06-copy.md §3.
 */
export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const PRIMARY_NAV: NavItem[] = [
  { href: "/home", label: "Home", icon: House },
  { href: "/find", label: "Find next", icon: Sparkles },
  { href: "/library", label: "Library", icon: Library },
  { href: "/explore", label: "Explore", icon: Compass },
];

/**
 * Signed out, Home, Find next and Library would only bounce to sign-in, so a
 * visitor gets the one tab they can use. Sign in and Get started sit beside it.
 */
export const SIGNED_OUT_NAV: NavItem[] = [
  { href: "/explore", label: "Explore", icon: Compass },
];

/**
 * The phone tab bar signed out: Home is the marketing page (which has no bar,
 * so it closes the loop), Explore is what a visitor can use, and Sign in is
 * the way in.
 */
export const SIGNED_OUT_TABS: NavItem[] = [
  { href: "/", label: "Home", icon: House },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/signin", label: "Sign in", icon: LogIn },
];

/** True when the current pathname belongs to this nav item. */
export function isActive(pathname: string, href: string): boolean {
  if (href === "/home") return pathname === "/home" || pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}
