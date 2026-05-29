/**
 * Thin fetch wrapper for the Klyvi Go API.
 *
 * Responsibilities:
 *  - Attach the Supabase JWT for protected routes.
 *  - Unwrap the `{ version, stats, data }` success envelope so callers get the
 *    payload directly.
 *  - Normalize errors into a single `ApiError` shape with status code.
 *  - Provide a clean entry point on both server and browser via `apiFetch`.
 *
 * The browser variant resolves the JWT lazily from the Supabase client. The
 * server variant accepts an explicit token (read from cookies in callers).
 */

import { env } from '@/lib/env';
import type { ErrorEnvelope, SuccessEnvelope } from './types';

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** JWT to attach as `Authorization: Bearer ...`. */
  token?: string | null;
  /** When true, returns `null` on 404 instead of throwing. */
  allow404?: boolean;
  /** When true, skips the envelope unwrap (raw passthrough endpoints). */
  raw?: boolean;
  /** Cache hint for Next.js. */
  next?: { revalidate?: number | false; tags?: string[] };
  /** Optional AbortSignal. */
  signal?: AbortSignal;
}

function joinUrl(base: string, path: string): string {
  const trimmedBase = base.replace(/\/$/, '');
  const trimmedPath = path.startsWith('/') ? path : `/${path}`;
  return `${trimmedBase}${trimmedPath}`;
}

export async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const { token, body, allow404, raw, next, signal, headers, method = 'GET', ...rest } = opts;

  if (!env.apiUrl) {
    throw new ApiError('Klyvi API URL is not configured', 0, null);
  }

  const init: RequestInit = {
    method,
    headers: {
      'Accept': 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers as Record<string, string> | undefined),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
    cache: next ? undefined : 'no-store',
    ...(next ? ({ next } as RequestInit) : {}),
    ...rest,
  };

  let res: Response;
  try {
    res = await fetch(joinUrl(env.apiUrl, path), init);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Network error';
    throw new ApiError(`Network error: ${msg}`, 0, null);
  }

  if (res.status === 404 && allow404) {
    return null as T;
  }

  // No-content endpoints (e.g., 204).
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
    const err = parsed as ErrorEnvelope | null;
    const msg = err && typeof err === 'object' && 'error' in err && typeof err.error === 'string'
      ? err.error
      : `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, parsed);
  }

  if (raw) return parsed as T;

  // Unwrap the standard success envelope.
  if (parsed && typeof parsed === 'object' && 'data' in (parsed as object)) {
    return (parsed as SuccessEnvelope<T>).data;
  }
  return parsed as T;
}
