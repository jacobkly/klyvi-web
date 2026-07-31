/**
 * Fetch core for the Klyvi Go API (ported from beta-ui and extended).
 *
 * Responsibilities:
 * - Attach the Supabase JWT for protected routes.
 * - Unwrap the { version, stats, data } success envelope.
 * - Normalize errors into ApiError with a status code.
 * - Retry exactly once on 401 via an optional refresh hook, so an expired
 *   token mid-session heals instead of erroring.
 *
 * Domain modules build on apiFetch (explicit token, server-friendly) or
 * browserFetch (token resolved lazily from the Supabase client).
 */

import { env } from "@/lib/env";
import {
  getBrowserAccessToken,
  getBrowserSupabase,
} from "@/lib/supabase/browser";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

interface SuccessEnvelope<T> {
  version: string;
  stats: unknown;
  data: T;
}

export interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** JWT to attach as Authorization: Bearer. */
  token?: string | null;
  /** Called once after a 401; return a fresh token to retry with, or null. */
  refreshToken?: () => Promise<string | null>;
  /** When true, returns null on 404 instead of throwing. */
  allow404?: boolean;
  /** When true, skips the envelope unwrap (raw passthrough payloads). */
  raw?: boolean;
  signal?: AbortSignal;
}

function joinUrl(base: string, path: string): string {
  const trimmedBase = base.replace(/\/$/, "");
  const trimmedPath = path.startsWith("/") ? path : `/${path}`;
  return `${trimmedBase}${trimmedPath}`;
}

async function doFetch(
  path: string,
  opts: FetchOptions,
  token: string | null | undefined
): Promise<Response> {
  const { body, signal, headers, method = "GET" } = opts;
  const init: RequestInit = {
    method,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers as Record<string, string> | undefined),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
    cache: "no-store",
  };
  try {
    return await fetch(joinUrl(env.apiUrl, path), init);
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    const msg = e instanceof Error ? e.message : "Network error";
    throw new ApiError(`Network error: ${msg}`, 0, null);
  }
}

export async function apiFetch<T>(
  path: string,
  opts: FetchOptions = {}
): Promise<T> {
  if (!env.apiUrl) {
    throw new ApiError("Klyvi API URL is not configured", 0, null);
  }

  let res = await doFetch(path, opts, opts.token);

  // One refresh-and-retry on 401: the session likely expired mid-flight.
  if (res.status === 401 && opts.refreshToken) {
    const fresh = await opts.refreshToken();
    if (fresh) {
      res = await doFetch(path, opts, fresh);
    }
  }

  if (res.status === 404 && opts.allow404) {
    return null as T;
  }
  if (res.status === 204) {
    return undefined as T;
  }

  let parsed: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    const errBody = parsed as { error?: unknown } | null;
    const msg =
      errBody &&
      typeof errBody === "object" &&
      typeof errBody.error === "string"
        ? errBody.error
        : `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, parsed);
  }

  if (opts.raw) return parsed as T;

  if (parsed && typeof parsed === "object" && "data" in (parsed as object)) {
    return (parsed as SuccessEnvelope<T>).data;
  }
  return parsed as T;
}

/**
 * Browser-side fetch: resolves the JWT lazily from the Supabase client and
 * wires the 401 refresh hook. Public endpoints work signed out (no token,
 * no header).
 */
export async function browserFetch<T>(
  path: string,
  opts: Omit<FetchOptions, "token" | "refreshToken"> = {}
): Promise<T> {
  const token = await getBrowserAccessToken();
  return apiFetch<T>(path, {
    ...opts,
    token,
    refreshToken: async () => {
      const sb = getBrowserSupabase();
      if (!sb) return null;
      const { data } = await sb.auth.refreshSession();
      return data.session?.access_token ?? null;
    },
  });
}
