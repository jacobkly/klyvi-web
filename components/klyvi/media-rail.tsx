"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionHeader } from "./section-header";

/**
 * Horizontal rail with scroll arrows. Arrows appear only when there is
 * actually something to scroll to and only on pointer devices, since touch
 * users swipe and would just lose poster width to buttons they never press.
 * The rail keeps its overflow scroll at every width (05-responsive.md §4).
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

  function scrollBy(dir: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: "smooth" });
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
            onClick={() => scrollBy(-1)}
          >
            <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={2} />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={`Scroll ${title} right`}
            disabled={!canRight}
            onClick={() => scrollBy(1)}
          >
            <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2} />
          </Button>
        </div>
      </div>

      <div
        ref={ref}
        onScroll={update}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]"
      >
        {children}
      </div>
    </section>
  );
}

export { MediaRail };
