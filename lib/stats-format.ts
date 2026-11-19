import type { UserStats } from "@/lib/types";

/** "9h 14m" for 9.2333 hours, "12h" on the hour, "30m" under one. */
export function formatHours(hours: number): string {
  const total = Math.round(hours * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export type DecadeBucket = { label: string; titles: number; hours: number };

/**
 * Release years summed into decades, from the earliest to the latest with
 * the empty ones in between, so the bars sit on a real time axis.
 */
export function decadeBuckets(
  years: UserStats["releaseYears"]
): DecadeBucket[] {
  if (years.length === 0) return [];
  const byDecade = new Map<number, { titles: number; hours: number }>();
  for (const y of years) {
    const d = Math.floor(y.year / 10) * 10;
    const b = byDecade.get(d) ?? { titles: 0, hours: 0 };
    b.titles += y.titles;
    b.hours += y.hours;
    byDecade.set(d, b);
  }
  const decades = [...byDecade.keys()];
  const out: DecadeBucket[] = [];
  for (let d = Math.min(...decades); d <= Math.max(...decades); d += 10) {
    const b = byDecade.get(d) ?? { titles: 0, hours: 0 };
    out.push({
      label: `${d}s`,
      titles: b.titles,
      hours: Math.round(b.hours * 10) / 10,
    });
  }
  return out;
}

const FORMATS: Record<string, string> = {
  movie: "Movies",
  season: "TV seasons",
};

/** The API's media types as the stats page names them. */
export function formatLabel(mediaType: string): string {
  return FORMATS[mediaType] ?? mediaType;
}

let regions: Intl.DisplayNames | null = null;

/** "United States" for "US". Anything that isn't a region code stays. */
export function countryName(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return code;
  try {
    regions ??= new Intl.DisplayNames(["en"], { type: "region" });
    return regions.of(code) ?? code;
  } catch {
    return code;
  }
}

/** "81 to 90" for the API's "81-90" band. */
export function bandRange(band: string): string {
  const [low, high] = band.split("-");
  return high ? `${low} to ${high}` : band;
}
