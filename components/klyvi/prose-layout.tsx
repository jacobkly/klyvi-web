import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The 720px reading column for terms, privacy, donate, and other prose pages.
 * Content styled through descendant selectors so the legal pages can be plain
 * markup without per-element classes.
 */
function ProseLayout({
  title,
  updated,
  children,
  className,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        "mx-auto w-full max-w-[720px] px-4 py-12 sm:py-16",
        className
      )}
    >
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      {updated ? (
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          Updated {updated}
        </p>
      ) : null}
      <div
        className={cn(
          "mt-8 text-[15px] leading-relaxed text-muted-foreground",
          "[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground",
          "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground",
          "[&_p]:mb-4",
          "[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1",
          "[&_a]:text-violet-text [&_a]:underline-offset-4 hover:[&_a]:underline",
          "[&_strong]:font-semibold [&_strong]:text-foreground"
        )}
      >
        {children}
      </div>
    </main>
  );
}

export { ProseLayout };
