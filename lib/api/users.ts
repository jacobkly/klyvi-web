/** Protected user profile endpoints. */

import type { UserProfile } from "@/lib/types";

import { browserFetch } from "./http";
import { mapUser } from "./map";
import type { WireUser } from "./wire";

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
