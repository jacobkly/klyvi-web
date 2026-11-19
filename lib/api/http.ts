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

import { reportApiFailure } from "./errors";

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
  /** How long to wait before giving up. Uploads pass a longer one. */
  timeoutMs?: number;
}

/**
 * How long a request may take before the app stops waiting and shows its
 * error state. Without a limit, a hung API leaves a page loading forever.
 */
export const DEFAULT_TIMEOUT_MS = 8_000;

/** Uploads get the same minute the API gives them (middleware.LongRequest). */
export const UPLOAD_TIMEOUT_MS = 60_000;

const TIMEOUT_MESSAGE = "Klyvi took too long to answer. Try again.";

/**
 * A signal that aborts after ms, or when the caller's own signal does. A
 * plain timer (not AbortSignal.timeout) so tests can drive it with fake
 * timers.
 */
function timeoutSignal(ms: number, outer?: AbortSignal) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, ms);
  const onOuterAbort = () => controller.abort(outer?.reason);
  if (outer?.aborted) onOuterAbort();
  else outer?.addEventListener("abort", onOuterAbort, { once: true });
  return {
    signal: controller.signal,
    timedOut: () => timedOut,
    done: () => {
      clearTimeout(timer);
      outer?.removeEventListener("abort", onOuterAbort);
    },
  };
}

function isAbort(e: unknown): boolean {
  // Checked by name: the abort reason can come from a different realm's
  // DOMException (the test DOM, a worker), where instanceof fails.
  return (
    typeof e === "object" &&
    e !== null &&
    "name" in e &&
    (e as { name: unknown }).name === "AbortError"
  );
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
  // FormData carries its own multipart boundary: never stringify it and
  // never set Content-Type, or the boundary is lost and the upload fails.
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  // A public read may cache. The browser then follows the API's own
  // Cache-Control, and on the server Next keeps it for an hour, the API's
  // catalog max-age. Anything that carries a user's token, or writes,
  // always goes to the API.
  const caching: RequestInit =
    !token && (method === "GET" || method === "HEAD")
      ? { next: { revalidate: 3600 } }
      : { cache: "no-store" };
  const init: RequestInit = {
    method,
    headers: {
      Accept: "application/json",
      ...(body !== undefined && !isForm
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers as Record<string, string> | undefined),
    },
    body:
      body === undefined
        ? undefined
        : isForm
          ? (body as FormData)
          : JSON.stringify(body),
    signal,
    ...caching,
  };
  try {
    return await fetch(joinUrl(env.apiUrl, path), init);
  } catch (e) {
    if (isAbort(e)) throw e;
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

  const ms = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeout = timeoutSignal(ms, opts.signal);
  const call = `${opts.method ?? "GET"} ${path}`;
  try {
    return await fetchAndParse<T>(path, { ...opts, signal: timeout.signal });
  } catch (e) {
    // The API never saw these, so it can't have recorded them.
    if (timeout.timedOut()) {
      void reportApiFailure("Timeout", `${call}: no answer after ${ms} ms`);
      throw new ApiError(TIMEOUT_MESSAGE, 0, null);
    }
    if (e instanceof ApiError && e.status === 0) {
      void reportApiFailure("NetworkError", `${call}: ${e.message}`);
    }
    throw e;
  } finally {
    timeout.done();
  }
}

async function fetchAndParse<T>(path: string, opts: FetchOptions): Promise<T> {
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
    const fromApi =
      errBody &&
      typeof errBody === "object" &&
      typeof errBody.error === "string";
    // A 5xx without the API's { error } body came from something in front
    // of it (Cloudflare, the tunnel), so the API has no record of it.
    if (res.status >= 500 && !fromApi) {
      void reportApiFailure(
        `HTTP ${res.status}`,
        `${opts.method ?? "GET"} ${path}: answered ${res.status} without an API error body`
      );
    }
    const msg = fromApi
      ? (errBody.error as string)
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
