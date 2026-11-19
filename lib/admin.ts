/** URL state and formatting for the admin error page. */

import type { ErrorGroupStatus } from "@/lib/types";

export type AdminParams = {
  status: ErrorGroupStatus;
  offset: number;
  /** The group shown open, if any. */
  openId: number | null;
};

const STATUSES: ErrorGroupStatus[] = ["open", "resolved", "all"];

/** The page size the API uses by default. */
export const ADMIN_PAGE_SIZE = 50;

type Raw = string | string[] | undefined;

function wholeNumber(v: Raw): number | null {
  if (typeof v !== "string" || !/^\d+$/.test(v)) return null;
  return Number(v);
}

/** Reads the page's query. Anything odd falls back to the default. */
export function readAdminParams(p: {
  status?: Raw;
  offset?: Raw;
  id?: Raw;
}): AdminParams {
  const status = STATUSES.find((s) => s === p.status) ?? "open";
  return {
    status,
    offset: wholeNumber(p.offset) ?? 0,
    openId: wholeNumber(p.id),
  };
}

/** The page's address for a state, defaults left out. */
export function adminHref(p: AdminParams): string {
  const q = new URLSearchParams();
  if (p.status !== "open") q.set("status", p.status);
  if (p.offset > 0) q.set("offset", String(p.offset));
  if (p.openId !== null) q.set("id", String(p.openId));
  const qs = q.toString();
  return qs ? `/admin?${qs}` : "/admin";
}

/** "10 min ago", "3 h ago", "yesterday". Empty for a bad date. */
export function ago(iso: string, now: number): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const min = Math.floor((now - t) / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.floor(h / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}
