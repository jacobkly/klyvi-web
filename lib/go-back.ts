"use client";

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

import { AUTH_SCREENS } from "@/lib/gated-routes";

/** Pages a person passes through, not ones they would want to return to. */
const PASSED_THROUGH = [...AUTH_SCREENS, "/reset-password", "/onboarding"];

/** The Navigation API, the part of it used here. Not in every browser. */
type HistoryList = {
  entries: () => { url: string | null }[];
  currentEntry: { index: number } | null;
};

function isUnder(path: string, base: string) {
  return path === base || path.startsWith(base + "/");
}

/** A film's, show's or season's page. */
export function isDetailPath(pathname: string): boolean {
  return /^\/(movie|tv)\/[^/]+/.test(pathname);
}

/** Where Back goes when there is no page behind this one, as on a link
 *  someone sent: a season's show, or Explore. */
export function backFallback(pathname: string): string {
  const season = /^(\/tv\/[^/]+)\/season\//.exec(pathname);
  return season ? season[1] : "/explore";
}

/** How many history steps back the last different page is, or 0 for none.
 *  `paths` is the history up to and including the current page. */
export function stepsBack(paths: (string | null)[]): number {
  const here = paths[paths.length - 1];
  for (let steps = 1; steps < paths.length; steps++) {
    const path = paths[paths.length - 1 - steps];
    // An entry the browser will not name is not one to land on blind.
    if (path == null || path === here) continue;
    if (PASSED_THROUGH.some((p) => isUnder(path, p))) continue;
    return steps;
  }
  return 0;
}

function pathOf(url: string | null): string | null {
  try {
    return url ? new URL(url).pathname : null;
  } catch {
    return null;
  }
}

/**
 * Goes to the page the user came from, without ever leaving Klyvi. The
 * Navigation API lists only this site's entries. A browser without it goes
 * back one step, and only once the user has moved within the app.
 */
export function useGoBack(): () => void {
  const router = useRouter();
  const pathname = usePathname();
  const moved = React.useRef(false);
  const arrivedAt = React.useRef(pathname);
  React.useEffect(() => {
    if (pathname !== arrivedAt.current) moved.current = true;
  }, [pathname]);

  return React.useCallback(() => {
    const list = (window as { navigation?: HistoryList }).navigation;
    const index = list?.currentEntry?.index;
    if (list && index != null) {
      const steps = stepsBack(
        list.entries().slice(0, index + 1).map((e) => pathOf(e.url))
      );
      if (steps > 0) return window.history.go(-steps);
    } else if (moved.current) {
      return router.back();
    }
    // Replaced, so Back from there does not return to the page just left.
    router.replace(backFallback(pathname));
  }, [pathname, router]);
}
