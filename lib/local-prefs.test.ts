import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import {
  DEFAULT_PREFS,
  readAllPrefs,
  readPref,
  usePref,
  writePref,
} from "./local-prefs";

beforeEach(() => window.localStorage.clear());

describe("local prefs", () => {
  it("falls back to defaults when nothing is stored", () => {
    expect(readPref("textSize")).toBe(DEFAULT_PREFS.textSize);
    expect(readPref("scoringSystem")).toBe(DEFAULT_PREFS.scoringSystem);
  });

  it("round-trips a write", () => {
    writePref("textSize", "large");
    expect(readPref("textSize")).toBe("large");
    // Unrelated keys keep their defaults.
    expect(readPref("listOrder")).toBe(DEFAULT_PREFS.listOrder);
  });

  it("survives corrupted storage", () => {
    window.localStorage.setItem("klyvi:prefs", "{not json");
    expect(readPref("textSize")).toBe(DEFAULT_PREFS.textSize);
  });

  it("stops pushing keys it no longer knows, like the old notification switches", () => {
    window.localStorage.setItem(
      "klyvi:prefs",
      JSON.stringify({
        textSize: "large",
        notifications: { premieres: false },
        emails: { digest: true },
      })
    );

    const pushed = readAllPrefs();

    expect(pushed.textSize).toBe("large");
    expect(pushed).not.toHaveProperty("notifications");
    expect(pushed).not.toHaveProperty("emails");
  });

  it("updates hook consumers when a pref changes", () => {
    const { result } = renderHook(() => usePref("themeAccent"));
    expect(result.current[0]).toBe("violet");
    act(() => result.current[1]("blue"));
    expect(result.current[0]).toBe("blue");
    expect(readPref("themeAccent")).toBe("blue");
  });
});
