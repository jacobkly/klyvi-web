/**
 * The appearance prefs (mode, accent, text size, motion) as state on the
 * html element, which is all globals.css reads:
 * - `dark` or `light` class, plus color-scheme for form controls and
 *   scrollbars
 * - `data-accent`, which repoints the primary, ring and accent text tokens
 * - `data-text-size`, which steps the root font size
 * - the `reduce-motion` class, which switches motion off on top of the
 *   system setting
 *
 * Not a client module: the root layout (a server component) inlines the
 * boot script, and the settings sync applies the same state on change.
 */

export const PREFS_STORAGE_KEY = "klyvi:prefs";

export const ACCENTS = [
  "violet",
  "blue",
  "green",
  "orange",
  "pink",
  "red",
] as const;

export const TEXT_SIZES = ["compact", "default", "large"] as const;

export type ThemeSettings = {
  themeMode: "dark" | "light";
  themeAccent: (typeof ACCENTS)[number];
  textSize: (typeof TEXT_SIZES)[number];
  reduceMotion: boolean;
};

export function applyTheme(
  root: HTMLElement,
  prefs: Partial<ThemeSettings>
): void {
  const light = prefs.themeMode === "light";
  root.classList.toggle("dark", !light);
  root.classList.toggle("light", light);
  root.style.colorScheme = light ? "light" : "dark";
  root.dataset.accent = ACCENTS.includes(prefs.themeAccent as never)
    ? prefs.themeAccent
    : "violet";
  root.dataset.textSize = TEXT_SIZES.includes(prefs.textSize as never)
    ? prefs.textSize
    : "default";
  root.classList.toggle("reduce-motion", prefs.reduceMotion === true);
}

/**
 * applyTheme as a plain script for <head>, so the stored theme lands before
 * first paint and every page can stay static. It must behave exactly like
 * applyTheme; theme.test.ts runs both over the same prefs. Any failure
 * (storage blocked, a corrupt blob) leaves the server's dark default.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{
var p=JSON.parse(localStorage.getItem(${JSON.stringify(PREFS_STORAGE_KEY)})||"{}")||{};
var r=document.documentElement,l=p.themeMode==="light";
var a=${JSON.stringify(ACCENTS)},t=${JSON.stringify(TEXT_SIZES)};
r.classList.toggle("dark",!l);r.classList.toggle("light",l);
r.style.colorScheme=l?"light":"dark";
r.dataset.accent=a.indexOf(p.themeAccent)>=0?p.themeAccent:"violet";
r.dataset.textSize=t.indexOf(p.textSize)>=0?p.textSize:"default";
r.classList.toggle("reduce-motion",p.reduceMotion===true);
}catch(e){}})();`;
