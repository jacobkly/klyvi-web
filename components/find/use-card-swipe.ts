"use client";

import * as React from "react";

import { useReducedMotion } from "@/lib/motion";

/**
 * Phones swipe between picks. The card follows the finger sideways, and a
 * drag past a quarter of its width (or 60px) steps. A mostly vertical drag is
 * left to the page, so scrolling still works. Shared by Find Next and the
 * landing page's demo of it.
 */
export function useCardSwipe({
  canPrev,
  canNext,
  onStep,
}: {
  canPrev: boolean;
  canNext: boolean;
  onStep: (by: 1 | -1) => void;
}) {
  const reduceMotion = useReducedMotion();
  const cardRef = React.useRef<HTMLDivElement>(null);
  const drag = React.useRef<{ x: number; y: number; dx: number; on: boolean } | null>(
    null
  );

  const shift = (dx: number, animate: boolean) => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transition =
      animate && !reduceMotion ? "transform var(--dur-base) var(--ease-enter)" : "none";
    el.style.transform = dx ? `translateX(${dx}px)` : "";
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    drag.current = { x: t.clientX, y: t.clientY, dx: 0, on: false };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const d = drag.current;
    if (!d) return;
    const t = e.touches[0];
    const dx = t.clientX - d.x;
    const dy = t.clientY - d.y;
    if (!d.on) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        drag.current = null;
        return;
      }
      if (Math.abs(dx) < 10) return;
      d.on = true;
    }
    d.dx = dx;
    // Resist at either end, where there is nothing to step to.
    const atEnd = (dx > 0 && !canPrev) || (dx < 0 && !canNext);
    shift(atEnd ? dx / 4 : dx, false);
  };
  const onTouchEnd = () => {
    const d = drag.current;
    drag.current = null;
    if (!d?.on) return;
    const width = cardRef.current?.offsetWidth ?? 320;
    const far = Math.abs(d.dx) > Math.min(60, width / 4);
    shift(0, true);
    if (far) onStep(d.dx < 0 ? 1 : -1);
  };

  return {
    cardRef,
    swipe: { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel: onTouchEnd },
  };
}
