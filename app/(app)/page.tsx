import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="px-4 md:px-8 py-16">
      <div className="max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-card px-3 py-1 text-xs uppercase tracking-wider text-accent">
          <Sparkles className="size-3" strokeWidth={1.5} /> Beta
        </div>
        <h1 className="mt-6 text-4xl md:text-6xl font-semibold tracking-tight">
          Find what to watch next, without the decision fatigue.
        </h1>
        <p className="mt-4 text-muted-foreground text-balance">
          Klyvi learns your taste from a single rating and gets sharper the more you log.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/onboarding/rate">Get started <ArrowRight className="size-4" strokeWidth={1.5} /></Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/media/496243">Try the demo</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
