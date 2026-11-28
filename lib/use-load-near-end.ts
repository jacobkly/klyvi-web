"use client";

import * as React from "react";

/** The nearest ancestor that scrolls on its own, or null for the page. */
function scrollParent(el: HTMLElement): HTMLElement | null {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const { overflowY } = window.getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") return node;
  }
  return null;
}

/**
 * Calls `load` while the sentinel (an empty element just past a list) is
 * within three screens of view, checked on every scroll and resize, and once
 * a frame after `tick` changes (the next page landing), so a short page
 * chains straight into the one after. "Screens" are the scrolling box the
 * list sits in: the window on a page, the panel inside a pop-up.
 *
 * A scroll-position check rather than IntersectionObserver: the observer's
 * enter-transition fires unreliably, and not at all when a page starts
 * already short. `load` should guard itself against a second call before
 * the first lands, since scroll events come faster than renders.
 */
export function useLoadNearEnd(
  sentinelRef: React.RefObject<HTMLElement | null>,
  load: () => void,
  active: boolean,
  tick: unknown
) {
  const loadRef = React.useRef(load);
  React.useEffect(() => {
    loadRef.current = load;
  }, [load]);

  React.useEffect(() => {
    if (!active) return;
    const check = () => {
      const el = sentinelRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      // A zero top is a layout-free environment (jsdom). Skip it.
      if (top <= 0) return;
      const box = scrollParent(el);
      const bottom = box ? box.getBoundingClientRect().bottom : window.innerHeight;
      const screen = box ? box.clientHeight : window.innerHeight;
      if (top <= bottom + screen * 2) loadRef.current();
    };
    const frame = window.requestAnimationFrame(check);
    // Captured on the document, so a scrolling panel counts as well as the page.
    document.addEventListener("scroll", check, { capture: true, passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("scroll", check, { capture: true });
      window.removeEventListener("resize", check);
    };
  }, [sentinelRef, active, tick]);
}
