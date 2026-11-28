import { fireEvent, render, waitFor } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useLoadNearEnd } from "./use-load-near-end";

function rect(top: number, bottom = top): DOMRect {
  return { top, bottom, left: 0, right: 0, width: 0, height: bottom - top, x: 0, y: top, toJSON: () => ({}) };
}

/** A list end at `top`, on the page or inside a scrolling panel. */
function Harness({
  load,
  active = true,
  top,
  panel,
}: {
  load: () => void;
  active?: boolean;
  top: number;
  panel?: { bottom: number; height: number };
}) {
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    vi.spyOn(sentinelRef.current!, "getBoundingClientRect").mockReturnValue(rect(top));
    if (panel && panelRef.current) {
      vi.spyOn(panelRef.current, "getBoundingClientRect").mockReturnValue(
        rect(panel.bottom - panel.height, panel.bottom)
      );
      Object.defineProperty(panelRef.current, "clientHeight", { value: panel.height });
    }
  });
  useLoadNearEnd(sentinelRef, load, active, 0);
  const end = <div ref={sentinelRef} />;
  return panel ? (
    <div ref={panelRef} data-testid="panel" style={{ overflowY: "auto" }}>
      {end}
    </div>
  ) : (
    end
  );
}

afterEach(() => vi.restoreAllMocks());

describe("useLoadNearEnd", () => {
  it("loads when the end of the page is within three screens", async () => {
    const load = vi.fn();
    render(<Harness load={load} top={window.innerHeight * 2.5} />);
    await waitFor(() => expect(load).toHaveBeenCalled());
  });

  it("waits while the end is further off", async () => {
    const load = vi.fn();
    render(<Harness load={load} top={window.innerHeight * 4} />);
    await new Promise((r) => window.requestAnimationFrame(r));
    expect(load).not.toHaveBeenCalled();
  });

  it("does nothing while inactive", async () => {
    const load = vi.fn();
    render(<Harness load={load} active={false} top={10} />);
    await new Promise((r) => window.requestAnimationFrame(r));
    expect(load).not.toHaveBeenCalled();
  });

  it("measures a scrolling panel by the panel, not the window", async () => {
    const load = vi.fn();
    // Within three screens of the window, but four panels below the panel.
    const top = 500 + 300 * 4;
    expect(top).toBeLessThan(window.innerHeight * 3);
    const { rerender, getByTestId } = render(
      <Harness load={load} top={top} panel={{ bottom: 500, height: 300 }} />
    );
    await new Promise((r) => window.requestAnimationFrame(r));
    expect(load).not.toHaveBeenCalled();

    // Scrolled until the end is a screen below the panel.
    rerender(<Harness load={load} top={800} panel={{ bottom: 500, height: 300 }} />);
    fireEvent.scroll(getByTestId("panel"));
    expect(load).toHaveBeenCalled();
  });
});
