"use client";

import * as React from "react";

/**
 * Device-local preferences behind the settings panes that have no backend
 * persistence yet. One JSON blob under one key, typed keys, defaults in
 * one place, and a change event so every subscribed control stays live.
 * When the settings endpoints ship, this becomes the optimistic cache.
 */

export type Prefs = {
  themeMode: "dark" | "light";
  themeAccent: "violet" | "blue" | "green" | "orange" | "pink" | "red";
  textSize: "compact" | "default" | "large";
  reduceMotion: boolean;
  scoringSystem: "hundred" | "ten" | "stars" | "smiley";
  listOrder: "updated" | "title" | "score" | "added";
  combineLists: boolean;
  /** Which tracking updates create activity feed entries, keyed by status. */
  activityFeed: Record<string, boolean>;
  /** In-app notification switches, keyed by id. */
  notifications: Record<string, boolean>;
  /** Email opt-ins, keyed by id. */
  emails: Record<string, boolean>;
};

export const DEFAULT_PREFS: Prefs = {
  themeMode: "dark",
  themeAccent: "violet",
  textSize: "default",
  reduceMotion: false,
  scoringSystem: "hundred",
  listOrder: "updated",
  combineLists: true,
  activityFeed: {},
  notifications: {},
  emails: {},
};

const KEY = "klyvi:prefs";
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

/** The whole blob, stored values over defaults. What we push to the server. */
export function readAllPrefs(): Prefs {
  return { ...DEFAULT_PREFS, ...readAll() };
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
