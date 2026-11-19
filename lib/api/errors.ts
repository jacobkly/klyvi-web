/**
 * Sends client errors to the API (POST /v1/errors), where they're grouped
 * and kept 30 days for the admin page.
 *
 * Deliberately not built on apiFetch: a failing apiFetch reports through
 * here, and reporting must never fail in a way that reports again. Every
 * failure in this file is swallowed.
 */

import { env } from "@/lib/env";
import { getBrowserAccessToken } from "@/lib/supabase/browser";

import type { WireErrorReport } from "./wire";

/** The API's body cap for POST /v1/errors. */
export const REPORT_BODY_LIMIT = 4 * 1024;

/** A crash loop on one page shouldn't send more than this. */
const MAX_REPORTS_PER_PAGE_LOAD = 5;
const MAX_MESSAGE = 1000;
const MAX_STACK = 2500;

const sentKeys = new Set<string>();

/** Clears the dedupe and the cap. Tests only. */
export function resetErrorReports() {
  sentKeys.clear();
}

/**
 * Replaces path segments that start with a digit, so /movie/550-fight-club
 * and /movie/27205-inception are one page and one bug is one group. Drops
 * any query string, which can hold search terms.
 */
function withoutIds(text: string): string {
  return text.replace(/[?#]\S*/g, "").replace(/\/\d[^/?#\s]*/g, "/:id");
}

function cut(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) : s;
}

/** Shrinks the stack, then the message, until the JSON fits the cap. */
function fit(report: WireErrorReport): string {
  const encoder = new TextEncoder();
  let body = JSON.stringify(report);
  while (encoder.encode(body).length > REPORT_BODY_LIMIT) {
    if (report.stack) {
      const half = Math.floor(report.stack.length / 2);
      report.stack = half > 0 ? report.stack.slice(0, half) : undefined;
    } else {
      report.message = report.message.slice(
        0,
        Math.floor(report.message.length / 2)
      );
    }
    body = JSON.stringify(report);
  }
  return body;
}

async function send(report: WireErrorReport): Promise<void> {
  try {
    if (typeof window === "undefined" || !env.apiUrl) return;
    const key = `${report.kind}|${report.message}|${report.digest ?? ""}`;
    if (sentKeys.has(key) || sentKeys.size >= MAX_REPORTS_PER_PAGE_LOAD) {
      return;
    }
    sentKeys.add(key);

    let token: string | null = null;
    try {
      token = await getBrowserAccessToken();
    } catch {
      // Signed-out reports are still worth having.
    }

    await fetch(`${env.apiUrl.replace(/\/$/, "")}/v1/errors`, {
      method: "POST",
      keepalive: true,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: fit(report),
    });
  } catch {
    // Nowhere left to report to.
  }
}

/** Reports a crash an error boundary caught, or anything else thrown. */
export async function reportError(
  error: unknown,
  digest?: string
): Promise<void> {
  try {
    const e = error instanceof Error ? error : null;
    const message = cut(
      (e ? e.message : String(error ?? "")).trim() || "Unknown error",
      MAX_MESSAGE
    );
    const report: WireErrorReport = {
      kind: e?.name || "Error",
      message,
      ...(e?.stack ? { stack: cut(e.stack, MAX_STACK) } : {}),
      page: withoutIds(window.location.pathname),
      ...(digest ? { digest } : {}),
    };
    await send(report);
  } catch {
    // Reporting never throws.
  }
}

/**
 * Reports an API call that failed before the API could record it itself:
 * the network dropped, the call timed out, or something in front of the API
 * answered 5xx. No stack, so the page and message decide the group.
 */
export async function reportApiFailure(
  kind: string,
  message: string
): Promise<void> {
  try {
    await send({
      kind,
      message: cut(withoutIds(message), MAX_MESSAGE),
      page: withoutIds(window.location.pathname),
    });
  } catch {
    // Reporting never throws.
  }
}
