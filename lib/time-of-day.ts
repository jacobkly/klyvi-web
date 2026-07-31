/**
 * The window someone is choosing something to watch for.
 *
 * "Tonight" is wrong at 9am, so the phrase follows the clock. Late night
 * and the small hours fall through to "right now", which is also the
 * fallback when the hour cannot be read at all: vague but never wrong.
 */
export function watchWindowPhrase(now: Date = new Date()): string {
  const hour = now.getHours();
  if (!Number.isFinite(hour)) return "right now";
  if (hour >= 5 && hour < 12) return "this morning";
  if (hour >= 12 && hour < 17) return "this afternoon";
  if (hour >= 17 && hour < 23) return "tonight";
  return "right now";
}
