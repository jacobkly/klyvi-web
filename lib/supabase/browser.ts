"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { env, supabaseConfigured } from "@/lib/env";

let cached: SupabaseClient | null = null;

/**
 * Browser Supabase client, lazily created and cached. Returns null when env
 * vars are not set so callers can degrade gracefully.
 */
export function getBrowserSupabase(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  if (cached) return cached;
  cached = createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
  return cached;
}

/** The current access token (JWT) from the browser session, or null. */
export async function getBrowserAccessToken(): Promise<string | null> {
  const sb = getBrowserSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.access_token ?? null;
}
