"use client";

import * as React from "react";

/** Below md, the width where the phone layout takes over. */
const QUERY = "(width < 48rem)";

function subscribe(listener: () => void): () => void {
  if (typeof window.matchMedia !== "function") return () => {};
  const mql = window.matchMedia(QUERY);
  mql.addEventListener?.("change", listener);
  return () => mql.removeEventListener?.("change", listener);
}

/** For the few things CSS can't switch, like a dialog becoming a sheet. */
export function useIsPhone(): boolean {
  return React.useSyncExternalStore(
    subscribe,
    () =>
      typeof window.matchMedia === "function" && window.matchMedia(QUERY).matches,
    () => false
  );
}
