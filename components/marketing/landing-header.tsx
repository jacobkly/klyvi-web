import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The one section-header treatment for the whole landing page: a violet
 * uppercase eyebrow, a balanced heading, and a supporting line. Every
 * section uses it so the page reads as one voice. `align="split"` puts the
 * heading left and the line right (the stats band); the default centers
 * all three (features, the demo).
 */
export function LandingHeader({
  eyebrow,
  title,
  lead,
  align = "center",
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead: React.ReactNode;
  align?: "center" | "split";
  className?: string;
}) {
  const eyebrowEl = (
    <p className="text-xs font-medium tracking-[0.14em] text-violet-text uppercase">
      {eyebrow}
    </p>
  );
  const titleEl = (
    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
      {title}
    </h2>
  );
  const leadEl = (
    <p className="text-[15px] leading-relaxed text-muted-foreground">{lead}</p>
  );

  if (align === "split") {
    return (
      <div
        className={cn(
          "grid items-end gap-6 lg:grid-cols-[1fr_minmax(0,26rem)]",
          className
        )}
      >
        <div>
          {eyebrowEl}
          {titleEl}
        </div>
        <div className="lg:pb-1 lg:text-right">{leadEl}</div>
      </div>
    );
  }

  return (
    <div className={cn("mx-auto max-w-2xl text-center", className)}>
      {eyebrowEl}
      {titleEl}
      <div className="mt-3">{leadEl}</div>
    </div>
  );
}
