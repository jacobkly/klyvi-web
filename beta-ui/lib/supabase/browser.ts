'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { env, supabaseConfigured } from '@/lib/env';

let cached: SupabaseClient | null = null;

/**
 * Browser Supabase client. Lazily created and cached. Returns null when env
 * vars aren't set so the caller can degrade gracefully.
 */
export function getBrowserSupabase(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  if (cached) return cached;
  cached = createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
  return cached;
}
