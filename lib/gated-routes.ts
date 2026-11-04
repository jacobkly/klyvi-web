/**
 * Routes the proxy gates, shared with robots.txt so a new gated route can't
 * end up open to crawlers. Adding one here also means adding it to the
 * proxy's matcher, which Next reads as literals at build time.
 */
export const PROTECTED_PREFIXES = [
  "/home",
  "/find",
  "/library",
  "/profile",
  "/settings",
  "/notifications",
  "/onboarding",
];

export const AUTH_SCREENS = ["/signin", "/signup"];
