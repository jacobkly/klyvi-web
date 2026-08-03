import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const recordInteractionsBatch = vi.fn((..._args: unknown[]) =>
  Promise.resolve({ accepted: 0, rejected: 0 })
);
vi.mock("@/lib/api/interactions", () => ({
  recordInteractionsBatch: (a: unknown) => recordInteractionsBatch(a),
}));

/** Total interactions across all batch calls so far. */
function totalSent() {
  return recordInteractionsBatch.mock.calls.reduce(
    (n, call) => n + (call[0] as unknown[]).length,
    0
  );
}

import {
  FLUSH_AFTER_MS,
  FLUSH_AT,
  flushSignals,
  queueSignal,
  resetSignalsForTests,
} from "./interactions-batch";

describe("interactions batch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetSignalsForTests();
    recordInteractionsBatch.mockClear();
  });
  afterEach(() => vi.useRealTimers());

  it("holds signals until the timer fires, then sends them as one batch", () => {
    queueSignal({ tmdbId: 1, mediaType: "movie", kind: "impression", source: "feed" });
    queueSignal({ tmdbId: 2, mediaType: "movie", kind: "impression", source: "feed" });
    expect(recordInteractionsBatch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(FLUSH_AFTER_MS);
    // One request, both signals in it.
    expect(recordInteractionsBatch).toHaveBeenCalledTimes(1);
    expect(totalSent()).toBe(2);
  });

  it("dedupes the same signal for the whole session", () => {
    queueSignal({ tmdbId: 1, mediaType: "movie", kind: "impression", source: "feed" });
    queueSignal({ tmdbId: 1, mediaType: "movie", kind: "impression", source: "feed" });
    flushSignals();
    expect(totalSent()).toBe(1);
    // Even after a flush, a re-render must not resend it.
    queueSignal({ tmdbId: 1, mediaType: "movie", kind: "impression", source: "feed" });
    flushSignals();
    expect(totalSent()).toBe(1);
  });

  it("flushes immediately at the size cap", () => {
    for (let i = 1; i <= FLUSH_AT; i++) {
      queueSignal({ tmdbId: i, mediaType: "movie", kind: "impression", source: "feed" });
    }
    expect(recordInteractionsBatch).toHaveBeenCalledTimes(1);
    expect(totalSent()).toBe(FLUSH_AT);
  });

  it("keeps impression and clicked for one title distinct", () => {
    queueSignal({ tmdbId: 1, mediaType: "movie", kind: "impression", source: "feed" });
    queueSignal({ tmdbId: 1, mediaType: "movie", kind: "clicked", source: "feed" });
    flushSignals();
    expect(totalSent()).toBe(2);
  });
});
