"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionHeader } from "./section-header";

/**
 * Paged carousel rail. The row always shows a whole number of cards (the
 * rail owns item widths as exact fractions per breakpoint), the scrollbar is
 * hidden, and the arrows slide one full row at a time with scroll-snap
 * keeping pages aligned. Touch users swipe the same track; the arrows stay
 * pointer-only since fingers never press them.
 */
function MediaRail({
  title,
  action,
  children,
}: {
  title: string;
  action?: { label: string; href: string };
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = React.useState(false);
  const [canRight, setCanRight] = React.useState(false);

  const update = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  React.useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  function page(dir: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    // Items are exact fractions of (100% minus gaps), so one page is the
    // visible width plus one gap; snap tidies any rounding.
    el.scrollBy({ left: dir * (el.clientWidth + GAP_PX), behavior: "smooth" });
  }

  return (
    <section>
      <div className="mb-4 flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <SectionHeader title={title} action={action} />
        </div>
        <div className="fine-only flex shrink-0 gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={`Scroll ${title} left`}
            disabled={!canLeft}
            onClick={() => page(-1)}
          >
            <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={2} />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={`Scroll ${title} right`}
            disabled={!canRight}
            onClick={() => page(1)}
          >
            <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2} />
          </Button>
        </div>
      </div>

      <div
        ref={ref}
        onScroll={update}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [--rail-n:3] sm:[--rail-n:4] md:[--rail-n:5] lg:[--rail-n:6] xl:[--rail-n:7]"
      >
        {React.Children.map(children, (child) =>
          child == null ? null : (
            <div className="w-[calc((100%-(var(--rail-n)-1)*0.75rem)/var(--rail-n))] shrink-0 snap-start">
              {child}
            </div>
          )
        )}
      </div>
    </section>
  );
}

/** Matches the track's gap-3. */
const GAP_PX = 12;

export { MediaRail };
