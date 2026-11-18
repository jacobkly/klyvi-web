"use client";

import * as React from "react";

import { usePref } from "@/lib/local-prefs";
import { applyTheme } from "@/lib/theme";

/**
 * Keeps the html element in step with the appearance prefs after load: a
 * change in settings, the server copy arriving on sign-in, or another tab.
 * The boot script handles first paint.
 */
export function ThemeSync() {
  const [themeMode] = usePref("themeMode");
  const [themeAccent] = usePref("themeAccent");
  const [textSize] = usePref("textSize");
  const [reduceMotion] = usePref("reduceMotion");

  React.useEffect(() => {
    applyTheme(document.documentElement, {
      themeMode,
      themeAccent,
      textSize,
      reduceMotion,
    });
  }, [themeMode, themeAccent, textSize, reduceMotion]);

  return null;
}
