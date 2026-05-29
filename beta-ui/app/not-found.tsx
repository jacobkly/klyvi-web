import Link from 'next/link';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main id="main" className="relative grid min-h-dvh place-items-center px-4">
      {/* Ambient glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl" />
      </div>

      <div className="flex flex-col items-center text-center max-w-md">
        <div className="mb-6 grid size-16 place-items-center rounded-full bg-card border border-white/[0.06]">
          <Compass className="size-7 text-accent" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Lost in the catalog
        </h1>
        <p className="mt-2 text-muted-foreground">
          We couldn&apos;t find what you were looking for. It may have been removed or never existed.
        </p>
        <Button asChild className="mt-8">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </main>
  );
}
