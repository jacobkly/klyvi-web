"use client";

import { recordInteraction } from "@/lib/api/interactions";
import type { InteractionSource, MediaType } from "@/lib/types";

/**
 * Batcher for the passive recommender signals, impression and clicked.
 * They are worth sending (the cheapest route to Tier 2) but never worth a
 * request per card, so they queue and go out together: at ten, after five
 * seconds, or when the page hides. Failures are silent and never retried;
 * a lost impression costs nothing. The active signals (rated, saved,
 * logged, dismissed) do not come through here, they post immediately.
 *
 * The API takes one row per POST today; a batch endpoint is on the phase
 * 9 contract, and this queue is the client half of it either way.
 */

export type PassiveSignal = {
  tmdbId: number;
  mediaType: MediaType;
  kind: "impression" | "clicked";
  source: InteractionSource;
};

export const FLUSH_AT = 10;
export const FLUSH_AFTER_MS = 5_000;

let queue: PassiveSignal[] = [];
/** Session-lived: a card seen twice is still one impression. */
let sent = new Set<string>();
let timer: ReturnType<typeof setTimeout> | null = null;
let listenersReady = false;

function ensureListeners() {
  if (listenersReady || typeof window === "undefined") return;
  listenersReady = true;
  // pagehide over beforeunload: it also covers bfcache navigations, and
  // the flush is fetch-based best effort since a Bearer token cannot ride
  // a sendBeacon.
  window.addEventListener("pagehide", flushSignals);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushSignals();
  });
}

export function queueSignal(signal: PassiveSignal): void {
  const key = `${signal.kind}:${signal.mediaType}:${signal.tmdbId}`;
  if (sent.has(key)) return;
  sent.add(key);
  ensureListeners();
  queue.push(signal);
  if (queue.length >= FLUSH_AT) {
    flushSignals();
    return;
  }
  if (timer == null) {
    timer = setTimeout(flushSignals, FLUSH_AFTER_MS);
  }
}

export function flushSignals(): void {
  if (timer != null) {
    clearTimeout(timer);
    timer = null;
  }
  const batch = queue;
  queue = [];
  for (const s of batch) {
    recordInteraction({
      tmdbId: s.tmdbId,
      mediaType: s.mediaType,
      kind: s.kind,
      source: s.source,
    }).catch(() => {});
  }
}

/** Test hook: clears queue, dedupe memory, and the timer. */
export function resetSignalsForTests(): void {
  queue = [];
  sent = new Set();
  if (timer != null) {
    clearTimeout(timer);
    timer = null;
  }
}
