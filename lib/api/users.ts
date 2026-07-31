/** Protected user profile endpoints. */

import type { UserProfile } from "@/lib/types";

import { apiFetch, browserFetch } from "./http";
import { mapUser } from "./map";
import type { WireUser, WireUsernameAvailability } from "./wire";

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

export async function updateMe(patch: {
  username?: string;
  bio?: string;
  avatarUrl?: string;
}): Promise<UserProfile> {
  const w = await browserFetch<WireUser>("/v1/users/me", {
    method: "PATCH",
    body: {
      username: patch.username,
      bio: patch.bio,
      avatar_url: patch.avatarUrl,
    },
  });
  return mapUser(w);
}
