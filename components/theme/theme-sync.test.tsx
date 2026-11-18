import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { writePref } from "@/lib/local-prefs";

import { ThemeSync } from "./theme-sync";

const root = () => document.documentElement;

afterEach(() => {
  window.localStorage.clear();
  root().className = "";
  root().removeAttribute("style");
  for (const name of Object.keys(root().dataset)) delete root().dataset[name];
});

describe("ThemeSync", () => {
  it("applies an appearance change to the html element as it happens", () => {
    render(<ThemeSync />);
    expect(root().classList.contains("dark")).toBe(true);

    act(() => {
      writePref("themeMode", "light");
      writePref("themeAccent", "pink");
      writePref("textSize", "large");
      writePref("reduceMotion", true);
    });

    expect(root().classList.contains("light")).toBe(true);
    expect(root().classList.contains("dark")).toBe(false);
    expect(root().dataset.accent).toBe("pink");
    expect(root().dataset.textSize).toBe("large");
    expect(root().classList.contains("reduce-motion")).toBe(true);
  });

  it("picks up prefs another tab saved", () => {
    render(<ThemeSync />);
    act(() => {
      window.localStorage.setItem(
        "klyvi:prefs",
        JSON.stringify({ themeMode: "light" })
      );
      window.dispatchEvent(new StorageEvent("storage", { key: "klyvi:prefs" }));
    });
    expect(root().classList.contains("light")).toBe(true);
  });
});
