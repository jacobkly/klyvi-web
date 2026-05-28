'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, ArrowRight, Check, AlertTriangle, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getBrowserSupabase } from '@/lib/supabase/browser';
import { supabaseConfigured } from '@/lib/env';
import { useSupabaseUser } from '@/lib/hooks/use-supabase-user';

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/';

  const { user, loading } = useSupabaseUser();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  // Redirect away if already signed in.
  useEffect(() => {
    if (!loading && user) {
      router.replace(next);
    }
  }, [loading, user, next, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sb = getBrowserSupabase();
    if (!sb) {
      toast.error('Supabase is not configured. Add env vars to enable sign-in.');
      return;
    }
    if (!email.trim()) return;
    setBusy(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error } = await sb.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      });
      if (error) {
        toast.error(error.message || 'Failed to send magic link.');
        return;
      }
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    const sb = getBrowserSupabase();
    if (!sb) return;
    await sb.auth.signOut();
    toast('Signed out.');
  }

  if (!supabaseConfigured) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm flex items-start gap-3">
        <AlertTriangle className="size-4 mt-0.5 text-destructive" strokeWidth={2} />
        <div>
          <div className="font-medium">Supabase isn&apos;t configured</div>
          <div className="text-muted-foreground mt-1">
            Add <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and
            <code className="font-mono text-xs"> NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code className="font-mono text-xs">.env.local</code>, then restart the dev server.
          </div>
        </div>
      </div>
    );
  }

  // Already signed in — let them sign out or continue.
  if (!loading && user) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg hairline bg-card/40 p-4 text-sm">
          <div className="text-muted-foreground">Signed in as</div>
          <div className="mt-1 font-medium">{user.email}</div>
        </div>
        <div className="flex gap-2">
          <Button asChild className="flex-1">
            <Link href={next}>Continue</Link>
          </Button>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="size-4" strokeWidth={1.5} />
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-sm flex items-start gap-3">
          <Check className="size-4 mt-0.5 text-success" strokeWidth={2} />
          <div>
            <div className="font-medium">Magic link sent to {email}</div>
            <div className="text-muted-foreground mt-0.5">Open the email and tap the button to sign in.</div>
          </div>
        </div>
        <Button variant="ghost" onClick={() => setSent(false)} className="text-muted-foreground">
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={busy}
        />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        <Mail className="size-4" strokeWidth={1.5} />
        {busy ? 'Sending…' : 'Continue'}
        <ArrowRight className="size-4 ml-auto" strokeWidth={1.5} />
      </Button>
    </form>
  );
}

export default function SignInPage() {
  return (
    <main id="main" className="relative grid min-h-dvh place-items-center px-4">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/3 top-1/3 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/25 blur-3xl motion-safe:animate-drift-1" />
        <div className="absolute right-1/3 bottom-1/3 size-[420px] translate-x-1/2 translate-y-1/2 rounded-full bg-accent/15 blur-3xl motion-safe:animate-drift-2" />
      </div>

      <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-card/60 backdrop-blur-xl p-8 shadow-glow">
        <Link href="/" className="text-2xl font-semibold tracking-tight">
          Klyvi
        </Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Sign in to Klyvi</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ll email you a one-tap link. No password to remember.
        </p>

        <div className="mt-6">
          <Suspense fallback={<div className="h-32" aria-busy />}>
            <SignInForm />
          </Suspense>
        </div>

        <p className="mt-8 text-xs text-muted-foreground text-center">
          By continuing, you agree to Klyvi&apos;s Terms and Privacy Policy.
        </p>
      </div>
    </main>
  );
}
