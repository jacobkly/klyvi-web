'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  AlertTriangle,
  LogOut,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getBrowserSupabase } from '@/lib/supabase/browser';
import { supabaseConfigured } from '@/lib/env';
import { useSupabaseUser } from '@/lib/hooks/use-supabase-user';

type Mode = 'signin' | 'signup';

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/';

  const { user, loading } = useSupabaseUser();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(next);
    }
  }, [loading, user, next, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sb = getBrowserSupabase();
    if (!sb) {
      toast.error('Supabase is not configured.');
      return;
    }
    const cleanEmail = email.trim();
    if (!cleanEmail) return;
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error } = await sb.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) {
          toast.error(error.message || 'Sign-in failed.');
          return;
        }
      } else {
        if (password.length < 8) {
          toast.error('Password must be at least 8 characters.');
          return;
        }
        const { data, error } = await sb.auth.signUp({
          email: cleanEmail,
          password,
        });
        if (error) {
          toast.error(error.message || 'Sign-up failed.');
          return;
        }
        if (!data.session) {
          toast.error(
            'Account created but no session was returned. Turn off "Confirm email" in Supabase → Auth → Providers → Email.'
          );
          return;
        }
      }
      // useSupabaseUser picks up the new session and the redirect effect fires.
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
            Add <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
            <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your env file, then restart the dev server.
          </div>
        </div>
      </div>
    );
  }

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

  const heading = mode === 'signin' ? 'Sign in' : 'Create your account';
  const subheading =
    mode === 'signin' ? 'Welcome back.' : 'It takes about 30 seconds.';
  const submitLabel = mode === 'signin' ? 'Sign in' : 'Create account';

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight">{heading}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subheading}</p>
      </div>

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

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? 'text' : 'password'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === 'signup' ? 8 : undefined}
              disabled={busy}
              className="pr-10"
            />
            <button
              type="button"
              aria-label={showPw ? 'Hide password' : 'Show password'}
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-grid place-items-center size-7 rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              tabIndex={-1}
            >
              {showPw ? (
                <EyeOff className="size-4" strokeWidth={1.5} />
              ) : (
                <Eye className="size-4" strokeWidth={1.5} />
              )}
            </button>
          </div>
          {mode === 'signup' && (
            <p className="text-xs text-muted-foreground">Use at least 8 characters.</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={busy}>
          <Lock className="size-4" strokeWidth={1.5} />
          {busy ? 'Working…' : submitLabel}
          <ArrowRight className="size-4 ml-auto" strokeWidth={1.5} />
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        {mode === 'signin' ? (
          <>
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => setMode('signup')}
              className="text-foreground hover:text-accent font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => setMode('signin')}
              className="text-foreground hover:text-accent font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
            >
              Sign in
            </button>
          </>
        )}
      </div>
    </>
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

        <div className="mt-6">
          <Suspense fallback={<div className="h-32" aria-busy />}>
            <AuthForm />
          </Suspense>
        </div>

        <p className="mt-8 text-xs text-muted-foreground text-center">
          By continuing, you agree to Klyvi&apos;s Terms and Privacy Policy.
        </p>
      </div>
    </main>
  );
}
