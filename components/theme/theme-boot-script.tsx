import { THEME_BOOT_SCRIPT } from "@/lib/theme";

/**
 * Goes in the root layout's <head>. Applies the stored appearance before
 * first paint, so a light or accented theme never flashes dark first and
 * every page can stay statically rendered. The CSP allows inline scripts.
 */
export function ThemeBootScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />;
}
