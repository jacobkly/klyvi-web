import { Compass, House, Library, Sparkles, type LucideIcon } from "lucide-react";

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

/** True when the current pathname belongs to this nav item. */
export function isActive(pathname: string, href: string): boolean {
  if (href === "/home") return pathname === "/home" || pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}
