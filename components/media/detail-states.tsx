import Link from "next/link";
import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/klyvi/empty-state";
import { buttonVariants } from "@/components/ui/button";

/** Error and not-found states for the detail pages (06-copy.md §media). */

export function DetailError() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-24 text-center md:px-6">
      <p className="text-[15px] font-semibold text-foreground">
        Could not load this title.
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Something went wrong on Klyvi&apos;s end.
      </p>
      {/* Server-rendered page: a fresh request IS the retry. */}
      <Link href="" className={buttonVariants() + " mt-5"}>
        Try again
      </Link>
    </main>
  );
}

export function DetailNotFound() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16 md:px-6">
      <EmptyState
        icon={SearchX}
        title="That title is not in the catalog"
        body="It may have been removed, or the link is wrong."
        action={{ label: "Explore the catalog", href: "/explore" }}
      />
    </main>
  );
}

export function SeasonNotFound({ tmdbId }: { tmdbId: number }) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16 md:px-6">
      <EmptyState
        icon={SearchX}
        title="That season does not exist"
        body="The series is here, but not that season number."
        action={{ label: "View all seasons", href: `/tv/${tmdbId}` }}
      />
    </main>
  );
}
