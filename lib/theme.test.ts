import { readFileSync } from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  ACCENTS,
  PREFS_STORAGE_KEY,
  THEME_BOOT_SCRIPT,
  applyTheme,
  type ThemeSettings,
} from "./theme";

const root = () => document.documentElement;

function resetRoot() {
  const el = root();
  el.className = "";
  el.removeAttribute("style");
  for (const name of Object.keys(el.dataset)) delete el.dataset[name];
}

/** What the page shows: the theme state the html element carries. */
function snapshot() {
  const el = root();
  return {
    dark: el.classList.contains("dark"),
    light: el.classList.contains("light"),
    scheme: el.style.colorScheme,
    accent: el.dataset.accent,
    text: el.dataset.textSize,
    reduce: el.classList.contains("reduce-motion"),
  };
}

function runBootScript() {
  // The same string the layout inlines in <head>.
  new Function(THEME_BOOT_SCRIPT)();
}

afterEach(() => {
  resetRoot();
  window.localStorage.clear();
});

describe("applyTheme", () => {
  it("defaults to dark violet at the default size", () => {
    applyTheme(root(), {});
    expect(snapshot()).toEqual({
      dark: true,
      light: false,
      scheme: "dark",
      accent: "violet",
      text: "default",
      reduce: false,
    });
  });

  it("switches to light", () => {
    root().classList.add("dark");
    applyTheme(root(), { themeMode: "light" });
    expect(snapshot()).toMatchObject({ dark: false, light: true, scheme: "light" });
  });

  it.each(ACCENTS)("maps the %s accent onto the html element", (accent) => {
    applyTheme(root(), { themeAccent: accent });
    expect(root().dataset.accent).toBe(accent);
  });

  it("falls back to violet and the default size for unknown values", () => {
    applyTheme(root(), {
      themeAccent: "teal",
      textSize: "huge",
    } as unknown as Partial<ThemeSettings>);
    expect(snapshot()).toMatchObject({ accent: "violet", text: "default" });
  });

  it("sets the text size and reduce motion", () => {
    applyTheme(root(), { textSize: "large", reduceMotion: true });
    expect(snapshot()).toMatchObject({ text: "large", reduce: true });
    applyTheme(root(), { textSize: "compact", reduceMotion: false });
    expect(snapshot()).toMatchObject({ text: "compact", reduce: false });
  });
});

describe("the boot script", () => {
  const cases: Partial<ThemeSettings>[] = [
    {},
    { themeMode: "light" },
    { themeMode: "light", themeAccent: "green", textSize: "large", reduceMotion: true },
    { themeMode: "dark", themeAccent: "red", textSize: "compact" },
  ];

  it.each(cases)("applies the stored prefs the way applyTheme does: %o", (prefs) => {
    applyTheme(root(), prefs);
    const want = snapshot();
    resetRoot();
    root().classList.add("dark");

    window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
    runBootScript();
    expect(snapshot()).toEqual(want);
  });

  it("leaves the dark default in place when the stored blob is unreadable", () => {
    root().classList.add("dark");
    window.localStorage.setItem(PREFS_STORAGE_KEY, "{not json");
    expect(runBootScript).not.toThrow();
    expect(snapshot()).toMatchObject({ dark: true, light: false });
  });

  it("keeps the rest of the html classes", () => {
    root().className = "dark font-vars h-full";
    window.localStorage.setItem(
      PREFS_STORAGE_KEY,
      JSON.stringify({ themeMode: "light" })
    );
    runBootScript();
    expect(root().classList.contains("font-vars")).toBe(true);
    expect(root().classList.contains("h-full")).toBe(true);
  });
});

describe("accent tokens in globals.css", () => {
  const css = readFileSync(path.resolve(__dirname, "../app/globals.css"), "utf8");

  function rule(selector: string): string {
    const at = css.indexOf(`${selector} {`);
    expect(at, `${selector} has a rule`).toBeGreaterThan(-1);
    return css.slice(at, css.indexOf("}", at));
  }

  it.each(ACCENTS.filter((a) => a !== "violet"))(
    "the %s accent repoints the primary, ring and accent text in both themes",
    (accent) => {
      for (const selector of [
        `[data-accent="${accent}"]`,
        `.dark[data-accent="${accent}"]`,
      ]) {
        const body = rule(selector);
        for (const token of ["--primary:", "--ring:", "--violet-text:"]) {
          expect(body, `${selector} sets ${token}`).toContain(token);
        }
      }
    }
  );

  it("steps the root text size", () => {
    expect(rule('html[data-text-size="compact"]')).toContain("font-size");
    expect(rule('html[data-text-size="large"]')).toContain("font-size");
  });

  it("switches motion off under the reduce-motion class", () => {
    expect(css).toMatch(/\.reduce-motion \*,/);
  });
});
