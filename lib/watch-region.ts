/**
 * The country "Where to watch" opens on: the one you picked last, else the
 * browser's, else the US.
 */

export const DEFAULT_REGION = "US";

const STORAGE_KEY = "klyvi:watch-region";
const COUNTRY = /^[A-Z]{2}$/;

/** The first browser language that names a country ("en-GB" is GB, a bare
 *  "de" is its likely country, DE). A UN region such as "419" is skipped. */
export function regionFromLanguages(languages: readonly string[]): string {
  for (const tag of languages) {
    try {
      const region = new Intl.Locale(tag).maximize().region?.toUpperCase();
      if (region && COUNTRY.test(region)) return region;
    } catch {
      // Not a language tag. Try the next one.
    }
  }
  return DEFAULT_REGION;
}

/** Browser only. */
export function initialRegion(): string {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && COUNTRY.test(saved)) return saved;
  } catch {
    // Storage blocked. The browser's language still answers.
  }
  const langs = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  return regionFromLanguages(langs.filter(Boolean));
}

/** Remembers a country picked by hand, for the next title. */
export function saveRegion(region: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, region);
  } catch {
    // A convenience only.
  }
}

const NAMES = (() => {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    return null;
  }
})();

/** "United Kingdom" for GB, or the code itself when the runtime can't say. */
export function regionName(code: string): string {
  try {
    return NAMES?.of(code) ?? code;
  } catch {
    return code;
  }
}
