"use client";

import { useEffect } from "react";

import { ErrorPanel } from "@/components/error-panel";
import { reportError } from "@/lib/api/errors";

/**
 * Error boundary for every page: a thrown render or fetch error lands here
 * instead of a blank screen. retry() fetches again, which is what a failed
 * API call needs (reset() would only re-render the same failure). The error
 * goes to the API's error log, with the digest that ties a server render
 * error to its server log line.
 */
export default function ErrorBoundary({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  reset: () => void;
}) {
  useEffect(() => {
    void reportError(error, error.digest);
  }, [error]);

  return <ErrorPanel retry={retry} />;
}
