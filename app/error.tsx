'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production, send to error tracker here.

    console.error(error);
  }, [error]);

  return (
    <main id="main" className="grid min-h-dvh place-items-center px-4">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="mb-6 grid size-16 place-items-center rounded-full bg-card border border-white/[0.06]">
          <AlertTriangle className="size-7 text-destructive" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">
          {error.message || 'An unexpected error occurred while rendering this page.'}
        </p>
        <Button onClick={reset} className="mt-8">
          <RotateCw className="size-4" strokeWidth={1.5} />
          Try again
        </Button>
      </div>
    </main>
  );
}
