"use client";

import { Progress } from "@/components/ui/progress";
import type { ImportJob } from "@/lib/types";
import type { StartFailure } from "@/lib/use-import-job";

const START_FAILURE_COPY: Record<StartFailure, string> = {
  active:
    "You already have an import running. Wait for it to finish, then try again.",
  "too-large":
    "That file is too big to import. An import can hold up to 10,000 titles and 10 MB.",
  other: "Could not start the import. Check the file and try again.",
};

/**
 * The determinate percentage for a running or finished import, or null while
 * the row count is not known yet (the backend sets `total` right after it
 * parses the file, so this is null only for the brief read phase). A finished
 * job is always 100; an over-count clamps rather than overflowing the bar.
 */
export function importPercent(job: ImportJob): number | null {
  if (job.status === "done") return 100;
  if (job.total > 0) {
    const processed = job.matched + job.unmatched;
    return Math.min(100, Math.round((processed / job.total) * 100));
  }
  return null;
}

/**
 * The import's live progress: a violet fill (the app speaking, per the token
 * rules) that is indeterminate while the file is read, then determinate as
 * titles match, then a settled summary. A failed job shows its reason instead
 * of a bar; a failure to even start the job shows a short line. Renders
 * nothing when there is no job and nothing went wrong, so a consumer can mount
 * it unconditionally.
 */
export function ImportProgress({
  job,
  startFailure,
}: {
  job: ImportJob | null;
  startFailure?: StartFailure | null;
}) {
  if (startFailure) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {START_FAILURE_COPY[startFailure]}
      </p>
    );
  }

  if (!job) return null;

  if (job.status === "failed") {
    return (
      <p role="alert" className="text-sm text-destructive">
        {job.error ?? "The import failed. Try again."}
      </p>
    );
  }

  const pct = importPercent(job);
  const done = job.status === "done";
  const processed = job.matched + job.unmatched;

  return (
    <div className="flex flex-col gap-2">
      <Progress value={pct} aria-label="Import progress" />
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>
          {done
            ? "Import complete"
            : pct === null
              ? "Reading your export"
              : "Matching titles"}
        </span>
        <span data-numeric className="font-mono">
          {done
            ? `${job.matched} added · ${job.unmatched} skipped`
            : pct === null
              ? ""
              : `${processed} / ${job.total}`}
        </span>
      </div>

      {/* The rows that could not be matched, so the user can search and rate
          them by hand. Native details/summary: accessible, collapsed by
          default so a big unmatched list does not swamp the dialog. */}
      {done && job.unmatchedTitles.length > 0 ? (
        <details className="mt-1 text-xs">
          <summary className="cursor-pointer text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30">
            {job.unmatchedTitles.length} could not be matched
          </summary>
          <ul className="mt-2 flex max-h-40 flex-col gap-1 overflow-y-auto pl-1">
            {job.unmatchedTitles.map((t, i) => (
              <li key={`${t.title}-${t.year}-${i}`} className="text-muted-foreground">
                {t.title}
                {t.year ? (
                  <span data-numeric className="ml-1 font-mono text-muted-foreground/70">
                    {t.year}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
