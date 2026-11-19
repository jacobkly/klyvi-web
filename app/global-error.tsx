"use client";

import "./globals.css";

import { useEffect } from "react";

import { ErrorPanel } from "@/components/error-panel";
import { reportError } from "@/lib/api/errors";

/**
 * Last-resort boundary for a crash in the root layout itself, which
 * app/error.tsx sits inside and so cannot catch. It replaces the layout, so
 * it brings its own html and body (and the dark class the layout sets).
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    void reportError(error, error.digest);
  }, [error]);

  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-background">
        <title>Something broke · Klyvi</title>
        <ErrorPanel retry={retry} />
      </body>
    </html>
  );
}
