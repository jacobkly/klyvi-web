import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { THEME_BOOT_SCRIPT } from "@/lib/theme";

import { ThemeBootScript } from "./theme-boot-script";

describe("ThemeBootScript", () => {
  // Stands in for a server-rendered theme: the script the layout puts in
  // <head> runs before first paint, so the stored theme is the first one seen.
  it("inlines the boot script unescaped", () => {
    const html = renderToStaticMarkup(<ThemeBootScript />);
    expect(html).toBe(`<script>${THEME_BOOT_SCRIPT}</script>`);
  });
});
