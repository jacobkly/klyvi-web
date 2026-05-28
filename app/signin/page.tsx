'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <main id="main" className="relative grid min-h-dvh place-items-center px-4">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/3 top-1/3 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/25 blur-3xl motion-safe:animate-drift-1" />
        <div className="absolute right-1/3 bottom-1/3 size-[420px] translate-x-1/2 translate-y-1/2 rounded-full bg-accent/15 blur-3xl motion-safe:animate-drift-2" />
      </div>

      <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-card/60 backdrop-blur-xl p-8 shadow-glow">
        <Link href="/" className="text-2xl font-semibold tracking-tight">Klyvi</Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          {sent ? 'Check your inbox' : 'Sign in to Klyvi'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {sent
            ? 'We sent a magic link. It expires in 15 minutes.'
            : 'We’ll email you a one‑tap link. No password to remember.'}
        </p>

        {!sent ? (
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (email.trim()) setSent(true);
            }}
          >
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
              />
            </div>
            <Button type="submit" className="w-full">
              <Mail className="size-4" strokeWidth={1.5} />
              Continue
              <ArrowRight className="size-4 ml-auto" strokeWidth={1.5} />
            </Button>
          </form>
        ) : (
          <div className="mt-6 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success-foreground/90 flex items-start gap-3">
            <Check className="size-4 mt-0.5 text-success" strokeWidth={2} />
            <div>
              <div className="font-medium">Magic link sent to {email}</div>
              <div className="text-muted-foreground mt-0.5">Open the email and tap the button.</div>
            </div>
          </div>
        )}

        <p className="mt-8 text-xs text-muted-foreground text-center">
          By continuing, you agree to Klyvi&apos;s Terms and Privacy Policy.
        </p>
      </div>
    </main>
  );
}
