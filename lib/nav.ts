import {
  CircleUser,
  Compass,
  House,
  Library,
  LogIn,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

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
 * The phone tab bar signed in: Find next in the middle, where a thumb rests,
 * and Profile last. Profile holds Settings, Notifications and Sign out, so
 * the phone needs no account menu at the top.
 */
export const PHONE_TABS: NavItem[] = [
  { href: "/home", label: "Home", icon: House },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/find", label: "Find next", icon: Sparkles },
  { href: "/library", label: "Library", icon: Library },
  { href: "/profile", label: "Profile", icon: CircleUser },
];

/** Pages the Profile tab stays lit for, since you reach them from it. */
const PROFILE_PAGES = ["/profile", "/settings", "/notifications"];

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
  if (href === "/profile") return PROFILE_PAGES.some((p) => isUnder(pathname, p));
  return isUnder(pathname, href);
}

function isUnder(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}
