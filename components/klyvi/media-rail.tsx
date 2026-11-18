"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SectionHeader } from "./section-header";

/**
 * Paged carousel rail. On a phone the row shows 2.4 cards, so the cut card
 * says "swipe for more". From sm up it shows a whole number of cards (the
 * rail owns item widths as exact fractions per breakpoint) and the arrows
 * slide one full row at a time, with scroll-snap keeping pages aligned.
 *
 * The arrows sit over the row's edges and only where there is more to see.
 * They are pointer-only, since fingers swipe the same track. A cut edge fades
 * out rather than chopping a poster in half.
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
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  // Rails usually mount on skeletons and fill in later. The track's own size
  // doesn't change when they do, so the observer above can't see it.
  React.useEffect(update, [children, update]);

  function page(dir: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    // Items are exact fractions of (100% minus gaps), so one page is the
    // visible width plus one gap; snap tidies any rounding.
    el.scrollBy({ left: dir * (el.clientWidth + GAP_PX), behavior: "smooth" });
  }

  const fade = `linear-gradient(to right, ${canLeft ? "transparent" : "#000"}, #000 ${FADE_PX}px, #000 calc(100% - ${FADE_PX}px), ${canRight ? "transparent" : "#000"})`;

  return (
    <section>
      <SectionHeader title={title} action={action} className="mb-4" />

      <div className="relative">
        <div
          ref={ref}
          onScroll={update}
          data-can-left={canLeft}
          data-can-right={canRight}
          style={{ maskImage: fade, WebkitMaskImage: fade }}
          className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [--rail-n:2.4] sm:[--rail-n:4] md:[--rail-n:5] lg:[--rail-n:6] xl:[--rail-n:7]"
        >
          {React.Children.map(children, (child) =>
            child == null ? null : (
              <div className="w-[calc((100%-(var(--rail-n)-1)*0.75rem)/var(--rail-n))] shrink-0 snap-start pt-1">
                {child}
              </div>
            )
          )}
        </div>

        {canLeft ? (
          <RailArrow side="left" title={title} onClick={() => page(-1)} />
        ) : null}
        {canRight ? (
          <RailArrow side="right" title={title} onClick={() => page(1)} />
        ) : null}
      </div>
    </section>
  );
}

function RailArrow({
  side,
  title,
  onClick,
}: {
  side: "left" | "right";
  title: string;
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <Button
      variant="outline"
      size="icon-sm"
      aria-label={`Scroll ${title} ${side}`}
      onClick={onClick}
      className={cn(
        "fine-only absolute top-[38%] z-10 -translate-y-1/2 bg-background/90 backdrop-blur-sm",
        side === "left" ? "-left-3" : "-right-3"
      )}
    >
      <Icon aria-hidden="true" className="size-4" strokeWidth={2} />
    </Button>
  );
}

/** How far a cut edge fades. */
const FADE_PX = 24;

/** Matches the track's gap-3. */
const GAP_PX = 12;

export { MediaRail };
