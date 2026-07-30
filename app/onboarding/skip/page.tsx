import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Skip for now · Klyvi" };

/**
 * Names the cost of skipping without guilt. The secondary action is the one
 * worth taking and is phrased as the easier option; "Skip anyway" is right
 * there and it works (06-copy.md).
 */
export default function SkipPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Skip for now?</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Klyvi will show generic picks until you rate something. You can start
        rating any time from Find next.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/home"
          className={buttonVariants({ variant: "outline", size: "touch" })}
        >
          Skip anyway
        </Link>
        <Link
          href="/onboarding/rate"
          className={buttonVariants({ size: "touch" })}
        >
          Rate a few first
        </Link>
      </div>
    </main>
  );
}
