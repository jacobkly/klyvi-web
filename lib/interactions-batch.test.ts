import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const recordInteraction = vi.fn((..._args: unknown[]) =>
  Promise.resolve({})
);
vi.mock("@/lib/api/interactions", () => ({
  recordInteraction: (a: unknown) => recordInteraction(a),
}));

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
    recordInteraction.mockClear();
  });
  afterEach(() => vi.useRealTimers());

  it("holds signals until the timer fires, then sends them together", () => {
    queueSignal({ tmdbId: 1, mediaType: "movie", kind: "impression", source: "feed" });
    queueSignal({ tmdbId: 2, mediaType: "movie", kind: "impression", source: "feed" });
    expect(recordInteraction).not.toHaveBeenCalled();

    vi.advanceTimersByTime(FLUSH_AFTER_MS);
    expect(recordInteraction).toHaveBeenCalledTimes(2);
  });

  it("dedupes the same signal for the whole session", () => {
    queueSignal({ tmdbId: 1, mediaType: "movie", kind: "impression", source: "feed" });
    queueSignal({ tmdbId: 1, mediaType: "movie", kind: "impression", source: "feed" });
    flushSignals();
    expect(recordInteraction).toHaveBeenCalledTimes(1);
    // Even after a flush, a re-render must not resend it.
    queueSignal({ tmdbId: 1, mediaType: "movie", kind: "impression", source: "feed" });
    flushSignals();
    expect(recordInteraction).toHaveBeenCalledTimes(1);
  });

  it("flushes immediately at the size cap", () => {
    for (let i = 1; i <= FLUSH_AT; i++) {
      queueSignal({ tmdbId: i, mediaType: "movie", kind: "impression", source: "feed" });
    }
    expect(recordInteraction).toHaveBeenCalledTimes(FLUSH_AT);
  });

  it("keeps impression and clicked for one title distinct", () => {
    queueSignal({ tmdbId: 1, mediaType: "movie", kind: "impression", source: "feed" });
    queueSignal({ tmdbId: 1, mediaType: "movie", kind: "clicked", source: "feed" });
    flushSignals();
    expect(recordInteraction).toHaveBeenCalledTimes(2);
  });
});
