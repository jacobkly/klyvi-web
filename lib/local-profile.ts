"use client";

import * as React from "react";

/**
 * Device-local profile extras: avatar image and birthday. The API has no
 * avatar upload or birthday column yet, so these live in localStorage with
 * honest on-this-device copy, and every reader subscribes through one
 * event so the top bar updates the moment settings changes something.
 * When the backend ships, this file shrinks to a cache.
 */

const AVATAR_KEY = "klyvi:avatar";
const BIRTHDAY_KEY = "klyvi:birthday";
const EVENT = "klyvi:local-profile";

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export function validateAvatarFile(file: {
  type: string;
  size: number;
}): string | null {
  if (!file.type.startsWith("image/"))
    return "That file is not an image. PNG or JPG works.";
  if (file.size > AVATAR_MAX_BYTES) return "Images up to 2 MB work here.";
  return null;
}

/** Null when the date cannot be honored; the reason otherwise. */
export function validateBirthday(value: string): string | null {
  const t = Date.parse(value);
  if (Number.isNaN(t)) return "That is not a real date.";
  if (t > Date.now()) return "A birthday cannot be in the future.";
  if (t < Date.parse("1900-01-01")) return "That is too long ago.";
  return null;
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): boolean {
  try {
    if (value == null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Quota or privacy mode. The caller says so; silence would look broken.
    return false;
  }
  window.dispatchEvent(new Event(EVENT));
  return true;
}

export const readLocalAvatar = () => read(AVATAR_KEY);
export const writeLocalAvatar = (dataUrl: string | null) =>
  write(AVATAR_KEY, dataUrl);
export const readBirthday = () => read(BIRTHDAY_KEY);
export const writeBirthday = (iso: string | null) => write(BIRTHDAY_KEY, iso);

export function subscribeLocalProfile(listener: () => void): () => void {
  window.addEventListener(EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

/** The device-local avatar, live across tabs and settings saves. */
export function useLocalAvatar(): string | null {
  return React.useSyncExternalStore(
    subscribeLocalProfile,
    readLocalAvatar,
    () => null
  );
}
