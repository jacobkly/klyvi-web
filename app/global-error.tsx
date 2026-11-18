"use client";

import "./globals.css";

import { ErrorPanel } from "@/components/error-panel";

/**
 * Last-resort boundary for a crash in the root layout itself, which
 * app/error.tsx sits inside and so cannot catch. It replaces the layout, so
 * it brings its own html and body (and the dark class the layout sets).
 */
export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-background">
        <title>Something broke · Klyvi</title>
        <ErrorPanel retry={retry} />
      </body>
    </html>
  );
}
