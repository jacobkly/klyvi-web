"use client";

import * as React from "react";

import { usePref } from "@/lib/local-prefs";

/**
 * The five movements the app makes, in one place. Durations and curves match
 * the CSS tokens in globals.css (--dur-* and --ease-*), so a framer-motion
 * transition and a Tailwind transition land on the same timing.
 */
const ENTER = [0.16, 1, 0.3, 1] as const;
const EXIT = [0.4, 0, 1, 1] as const;

export const MOTION = {
  /** A control pressed: buttons, chips, toggles. */
  press: { duration: 0.12, ease: ENTER },
  /** Something rising under the pointer: a card on hover. */
  lift: { duration: 0.2, ease: ENTER },
  /** Something new coming into view: a toast, a row, an image. */
  arrive: { duration: 0.3, ease: ENTER },
  /** Something leaving: a removed card, a dismissed toast. */
  dismiss: { duration: 0.3, ease: EXIT },
  /** A sheet or drawer sliding in. The longest the app ever moves. */
  panel: { duration: 0.4, ease: ENTER },
} as const;

export type MotionPreset = keyof typeof MOTION;

export type MotionTransition = {
  duration: number;
  ease: number[];
};

/**
 * A framer-motion transition for one preset. With reduced motion on, the
 * change still happens, it just doesn't animate.
 */
export function transition(
  preset: MotionPreset,
  reduced: boolean
): MotionTransition {
  const p = MOTION[preset];
  return { duration: reduced ? 0 : p.duration, ease: [...p.ease] };
}

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribeSystem(listener: () => void): () => void {
  if (typeof window.matchMedia !== "function") return () => {};
  const mql = window.matchMedia(QUERY);
  mql.addEventListener?.("change", listener);
  return () => mql.removeEventListener?.("change", listener);
}

function systemReduced(): boolean {
  return typeof window.matchMedia === "function"
    ? window.matchMedia(QUERY).matches
    : false;
}

/**
 * True when either the system asks for reduced motion or Settings' Reduce
 * motion is on. CSS already covers transitions and keyframes (globals.css);
 * this is for motion driven from script.
 */
export function useReducedMotion(): boolean {
  const system = React.useSyncExternalStore(
    subscribeSystem,
    systemReduced,
    () => false
  );
  const [pref] = usePref("reduceMotion");
  return system || pref;
}
