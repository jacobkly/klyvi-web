import * as React from "react";

/**
 * True on macOS and iOS. Chromium exposes `userAgentData.platform`, and
 * everything else still answers to the deprecated `navigator.platform`,
 * so both are consulted before falling back to the user agent string for
 * iPadOS, which reports itself as a Mac anyway.
 */
export function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  const withData = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  const platform = withData.userAgentData?.platform ?? navigator.platform ?? "";
  if (platform) return /mac|iphone|ipad|ipod/i.test(platform);
  return /Macintosh|iPhone|iPad|iPod/.test(navigator.userAgent);
}

/** The platform never changes while the page is open. */
function subscribeNever(): () => void {
  return () => {};
}

/**
 * `null` on the server and during hydration, then the real answer.
 *
 * Deliberately not a guess: the server cannot know which platform is
 * asking, so committing to a symbol during render would be wrong for half
 * of users and React would visibly swap it on hydration. Callers render
 * nothing while it is null.
 */
export function useIsMac(): boolean | null {
  return React.useSyncExternalStore(subscribeNever, isMacPlatform, () => null);
}

/** The modifier label for keyboard hints: "⌘" on Apple, "Ctrl" elsewhere. */
export function modifierLabel(isMac: boolean): string {
  return isMac ? "⌘" : "Ctrl";
}
