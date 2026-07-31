"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import type { User } from "@supabase/supabase-js";

import { getBrowserSupabase } from "@/lib/supabase/browser";

type SessionState = {
  /** The Supabase auth user, null when signed out (or still resolving). */
  user: User | null;
  /** True until the first getSession resolves; gates flicker, not routing. */
  loading: boolean;
  signOut: () => Promise<void>;
};

const SessionContext = React.createContext<SessionState>({
  user: null,
  loading: true,
  signOut: async () => {},
});

/**
 * Owns the browser auth state. Mounted once in the root layout so both the
 * app shell and the auth screens can read it. Routing decisions live in
 * proxy.ts; this context only answers "who is signed in right now".
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const sb = getBrowserSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    sb.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = React.useCallback(async () => {
    const sb = getBrowserSupabase();
    if (!sb) return;
    await sb.auth.signOut();
    // The proxy sees the cleared cookie on the next navigation; go somewhere
    // public so the user does not land on a redirect.
    router.push("/");
    router.refresh();
  }, [router]);

  const value = React.useMemo(
    () => ({ user, loading, signOut }),
    [user, loading, signOut]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionState {
  return React.useContext(SessionContext);
}
