/** Protected notification endpoints, created by the nightly job on the API. */

import type { NotificationPage } from "@/lib/types";

import { browserFetch } from "./http";
import { mapNotificationPage } from "./map";
import type { WireNotificationPage } from "./wire";

export async function getNotifications(opts?: {
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
}): Promise<NotificationPage> {
  const params = new URLSearchParams();
  if (opts?.limit !== undefined) params.set("limit", String(opts.limit));
  if (opts?.offset !== undefined) params.set("offset", String(opts.offset));
  const qs = params.toString();
  const w = await browserFetch<WireNotificationPage>(
    `/v1/notifications${qs ? `?${qs}` : ""}`,
    { signal: opts?.signal }
  );
  return mapNotificationPage(w);
}

/** Marks every notice read and returns what is still unread (normally 0). */
export async function markAllNotificationsRead(): Promise<number> {
  const w = await browserFetch<{ unread_count: number }>(
    "/v1/notifications/read",
    { method: "POST", body: { all: true } }
  );
  return w.unread_count;
}
