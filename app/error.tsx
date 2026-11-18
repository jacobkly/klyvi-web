"use client";

import { ErrorPanel } from "@/components/error-panel";

/**
 * Error boundary for every page: a thrown render or fetch error lands here
 * instead of a blank screen. retry() fetches again, which is what a failed
 * API call needs (reset() would only re-render the same failure).
 */
export default function ErrorBoundary({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  reset: () => void;
}) {
  return <ErrorPanel retry={retry} />;
}
