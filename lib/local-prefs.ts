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

export function writePref<K extends keyof Prefs>(
  key: K,
  value: Prefs[K]
): void {
  try {
    const next = { ...readAll(), [key]: value };
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Quota or privacy mode: the control still works for the session
    // through the event below, it just will not survive a reload.
  }
  window.dispatchEvent(new Event(EVENT));
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
