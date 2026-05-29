'use client';

import * as React from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getBrowserSupabase } from '@/lib/supabase/browser';

interface AuthState {
  user: User | null;
  session: Session | null;
  /** True while the initial session is being resolved. */
  loading: boolean;
  /** True when Supabase is not configured (env missing). */
  unavailable: boolean;
}

/**
 * Subscribe to the Supabase session in a Client Component. Returns the
 * current user + access token. Updates on sign-in / sign-out / token refresh.
 */
export function useSupabaseUser(): AuthState {
  const [state, setState] = React.useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    unavailable: false,
  });

  React.useEffect(() => {
    const sb = getBrowserSupabase();
    if (!sb) {
      setState({ user: null, session: null, loading: false, unavailable: true });
      return;
    }

    let mounted = true;

    sb.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setState({
        user: data.session?.user ?? null,
        session: data.session,
        loading: false,
        unavailable: false,
      });
    });

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        unavailable: false,
      });
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

/** Convenience: just the access token, or null. */
export function useAccessToken(): string | null {
  const { session } = useSupabaseUser();
  return session?.access_token ?? null;
}
