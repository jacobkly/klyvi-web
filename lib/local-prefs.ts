"use client";

import * as React from "react";

import type { ScoringSystem } from "@/lib/score";
import { PREFS_STORAGE_KEY, type ThemeSettings } from "@/lib/theme";
import type { FeedMedia } from "@/lib/types";

/**
 * The settings panes' preferences. One JSON blob under one key, typed keys,
 * defaults in one place, and a change event so every subscribed control
 * stays live. It is the local copy of the account's settings: seeded from
 * the server on sign-in, and each change is pushed back (debounced), so a
 * second browser gets the same choices.
 */

/** Explore's genre, decade and sort, kept between visits. */
export type ExploreFilters = { genre: string; decade: string; sort: string };

export type Prefs = ThemeSettings & {
  scoringSystem: ScoringSystem;
  listOrder: "updated" | "title" | "score" | "added";
  combineLists: boolean;
  /** Library layout the user last chose; remembered so it does not reset. */
  libraryView: "grid" | "list" | "compact";
  /** Films, TV or both in Find, the last choice, kept the same way. */
  findMedia: FeedMedia;
  exploreFilters: ExploreFilters;
  /** Has swiped between picks, so Find stops saying it can be done. */
  swipedPicks: boolean;
  /** Which tracking updates create activity feed entries, keyed by status. */
  activityFeed: Record<string, boolean>;
};

export const DEFAULT_PREFS: Prefs = {
  themeMode: "dark",
  themeAccent: "violet",
  textSize: "default",
  reduceMotion: false,
  scoringSystem: "hundred",
  // Score first: the best of what you have watched at the top, the order a
  // taste library wants and the one the library used before this setting.
  listOrder: "score",
  combineLists: true,
  libraryView: "grid",
  findMedia: "all",
  exploreFilters: { genre: "all", decade: "all", sort: "relevance" },
  swipedPicks: false,
  activityFeed: {},
};

const KEY = PREFS_STORAGE_KEY;
const EVENT = "klyvi:prefs-changed";

// Snapshot cache keyed by the raw string, so useSyncExternalStore gets a
// stable object identity between writes instead of a fresh parse per read.
let cachedRaw: string | null | undefined;
let cachedBlob: Partial<Prefs> = {};

function readAll(): Partial<Prefs> {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return {};
  }
  if (raw === cachedRaw) return cachedBlob;
  cachedRaw = raw;
  if (raw == null) {
    cachedBlob = {};
    return cachedBlob;
  }
  try {
    cachedBlob = JSON.parse(raw) as Partial<Prefs>;
  } catch {
    cachedBlob = {};
  }
  return cachedBlob;
}

export function readPref<K extends keyof Prefs>(key: K): Prefs[K] {
  const stored = readAll()[key];
  return (stored ?? DEFAULT_PREFS[key]) as Prefs[K];
}

/**
 * The whole blob, stored values over defaults. What we push to the server.
 * Only known keys, so a key retired since this browser last saved stops being
 * sent.
 */
export function readAllPrefs(): Prefs {
  const stored: Partial<Prefs> = readAll();
  const all: Prefs = { ...DEFAULT_PREFS };
  for (const key of Object.keys(DEFAULT_PREFS) as (keyof Prefs)[]) {
    if (stored[key] !== undefined) {
      (all as Record<keyof Prefs, unknown>)[key] = stored[key];
    }
  }
  return all;
}

// Server sync. Injected by the auth provider so this module stays free of
// an import cycle and works untouched in tests that never set it.
let pushFn: ((settings: Record<string, unknown>) => void) | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;

export function setPrefsPusher(
  fn: ((settings: Record<string, unknown>) => void) | null
): void {
  pushFn = fn;
}

function schedulePush(): void {
  if (!pushFn) return;
  if (pushTimer != null) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    pushFn?.(readAllPrefs());
  }, 800);
}

function writeBlob(next: Partial<Prefs>): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Quota or privacy mode: the control still works for the session
    // through the event below, it just will not survive a reload.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function writePref<K extends keyof Prefs>(
  key: K,
  value: Prefs[K]
): void {
  writeBlob({ ...readAll(), [key]: value });
  // User-initiated: mirror it to the server (debounced).
  schedulePush();
}

/**
 * Seed local prefs from the server's settings blob on sign-in. Only known
 * keys are adopted, and this does NOT push back (it is server truth
 * arriving, not a user change), so it cannot loop with schedulePush.
 */
export function seedPrefs(settings: Record<string, unknown>): void {
  const known = Object.keys(DEFAULT_PREFS) as (keyof Prefs)[];
  const merged: Partial<Prefs> = { ...readAll() };
  for (const k of known) {
    if (k in settings) {
      (merged as Record<string, unknown>)[k] = settings[k];
    }
  }
  writeBlob(merged);
}

function subscribe(listener: () => void): () => void {
  window.addEventListener(EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

/** Read-write hook for one preference, live across the app. */
export function usePref<K extends keyof Prefs>(
  key: K
): [Prefs[K], (value: Prefs[K]) => void] {
  const value = React.useSyncExternalStore(
    subscribe,
    () => readPref(key),
    () => DEFAULT_PREFS[key]
  );
  const set = React.useCallback(
    (v: Prefs[K]) => writePref(key, v),
    [key]
  );
  return [value, set];
}
