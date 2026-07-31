"use client";

import { Button } from "@/components/ui/button";

/**
 * Root error boundary: a thrown render or fetch error lands here instead of
 * a blank screen. Copy per 06-copy.md, and reset() retries the render.
 */
export default function ErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-full flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-[15px] font-semibold text-foreground">
        Something broke on this page.
      </p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Something went wrong on Klyvi&apos;s end. Your library and ratings are
        safe.
      </p>
      <Button className="mt-5" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
