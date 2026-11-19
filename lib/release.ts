const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * "Out 16 December" for a title not out yet, with the year when it isn't
 * this one. Null once it's out, or with no date. Days are UTC, as TMDB's
 * dates are. Spelled out by hand so the server's HTML matches the browser's.
 */
export function outLabel(
  date: string | null | undefined,
  now: Date = new Date()
): string | null {
  if (!date) return null;
  const d = new Date(date.slice(0, 10) + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return null;
  const today = now.toISOString().slice(0, 10);
  if (date.slice(0, 10) <= today) return null;
  const year =
    d.getUTCFullYear() === now.getUTCFullYear() ? "" : ` ${d.getUTCFullYear()}`;
  return `Out ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}${year}`;
}
