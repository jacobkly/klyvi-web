"use client";

import Link from "next/link";
import * as React from "react";

import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listInteractions } from "@/lib/api/interactions";

/**
 * Names the cost of skipping without guilt. The secondary action is the one
 * worth taking and is phrased as the easier option; "Skip anyway" is right
 * there and it works (06-copy.md).
 *
 * An account that already has ratings isn't skipping anything, so it hears
 * that instead (#14). A failed count falls back to the plain question.
 */
export function SkipChoice() {
  const [count, setCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    let live = true;
    listInteractions({ kind: "rated" })
      .then((rows) => {
        if (live) setCount(rows.length);
      })
      .catch(() => {
        if (live) setCount(0);
      });
    return () => {
      live = false;
    };
  }, []);

  if (count == null) {
    return (
      <div role="status" aria-label="Loading" className="flex flex-col items-center gap-3">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-lg" />
      </div>
    );
  }

  if (count > 0) {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-tight">
          You have rated {count} {count === 1 ? "title" : "titles"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          That is enough for Klyvi to go on. Rate more any time and the picks
          get sharper.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/onboarding/rate"
            className={buttonVariants({ variant: "outline", size: "touch" })}
          >
            Rate a few more
          </Link>
          <Link href="/home" className={buttonVariants({ size: "touch" })}>
            Go to home
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
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
        <Link href="/onboarding/rate" className={buttonVariants({ size: "touch" })}>
          Rate a few first
        </Link>
      </div>
    </>
  );
}
