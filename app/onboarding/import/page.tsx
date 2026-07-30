import Link from "next/link";
import { Upload } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Import your history · Klyvi" };

/**
 * Import entry. The backend has no import endpoint yet, so this is the honest
 * placeholder: the layout and copy are real, the dropzone activates when the
 * API ships. Path A stays one tap away.
 */
export default function ImportPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">
        Import your history
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Klyvi reads a Letterboxd or Trakt export and matches it against the
        catalog. Nothing is posted anywhere, and nothing is shared.
      </p>

      <div className="mt-6 flex flex-col items-center rounded-lg border border-dashed border-border bg-card/50 px-6 py-10 text-center">
        <Upload
          aria-hidden="true"
          className="size-5 text-muted-foreground"
          strokeWidth={2}
        />
        <p className="mt-3 text-sm font-medium text-foreground">
          Import is not ready yet
        </p>
        <p className="mt-1 max-w-[34ch] text-sm text-muted-foreground">
          This lands in a coming update. Rating a few films works today and
          takes about 90 seconds.
        </p>
      </div>

      <div className="mt-6 flex gap-3">
        <Link href="/onboarding/rate" className={buttonVariants({ size: "touch" })}>
          Rate films instead
        </Link>
        <Link
          href="/onboarding"
          className={buttonVariants({ variant: "ghost", size: "touch" })}
        >
          Back
        </Link>
      </div>
    </main>
  );
}
