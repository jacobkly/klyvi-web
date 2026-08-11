"use client";

import Link from "next/link";
import * as React from "react";

import { ImportFlow } from "@/components/imports/import-flow";
import { buttonVariants } from "@/components/ui/button";
import type { ImportJob } from "@/lib/types";

/**
 * The onboarding import path: the same flow the settings dialog uses, framed
 * as a cold-start step. When it finishes, the matched titles have already
 * landed as rated signal, so the door to recommendations opens; until then,
 * rating films by hand stays one tap away.
 */
export function ImportStep() {
  const [done, setDone] = React.useState<ImportJob | null>(null);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">
        Import your history
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Klyvi reads a Letterboxd or Trakt export and matches it against the
        catalog. Nothing is posted anywhere, and nothing is shared.
      </p>

      <div className="mt-6">
        <ImportFlow onDone={(j) => setDone(j)} />
      </div>

      {done ? (
        <Link
          href={`/onboarding/done?rated=${done.matched}`}
          className={buttonVariants({ size: "touch" }) + " mt-6"}
        >
          See your recommendations
        </Link>
      ) : (
        <div className="mt-6 flex gap-3">
          <Link
            href="/onboarding/rate"
            className={buttonVariants({ variant: "ghost", size: "touch" })}
          >
            Rate films instead
          </Link>
          <Link
            href="/onboarding"
            className={buttonVariants({ variant: "ghost", size: "touch" })}
          >
            Back
          </Link>
        </div>
      )}
    </main>
  );
}
