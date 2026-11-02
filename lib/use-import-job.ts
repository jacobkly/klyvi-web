"use client";

import * as React from "react";

import { ApiError } from "@/lib/api/http";
import { getImport, startImport, type ImportSource } from "@/lib/api/imports";
import type { ImportJob } from "@/lib/types";

/** How often to poll a running job. Matches the backend's progress cadence. */
const POLL_MS = 1500;

/** Why the API refused to start an import: one already running (409), a
 *  file over the size or title cap (413), or anything else. */
export type StartFailure = "active" | "too-large" | "other";

export function startFailure(err: unknown): StartFailure {
  if (err instanceof ApiError) {
    if (err.status === 409) return "active";
    if (err.status === 413) return "too-large";
  }
  return "other";
}

export type ImportJobState = {
  job: ImportJob | null;
  /** True from submit until the job settles, or the start call fails. */
  running: boolean;
  /** Set when the startImport call itself failed (distinct from a job that
   *  ran and reported status "failed"). */
  startFailure: StartFailure | null;
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
  const [failure, setFailure] = React.useState<StartFailure | null>(null);

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
    setFailure(null);
    setJob(null);
    startImport(source, file)
      .then((j) => setJob(j))
      .catch((err: unknown) => setFailure(startFailure(err)))
      .finally(() => setBusy(false));
  }, []);

  const reset = React.useCallback(() => {
    setJob(null);
    setFailure(null);
    setBusy(false);
  }, []);

  const running =
    busy || job?.status === "pending" || job?.status === "running";

  return { job, running, startFailure: failure, start, reset };
}
