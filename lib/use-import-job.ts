"use client";

import * as React from "react";

import { getImport, startImport, type ImportSource } from "@/lib/api/imports";
import type { ImportJob } from "@/lib/types";

/** How often to poll a running job. Matches the backend's progress cadence. */
const POLL_MS = 1500;

export type ImportJobState = {
  job: ImportJob | null;
  /** True from submit until the job settles, or the start call fails. */
  running: boolean;
  /** The startImport call itself failed (distinct from a job that ran and
   *  reported status "failed"). */
  startFailed: boolean;
  start: (source: ImportSource, file: File) => void;
  reset: () => void;
};

/**
 * Owns one import job: kicks it off, then polls until it is done or failed.
 * The shared engine behind both the settings import dialog and the onboarding
 * import step, so the two cannot drift. Side effects on completion (a toast, a
 * redirect) belong to the consumer, which watches `job.status`.
 */
export function useImportJob(): ImportJobState {
  const [job, setJob] = React.useState<ImportJob | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [startFailed, setStartFailed] = React.useState(false);

  // Poll while the job is in flight; stop on a terminal status or unmount.
  React.useEffect(() => {
    if (!job || (job.status !== "pending" && job.status !== "running")) return;
    let cancelled = false;
    const timer = setInterval(() => {
      getImport(job.id)
        .then((next) => {
          if (!cancelled) setJob(next);
        })
        .catch(() => {});
    }, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [job]);

  const start = React.useCallback((source: ImportSource, file: File) => {
    setBusy(true);
    setStartFailed(false);
    setJob(null);
    startImport(source, file)
      .then((j) => setJob(j))
      .catch(() => setStartFailed(true))
      .finally(() => setBusy(false));
  }, []);

  const reset = React.useCallback(() => {
    setJob(null);
    setStartFailed(false);
    setBusy(false);
  }, []);

  const running =
    busy || job?.status === "pending" || job?.status === "running";

  return { job, running, startFailed, start, reset };
}
