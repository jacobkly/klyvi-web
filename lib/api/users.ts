/** Protected user profile endpoints. */

import { env } from "@/lib/env";
import { getBrowserAccessToken } from "@/lib/supabase/browser";
import type { UserProfile, UserStats } from "@/lib/types";

import { apiFetch, browserFetch } from "./http";
import { mapStats, mapUser } from "./map";
import type {
  WireStats,
  WireUser,
  WireUsernameAvailability,
} from "./wire";

/**
 * Public availability check, used while typing on sign-up (where there is
 * no session) and in settings. An unusable name is a 200 with
 * available=false, so only a transport failure throws.
 */
export async function checkUsernameAvailable(
  username: string,
  signal?: AbortSignal
): Promise<WireUsernameAvailability> {
  return apiFetch<WireUsernameAvailability>(
    `/v1/users/username-available?username=${encodeURIComponent(username)}`,
    { signal }
  );
}

export async function getMe(): Promise<UserProfile> {
  const w = await browserFetch<WireUser>("/v1/users/me");
  return mapUser(w);
}

/**
 * Partial profile update. Omitted keys are unchanged. `birthday` is
 * tri-state: omit to leave alone, null to clear, "YYYY-MM-DD" to set.
 * `settings` is a full replace of the opaque blob when present.
 */
export async function updateMe(patch: {
  username?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  birthday?: string | null;
  settings?: Record<string, unknown>;
}): Promise<UserProfile> {
  const body: Record<string, unknown> = {};
  if (patch.username !== undefined) body.username = patch.username;
  if (patch.bio !== undefined) body.bio = patch.bio;
  if (patch.avatarUrl !== undefined) body.avatar_url = patch.avatarUrl;
  if (patch.bannerUrl !== undefined) body.banner_url = patch.bannerUrl;
  if (patch.birthday !== undefined) body.birthday = patch.birthday;
  if (patch.settings !== undefined) body.settings = patch.settings;
  const w = await browserFetch<WireUser>("/v1/users/me", {
    method: "PATCH",
    body,
  });
  return mapUser(w);
}

/** Multipart avatar upload; returns the updated profile with the new URL. */
export async function uploadAvatar(file: File): Promise<UserProfile> {
  const form = new FormData();
  form.append("file", file);
  const w = await browserFetch<WireUser>("/v1/users/me/avatar", {
    method: "POST",
    body: form,
  });
  return mapUser(w);
}

export async function deleteAvatar(): Promise<UserProfile> {
  const w = await browserFetch<WireUser>("/v1/users/me/avatar", {
    method: "DELETE",
  });
  return mapUser(w);
}

export async function getMyStats(): Promise<UserStats> {
  const w = await browserFetch<WireStats>("/v1/users/me/stats");
  return mapStats(w);
}

/** Deletes the account server-side; the caller signs out on success. */
export async function deleteAccount(): Promise<void> {
  await browserFetch<void>("/v1/users/me", { method: "DELETE" });
}

/**
 * Triggers a browser download of an authenticated attachment. A plain
 * anchor cannot carry the JWT, so fetch as a blob and click a temporary
 * link. Filename comes from Content-Disposition, else the fallback.
 */
async function downloadAuthed(path: string, fallbackName: string): Promise<void> {
  const token = await getBrowserAccessToken();
  const res = await fetch(`${env.apiUrl.replace(/\/$/, "")}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const match = /filename="?([^"]+)"?/.exec(disposition);
  const name = match?.[1] ?? fallbackName;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Downloads the tracking list as a CSV or JSON attachment. */
export function exportTracking(format: "csv" | "json"): Promise<void> {
  return downloadAuthed(
    `/v1/users/me/export?format=${format}`,
    `klyvi-library.${format}`
  );
}

/** Downloads the full GDPR account bundle as JSON. */
export function downloadAccountData(): Promise<void> {
  return downloadAuthed("/v1/users/me/data", "klyvi-account.json");
}
