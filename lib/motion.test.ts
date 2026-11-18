import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { writePref } from "@/lib/local-prefs";
import { MOTION, transition, useReducedMotion, type MotionPreset } from "./motion";

const PRESETS = Object.keys(MOTION) as MotionPreset[];

afterEach(() => {
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe("motion presets", () => {
  it("names the five movements at the token durations", () => {
    expect(PRESETS).toEqual(["press", "lift", "arrive", "dismiss", "panel"]);
    expect(transition("press", false).duration).toBe(0.12);
    expect(transition("lift", false).duration).toBe(0.2);
    expect(transition("arrive", false).duration).toBe(0.3);
    expect(transition("dismiss", false).duration).toBe(0.3);
    expect(transition("panel", false).duration).toBe(0.4);
  });

  it("leaves on the exit curve and arrives on the enter curve", () => {
    expect(transition("dismiss", false).ease).toEqual([0.4, 0, 1, 1]);
    expect(transition("arrive", false).ease).toEqual([0.16, 1, 0.3, 1]);
  });

  it.each(PRESETS)("doesn't animate %s with reduced motion on", (p) => {
    expect(transition(p, true).duration).toBe(0);
  });
});

describe("useReducedMotion", () => {
  it("is off by default", () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("follows Settings' Reduce motion", () => {
    const { result } = renderHook(() => useReducedMotion());
    act(() => writePref("reduceMotion", true));
    expect(result.current).toBe(true);
  });

  it("follows the system setting", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("reduce"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });
});
